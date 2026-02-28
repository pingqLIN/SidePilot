// ============================================
// SidePilot Copilot Bridge — Worker Process
// Runs the Express HTTP server and manages ACP sessions.
// Launched by supervisor.ts via child_process.fork().
// Can also run standalone for development.
// ============================================

import express from 'express';
import cors from 'cors';
import { SessionManager } from './session-manager.js';
import type { SupervisorMessage, WorkerReadyMessage, WorkerHeartbeatMessage } from './ipc-types.js';

const PORT = parseInt(process.env.PORT || '31031', 10);
const HEARTBEAT_INTERVAL_MS = 10_000;
const isForked = !!process.send;

const app = express();

// --- Middleware ---
app.use(cors({
  origin: '*', // Chrome extension context
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

// --- Session Manager (singleton) ---
const sessionManager = new SessionManager();

// ============================================
// Routes
// ============================================

/**
 * GET /health
 * Health check endpoint — mode-manager.js 用這個判斷 SDK 模式是否可用
 */
app.get('/health', (_req, res) => {
  const state = sessionManager.getState();
  const backend = sessionManager.getBackendInfo();
  res.json({
    status: 'ok',
    service: 'sidepilot-copilot-bridge',
    sdk: state,
    backend,
  });
});

/**
 * GET /api/models
 * 列出可用模型
 */
app.get('/api/models', async (_req, res) => {
  try {
    const models = await sessionManager.listModels();
    res.json({ success: true, models });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/sessions
 * 建立新 session
 * Body: { model?: string, systemMessage?: string }
 */
app.post('/api/sessions', async (req, res) => {
  try {
    const { model, systemMessage } = req.body;
    const session = await sessionManager.createSession({ model, systemMessage });
    res.json({ success: true, sessionId: session.sessionId });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/sessions
 * 列出所有 sessions
 */
app.get('/api/sessions', async (_req, res) => {
  try {
    const sessions = await sessionManager.listSessions();
    res.json({ success: true, sessions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/sessions/:id
 * 刪除指定 session
 */
app.delete('/api/sessions/:id', async (req, res) => {
  try {
    await sessionManager.deleteSession(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/chat
 * 傳送訊息並以 SSE 串流回應
 * Body: { sessionId?: string, prompt: string, model?: string }
 * 
 * 回應格式: Server-Sent Events (text/event-stream)
 *   event: delta     → { content: string }
 *   event: message   → { content: string }   (最終完整回應)
 *   event: tool      → { name, status, result }
 *   event: error     → { message: string }
 *   event: done      → {}
 */
app.post('/api/chat', async (req, res) => {
  const { sessionId, prompt, model } = req.body;

  if (!prompt) {
    res.status(400).json({ success: false, error: 'prompt is required' });
    return;
  }

  // --- SSE Headers ---
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // 取得或建立 session
    const session = await sessionManager.getOrCreateSession(sessionId, { model });
    const result = await sessionManager.sendPrompt(session.sessionId, prompt, (update) => {
      if (update?.sessionUpdate === 'agent_message_chunk') {
        const content = update?.content;
        if (content?.type === 'text' && content?.text) {
          sendEvent('delta', { content: content.text });
        }
        return;
      }

      if (update?.sessionUpdate === 'tool_call') {
        sendEvent('tool', {
          name: update?.title || update?.kind || 'tool_call',
          status: update?.status || 'start',
        });
        return;
      }

      if (update?.sessionUpdate === 'tool_call_update') {
        sendEvent('tool', {
          name: update?.toolCallId || 'tool_call_update',
          status: update?.status || 'update',
          result: update,
        });
      }
    });

    sendEvent('message', { content: result.content || '' });
    sendEvent('done', {});
    res.end();
  } catch (err: any) {
    sendEvent('error', { message: err.message });
    res.end();
  }
});

/**
 * POST /api/chat/sync
 * 同步傳送訊息（等待完成後回傳）
 * Body: { sessionId?: string, prompt: string, model?: string }
 */
app.post('/api/chat/sync', async (req, res) => {
  const { sessionId, prompt, model } = req.body;

  if (!prompt) {
    res.status(400).json({ success: false, error: 'prompt is required' });
    return;
  }

  try {
    const session = await sessionManager.getOrCreateSession(sessionId, { model });
    const response = await sessionManager.sendPrompt(session.sessionId, prompt);

    res.json({
      success: true,
      sessionId: response.sessionId,
      content: response?.content ?? '',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================
// Server Lifecycle
// ============================================

const server = app.listen(PORT, () => {
  console.log(`✈️  SidePilot Copilot Bridge running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);

  // Notify supervisor that worker is ready
  if (isForked && process.send) {
    process.send({ type: 'ready', port: PORT } satisfies WorkerReadyMessage);
  }
});

// --- IPC: Heartbeat & Supervisor messages ---
if (isForked && process.send) {
  const heartbeatTimer = setInterval(() => {
    process.send!({ type: 'heartbeat' } satisfies WorkerHeartbeatMessage);
  }, HEARTBEAT_INTERVAL_MS);
  heartbeatTimer.unref();

  process.on('message', (msg: SupervisorMessage) => {
    if (msg?.type === 'shutdown') {
      clearInterval(heartbeatTimer);
      shutdown();
    }
  });
}

// Graceful shutdown
const shutdown = async () => {
  console.log('\n🛬 Shutting down bridge...');
  await sessionManager.cleanup();
  server.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
