// ============================================
// SidePilot Copilot Bridge Server
// Lightweight HTTP bridge between Chrome Extension and GitHub Copilot CLI SDK
// ============================================

import express from 'express';
import cors from 'cors';
import { SessionManager } from './session-manager.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
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
  res.json({
    status: 'ok',
    service: 'sidepilot-copilot-bridge',
    sdk: state,
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

    // 訂閱事件
    const unsubscribe = session.on((event: any) => {
      switch (event.type) {
        case 'assistant.message_delta':
          sendEvent('delta', { content: event.data.deltaContent });
          break;
        case 'assistant.message':
          sendEvent('message', { content: event.data.content });
          break;
        case 'tool.execution_start':
          sendEvent('tool', {
            name: event.data.toolName,
            status: 'start',
          });
          break;
        case 'tool.execution_end':
          sendEvent('tool', {
            name: event.data.toolName,
            status: 'end',
            result: event.data.result,
          });
          break;
        case 'session.idle':
          sendEvent('done', {});
          unsubscribe();
          res.end();
          break;
      }
    });

    // 傳送訊息
    await session.send({ prompt });

    // 客戶端斷開時清理
    req.on('close', () => {
      unsubscribe();
    });
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
    const response = await session.sendAndWait({ prompt }, 60_000);

    res.json({
      success: true,
      sessionId: session.sessionId,
      content: response?.data?.content ?? '',
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
});

// Graceful shutdown
const shutdown = async () => {
  console.log('\n🛬 Shutting down bridge...');
  await sessionManager.cleanup();
  server.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
