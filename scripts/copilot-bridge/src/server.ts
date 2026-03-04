// ============================================
// SidePilot Copilot Bridge — Worker Process
// Runs the Express HTTP server and manages ACP sessions.
// Launched by supervisor.ts via child_process.fork().
// Can also run standalone for development.
// ============================================

import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SessionManager } from './session-manager.js';
import type { PendingPermission } from './session-manager.js';
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
app.use(express.json({ limit: '20mb' }));

// --- Session Manager (singleton) ---
const sessionManager = new SessionManager();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BRIDGE_ROOT = resolve(__dirname, '..');
const PROJECT_ROOT = resolve(BRIDGE_ROOT, '..', '..');
const SEAL_SCRIPT_PATH = join(PROJECT_ROOT, 'scripts', 'seal-integrity.mjs');
const VERIFY_SCRIPT_PATH = join(PROJECT_ROOT, 'scripts', 'verify-integrity.mjs');

function ensureExtensionOrigin(req: Request, res: Response): boolean {
  const origin = String(req.headers.origin || '');
  if (!origin.startsWith('chrome-extension://')) {
    res.status(403).json({
      success: false,
      error: 'forbidden origin',
      origin
    });
    return false;
  }
  return true;
}

function runNodeScript(
  scriptPath: string,
  options: { args?: string[]; timeoutMs?: number } = {}
): Promise<{
  code: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}> {
  const timeoutMs = Number.isFinite(options.timeoutMs) ? Number(options.timeoutMs) : 30_000;
  const args = [scriptPath, ...(options.args || [])];

  return new Promise((resolveRun, rejectRun) => {
    if (!existsSync(scriptPath)) {
      rejectRun(new Error(`script not found: ${scriptPath}`));
      return;
    }

    const startedAt = Date.now();
    const child = spawn(process.execPath, args, {
      cwd: PROJECT_ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false
    });

    let stdout = '';
    let stderr = '';
    let settled = false;

    const hardTimeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      try { child.kill(); } catch { /* ignore */ }
      rejectRun(new Error(`process timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.on('data', (chunk: Buffer) => {
      if (stdout.length < 16_000) stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk: Buffer) => {
      if (stderr.length < 16_000) stderr += chunk.toString();
    });

    child.on('error', (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(hardTimeout);
      rejectRun(err);
    });

    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(hardTimeout);
      resolveRun({
        code: code ?? 1,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        durationMs: Date.now() - startedAt
      });
    });
  });
}

function runSealIntegrityScript(options: { dryRun?: boolean; timeoutMs?: number } = {}): Promise<{
  code: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}> {
  const dryRun = !!options.dryRun;
  const timeoutMs = Number.isFinite(options.timeoutMs) ? Number(options.timeoutMs) : 30_000;
  const args = dryRun ? ['--dry'] : [];
  return runNodeScript(SEAL_SCRIPT_PATH, { args, timeoutMs });
}

function runVerifyIntegrityScript(options: { timeoutMs?: number } = {}): Promise<{
  code: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}> {
  const timeoutMs = Number.isFinite(options.timeoutMs) ? Number(options.timeoutMs) : 30_000;
  return runNodeScript(VERIFY_SCRIPT_PATH, { timeoutMs });
}

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

// ============================================
// WP-01: Permission API
// ============================================

const permissionSSEClients = new Set<import('express').Response>();

/**
 * GET /api/permissions
 * 列出所有待處理的權限請求
 */
app.get('/api/permissions', (_req, res) => {
  const pending = sessionManager.getPendingPermissions();
  res.json({
    success: true,
    permissions: pending.map(p => ({
      id: p.id,
      sessionId: p.sessionId,
      scope: p.scope,
      reason: p.reason,
      options: p.options,
      timestamp: p.timestamp,
    }))
  });
});

/**
 * POST /api/permission/resolve
 * 解決權限請求（approve / deny）
 * Body: { id: string, approved: boolean, optionId?: string }
 */
app.post('/api/permission/resolve', (req, res) => {
  const { id, approved, optionId } = req.body;
  if (!id) {
    res.status(400).json({ success: false, error: 'id is required' });
    return;
  }
  const resolved = sessionManager.resolvePermission(id, !!approved, optionId);
  if (!resolved) {
    res.status(404).json({ success: false, error: `Permission ${id} not found or already resolved` });
    return;
  }
  res.json({ success: true });
});

/**
 * GET /api/permissions/whitelist
 * 取得白名單
 */
app.get('/api/permissions/whitelist', (_req, res) => {
  res.json({ success: true, whitelist: sessionManager.getPermissionWhitelist() });
});

/**
 * POST /api/permissions/whitelist
 * 更新白名單
 * Body: { patterns: string[] }
 */
app.post('/api/permissions/whitelist', (req, res) => {
  const { patterns } = req.body;
  if (!Array.isArray(patterns)) {
    res.status(400).json({ success: false, error: 'patterns must be an array' });
    return;
  }
  sessionManager.setPermissionWhitelist(patterns);
  res.json({ success: true, whitelist: sessionManager.getPermissionWhitelist() });
});

/**
 * GET /api/permissions/stream
 * SSE 即時推送權限請求
 */
app.get('/api/permissions/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  res.write('data: {"connected":true}\n\n');
  permissionSSEClients.add(res);
  req.on('close', () => { permissionSSEClients.delete(res); });
});

// WP-01: 訂閱 permission 事件，推送給 SSE clients
sessionManager.onPermissionRequest((permission: PendingPermission) => {
  const data = JSON.stringify({
    id: permission.id,
    sessionId: permission.sessionId,
    scope: permission.scope,
    reason: permission.reason,
    options: permission.options,
    timestamp: permission.timestamp,
  });
  for (const client of permissionSSEClients) {
    try { client.write(`event: permission_required\ndata: ${data}\n\n`); } catch { /* ignore */ }
  }
});

// ============================================
// WP-04: Config API / WP-05: Model Cache / WP-07: Prompt Strategy
// ============================================

/** GET /api/config — effective config（不含 secrets） */
app.get('/api/config', (_req, res) => {
  res.json({ success: true, config: sessionManager.getConfig() });
});

/** GET /api/models/info — model 列表來源與快取資訊 */
app.get('/api/models/info', (_req, res) => {
  res.json({ success: true, cacheInfo: sessionManager.getModelCacheInfo() });
});

/** GET /api/prompt/strategy — 取得 prompt 策略 */
app.get('/api/prompt/strategy', (_req, res) => {
  res.json({
    success: true,
    strategy: sessionManager.getPromptStrategy(),
    maxHistoryTurns: sessionManager.getMaxHistoryTurns()
  });
});

/** POST /api/prompt/strategy — 設定 prompt 策略 */
app.post('/api/prompt/strategy', (req, res) => {
  const { strategy, maxHistoryTurns } = req.body;
  const valid = ['normal', 'concise', 'one-sentence'];
  if (!valid.includes(strategy)) {
    res.status(400).json({ success: false, error: `strategy must be one of: ${valid.join(', ')}` });
    return;
  }
  sessionManager.setPromptStrategy(strategy);
  if (typeof maxHistoryTurns === 'number') {
    if (
      !Number.isFinite(maxHistoryTurns) ||
      !Number.isInteger(maxHistoryTurns) ||
      maxHistoryTurns < 1 ||
      maxHistoryTurns > 1000
    ) {
      res.status(400).json({ success: false, error: 'maxHistoryTurns must be an integer between 1 and 1000' });
      return;
    }
    sessionManager.setMaxHistoryTurns(maxHistoryTurns);
  }
  res.json({
    success: true,
    strategy: sessionManager.getPromptStrategy(),
    maxHistoryTurns: sessionManager.getMaxHistoryTurns()
  });
});

/**
 * POST /api/integrity/auto-seal
 * 受限用途：自我疊代模式首次啟用時，由本機 Bridge 代執行 seal 腳本
 * Body: { dryRun?: boolean, timeoutMs?: number }
 */
app.post('/api/integrity/auto-seal', async (req, res) => {
  if (!ensureExtensionOrigin(req, res)) return;
  const dryRun = !!req.body?.dryRun;
  const timeoutMs = Number(req.body?.timeoutMs) || 30_000;

  try {
    const result = await runSealIntegrityScript({ dryRun, timeoutMs });
    if (result.code !== 0) {
      res.status(500).json({
        success: false,
        error: `seal script exited with code ${result.code}`,
        ...result
      });
      return;
    }

    res.json({
      success: true,
      dryRun,
      ...result
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || String(err)
    });
  }
});

/**
 * POST /api/integrity/verify
 * 受限用途：提供 background/sidepanel 外部完整性驗證（不暴露演算法到 extension）
 * Body: { timeoutMs?: number }
 */
app.post('/api/integrity/verify', async (req, res) => {
  if (!ensureExtensionOrigin(req, res)) return;
  const timeoutMs = Number(req.body?.timeoutMs) || 30_000;

  try {
    const result = await runVerifyIntegrityScript({ timeoutMs });
    const success = result.code === 0;

    res.status(success ? 200 : 409).json({
      success,
      error: success ? null : `verify script exited with code ${result.code}`,
      ...result
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || String(err)
    });
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
  const { sessionId, prompt, model, images } = req.body;

  if (!prompt) {
    res.status(400).json({ success: false, error: 'prompt is required' });
    return;
  }

  // --- SSE Headers (WP-08: 加入 no-transform 避免中介層暫存) ---
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // 取得或建立 session
    const session = await sessionManager.getOrCreateSession(sessionId, { model });
    // WP-02: 傳遞 timeout 到 sendPrompt
    const timeout = req.body.timeout ? parseInt(req.body.timeout, 10) : undefined;
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
    }, images, timeout);

    sendEvent('message', { content: result.content || '' });
    sendEvent('done', {});
    res.end();

    // Auto-record to history
    const sid = result.sessionId || sessionId || 'unknown';
    appendToHistory({ role: 'user', content: prompt, sessionId: sid });
    appendToHistory({ role: 'assistant', content: result.content || '', sessionId: sid });
  } catch (err: any) {
    sendEvent('error', { message: err.message });
    res.end();
  }
});

/**
 * POST /api/chat/sync
 * 同步傳送訊息（等待完成後回傳）
 * Body: { sessionId?: string, prompt: string, model?: string, images?: Array<{mimeType, data}> }
 */
app.post('/api/chat/sync', async (req, res) => {
  const { sessionId, prompt, model, images } = req.body;

  if (!prompt) {
    res.status(400).json({ success: false, error: 'prompt is required' });
    return;
  }

  try {
    const session = await sessionManager.getOrCreateSession(sessionId, { model });
    // WP-02: 傳遞 timeout
    const timeout = req.body.timeout ? parseInt(req.body.timeout, 10) : undefined;
    const response = await sessionManager.sendPrompt(session.sessionId, prompt, undefined, images, timeout);

    // Auto-record to history
    const sid = response.sessionId || sessionId || 'unknown';
    appendToHistory({ role: 'user', content: prompt, sessionId: sid });
    appendToHistory({ role: 'assistant', content: response?.content ?? '', sessionId: sid });

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
// Logs API (real-time bridge terminal output)
// ============================================

const logSSEClients = new Set<import('express').Response>();

app.get('/api/logs', (_req, res) => {
  const count = Math.min(Number(_req.query.count) || 200, 500);
  res.json({ success: true, logs: sessionManager.getRecentLogs(count) });
});

app.get('/api/logs/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  res.write('data: {"connected":true}\n\n');
  logSSEClients.add(res);

  // Send recent logs as initial batch
  const recent = sessionManager.getRecentLogs(50);
  for (const entry of recent) {
    res.write(`data: ${JSON.stringify(entry)}\n\n`);
  }

  const unsubscribe = sessionManager.onLog((entry) => {
    try { res.write(`data: ${JSON.stringify(entry)}\n\n`); } catch { /* ignore */ }
  });

  req.on('close', () => {
    logSSEClients.delete(res);
    unsubscribe();
  });
});

// ============================================
// History API
// ============================================

import { readdir, readFile, appendFile, mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';

const HISTORY_DIR = process.env.SIDEPILOT_HISTORY_DIR || join(homedir(), 'copilot', 'history');
const historySSEClients = new Set<import('express').Response>();

function getHistoryFilePath(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  return join(HISTORY_DIR, `history_${dateStr}.jsonl`);
}

async function appendToHistory(entry: Record<string, unknown>): Promise<void> {
  try {
    await mkdir(HISTORY_DIR, { recursive: true });
    const filePath = getHistoryFilePath();
    const line = JSON.stringify({ ...entry, timestamp: new Date().toISOString() }) + '\n';
    await appendFile(filePath, line, 'utf-8');

    // Push to SSE clients
    for (const client of historySSEClients) {
      try {
        client.write(`data: ${JSON.stringify(entry)}\n\n`);
      } catch {
        historySSEClients.delete(client);
      }
    }
  } catch (err: any) {
    console.error('[History] Failed to append:', err.message);
  }
}

app.get('/api/history', async (_req, res) => {
  try {
    await mkdir(HISTORY_DIR, { recursive: true });
    const entries = await readdir(HISTORY_DIR);
    const files = entries
      .filter(f => f.startsWith('history_') && f.endsWith('.jsonl'))
      .sort()
      .reverse()
      .map(name => ({
        name,
        path: join(HISTORY_DIR, name),
        date: name.replace('history_', '').replace('.jsonl', '')
      }));
    res.json({ success: true, files });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/history/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  res.write('data: {"connected":true}\n\n');
  historySSEClients.add(res);

  req.on('close', () => {
    historySSEClients.delete(res);
  });
});

app.get('/api/history/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    if (!filename.startsWith('history_') || !filename.endsWith('.jsonl')) {
      res.status(400).json({ success: false, error: 'Invalid filename' });
      return;
    }
    const filePath = join(HISTORY_DIR, filename);
    if (!existsSync(filePath)) {
      res.json({ success: true, messages: [] });
      return;
    }
    const raw = await readFile(filePath, 'utf-8');
    const messages = raw
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try { return JSON.parse(line); } catch { return null; }
      })
      .filter(Boolean);
    res.json({ success: true, messages });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/history', async (req, res) => {
  try {
    const entry = req.body;
    if (!entry || typeof entry !== 'object') {
      res.status(400).json({ success: false, error: 'Body must be a JSON object' });
      return;
    }
    await appendToHistory(entry);
    res.json({ success: true });
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
    try {
      if (msg?.type === 'shutdown') {
        clearInterval(heartbeatTimer);
        shutdown();
      }
    } catch (err) {
      console.error('[IPC] Error handling message:', err);
    }
  });
}

// Graceful shutdown
const shutdown = async () => {
  console.log('\n🛬 Shutting down bridge...');
  await sessionManager.cleanup();
  await new Promise<void>((resolve, reject) => {
    server.close((err) => {
      if (err) {
        console.error('[Shutdown] Error closing server:', err.message);
        reject(err);
      } else {
        resolve();
      }
    });
  }).catch(() => { });
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

process.on('uncaughtException', (err) => {
  console.error('[Bridge] Uncaught exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Bridge] Unhandled rejection:', reason);
});
