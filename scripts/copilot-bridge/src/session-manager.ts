// ============================================
// Session Manager (ACP)
// Manages `copilot --acp --stdio` sessions
// WP-01: Permission 前端確認佇列
// WP-02: Request Timeout + AbortController
// WP-04: 環境變數集中式 config resolver
// WP-05: Model 列表動態化 + TTL 快取
// WP-07: Prompt 策略切換
// ============================================

import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { Writable, Readable } from 'node:stream';
import * as acp from '@agentclientprotocol/sdk';

const IS_WINDOWS = process.platform === 'win32';

// ============================================
// WP-04: 集中式 Config Resolver
// 優先序：request override > env > default
// ============================================
const CONFIG = {
  cliPath: process.env.GITHUB_COPILOT_CLI_PATH || 'copilot',
  timeoutMs: parseInt(process.env.GITHUB_COPILOT_TIMEOUT || '120000', 10),
  logLevel: (process.env.GITHUB_COPILOT_LOG_LEVEL || 'info') as 'debug' | 'info' | 'warn' | 'error',
};

// WP-02: 可配置 timeout（優先序：request override > env > default）
const DEFAULT_TIMEOUT_MS = CONFIG.timeoutMs;

// WP-07: Prompt 策略類型
export type PromptStrategy = 'normal' | 'concise' | 'one-sentence';

// WP-07: Prompt 策略後綴註解
const PROMPT_STRATEGY_SUFFIXES: Record<PromptStrategy, string> = {
  'normal': '',
  'concise': '\n\nBe concise. Respond with clear, brief answers.',
  'one-sentence': '\n\nAnswer in exactly one sentence. Be extremely brief.'
};

interface SessionConfig {
  model?: string;
  systemMessage?: string;
}

// WP-01: Permission 請求佇列項目
export interface PendingPermission {
  id: string;
  sessionId: string;
  scope: string;
  reason: string;
  options: any[];
  timestamp: number;
  resolve: (result: any) => void;
}

interface ManagedSession {
  sessionId: string;
  connection: acp.ClientSideConnection;
  process: ChildProcessWithoutNullStreams;
  model: string;
  systemMessage?: string;
  listeners: Set<(update: any) => void>;
}

const DEFAULT_MODEL = process.env.COPILOT_MODEL || 'gpt-4.1';
const DEFAULT_MODELS = [
  'gpt-4.1',
  'gpt-5',
  'gpt-5.1',
  'gpt-5.2',
  'o4-mini',
  'claude-sonnet-4.5'
];

const CUSTOM_MODELS = (process.env.COPILOT_MODELS || '')
  .split(',')
  .map(item => item.trim())
  .filter(Boolean);

const MODEL_LIST = Array.from(new Set([DEFAULT_MODEL, ...CUSTOM_MODELS, ...DEFAULT_MODELS]));

// WP-05: Model 快取（TTL 10 分鐘）
interface ModelCache {
  models: string[];
  source: 'dynamic' | 'fallback';
  timestamp: number;
}
const MODEL_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
let modelCache: ModelCache | null = null;

// WP-01: 權限白名單 — 低風險操作可自動 approve
const PERMISSION_WHITELIST: string[] = [
  'readTextFile',   // 讀取檔案（低風險）
  'listDirectory',  // 列出目錄（低風險）
];

// WP-01: Permission 等待超時（60s 無操作自動 deny）
const PERMISSION_TIMEOUT_MS = 60_000;

// WP-01: 產生唯一 permission request ID
let permissionIdCounter = 0;
function generatePermissionId(): string {
  return `perm_${Date.now()}_${++permissionIdCounter}`;
}

function extractTextFromUpdate(update: any): string {
  if (!update || typeof update !== 'object') return '';

  if (update.sessionUpdate === 'agent_message_chunk') {
    const block = update.content;
    if (block?.type === 'text' && typeof block.text === 'string') {
      return block.text;
    }
  }

  return '';
}

export class SessionManager {
  private sessions = new Map<string, ManagedSession>();
  private state: 'idle' | 'ready' | 'connected' = 'idle';
  private defaultModel: string;
  private logBuffer: Array<{ ts: string; level: string; message: string }> = [];
  private logListeners = new Set<(entry: { ts: string; level: string; message: string }) => void>();
  private static readonly LOG_MAX = 500;

  // WP-01: Permission 佇列 & 事件
  private pendingPermissions = new Map<string, PendingPermission>();
  private permissionListeners = new Set<(permission: PendingPermission) => void>();
  // WP-01: Permission 白名單（可由設定頁擴展）
  private permissionWhitelist: string[] = [...PERMISSION_WHITELIST];
  // WP-07: Prompt 策略
  private promptStrategy: PromptStrategy = 'normal';
  // WP-07: 上下文 token budget（最大歷史輪數）
  private maxHistoryTurns: number = 20;

  constructor() {
    this.defaultModel = DEFAULT_MODEL;
    this.state = 'ready';
    // WP-04: 啟動時印出 sanitized effective config
    console.log('[Config] Effective configuration:');
    console.log(`  CLI Path: ${CONFIG.cliPath}`);
    console.log(`  Timeout: ${CONFIG.timeoutMs}ms`);
    console.log(`  Log Level: ${CONFIG.logLevel}`);
  }

  // WP-04: 取得現行配置（不含 secrets）
  getConfig(): typeof CONFIG {
    return { ...CONFIG };
  }

  /** Push a log entry to buffer and notify listeners */
  pushLog(level: string, message: string): void {
    const entry = { ts: new Date().toISOString(), level, message };
    this.logBuffer.push(entry);
    if (this.logBuffer.length > SessionManager.LOG_MAX) {
      this.logBuffer = this.logBuffer.slice(-SessionManager.LOG_MAX);
    }
    for (const fn of this.logListeners) {
      try { fn(entry); } catch { /* ignore */ }
    }
  }

  getRecentLogs(count = 200): Array<{ ts: string; level: string; message: string }> {
    return this.logBuffer.slice(-count);
  }

  onLog(fn: (entry: { ts: string; level: string; message: string }) => void): () => void {
    this.logListeners.add(fn);
    return () => { this.logListeners.delete(fn); };
  }

  getState(): string {
    return this.state;
  }

  getBackendInfo(): { type: string; command: string } {
    return {
      type: 'acp-cli',
      command: 'copilot --acp --stdio'
    };
  }

  /**
   * WP-05: 動態取得 model 列表（TTL 10 分鐘快取）
   * 失敗時 fallback 到硬編碼清單
   */
  async listModels(): Promise<string[]> {
    const now = Date.now();

    // TTL 快取有效
    if (modelCache && (now - modelCache.timestamp) < MODEL_CACHE_TTL_MS) {
      return modelCache.models;
    }

    // 嘗試動態查詢 CLI
    try {
      const result = await new Promise<string[]>((resolve, reject) => {
        const child = spawn(CONFIG.cliPath, ['--list-models', '--json'], {
          stdio: ['ignore', 'pipe', 'ignore'],
          shell: IS_WINDOWS,
          timeout: 5000,
        });
        let out = '';
        child.stdout.on('data', (d: Buffer) => { out += d.toString(); });
        child.on('close', (code: number) => {
          if (code !== 0) { reject(new Error(`CLI exited ${code}`)); return; }
          try {
            const parsed = JSON.parse(out);
            // 支持多種格式: string[] 或 { models: string[] }
            const list: string[] = Array.isArray(parsed)
              ? parsed
              : Array.isArray(parsed?.models) ? parsed.models : [];
            resolve(list);
          } catch { reject(new Error('Invalid JSON from CLI')); }
        });
        child.on('error', reject);
      });

      if (result.length > 0) {
        modelCache = { models: result, source: 'dynamic', timestamp: now };
        this.pushLog('info', `[Models] Dynamic: ${result.length} models`);
        return result;
      }
    } catch (err: any) {
      this.pushLog('warn', `[Models] Dynamic query failed, using fallback: ${err.message}`);
    }

    // Fallback 硬編碼清單
    modelCache = { models: MODEL_LIST, source: 'fallback', timestamp: now };
    return MODEL_LIST;
  }

  /** WP-05: 取得 model 清單來源資訊 */
  getModelCacheInfo(): { source: string; timestamp: number; count: number } | null {
    if (!modelCache) return null;
    return { source: modelCache.source, timestamp: modelCache.timestamp, count: modelCache.models.length };
  }

  // ============================================
  // WP-07: Prompt 策略
  // ============================================

  /** 取得現行 prompt 策略 */
  getPromptStrategy(): PromptStrategy {
    return this.promptStrategy;
  }

  /** 設定 prompt 策略 */
  setPromptStrategy(strategy: PromptStrategy): void {
    this.promptStrategy = strategy;
    this.pushLog('info', `[Prompt] Strategy changed to: ${strategy}`);
  }

  /** 取得最大歷史輪數 */
  getMaxHistoryTurns(): number {
    return this.maxHistoryTurns;
  }

  /** 設定最大歷史輪數 (clamps to 1–1000; ignores non-finite values) */
  setMaxHistoryTurns(turns: number): void {
    if (!Number.isFinite(turns)) {
      this.pushLog('warn', `[SessionManager] setMaxHistoryTurns: invalid value ignored: ${turns}`);
      console.warn('[SessionManager] setMaxHistoryTurns: invalid value ignored:', turns);
      return;
    }
    this.maxHistoryTurns = Math.min(1000, Math.max(1, turns));
  }

  /**
   * WP-07: 將 prompt 策略後綴注入 prompt
   * @param prompt 原始 prompt
   * @param strategyOverride 可選 override
   */
  applyPromptStrategy(prompt: string, strategyOverride?: PromptStrategy): string {
    const strategy = strategyOverride || this.promptStrategy;
    const suffix = PROMPT_STRATEGY_SUFFIXES[strategy] || '';
    return suffix ? `${prompt}${suffix}` : prompt;
  }

  // ============================================
  // WP-01: Permission 佇列管理
  // ============================================

  /** 取得所有 pending permissions */
  getPendingPermissions(): PendingPermission[] {
    return Array.from(this.pendingPermissions.values());
  }

  /** 訂閱新 permission 請求事件 */
  onPermissionRequest(fn: (permission: PendingPermission) => void): () => void {
    this.permissionListeners.add(fn);
    return () => { this.permissionListeners.delete(fn); };
  }

  /** 更新白名單 */
  setPermissionWhitelist(patterns: string[]): void {
    this.permissionWhitelist = [...patterns];
  }

  /** 取得白名單 */
  getPermissionWhitelist(): string[] {
    return [...this.permissionWhitelist];
  }

  /**
   * 解決 pending permission — 前端呼叫 approve 或 deny
   * @param id - permission request ID
   * @param approved - true = approve, false = deny
   * @param optionId - 選擇的 option（approve 時使用）
   */
  resolvePermission(id: string, approved: boolean, optionId?: string): boolean {
    const pending = this.pendingPermissions.get(id);
    if (!pending) return false;

    this.pendingPermissions.delete(id);

    if (approved) {
      // 如果前端未指定 optionId，預設選第一個 option
      const resolvedOptionId = optionId || (pending.options.length > 0 ? pending.options[0].optionId : undefined);
      if (resolvedOptionId) {
        pending.resolve({
          outcome: { outcome: 'selected', optionId: resolvedOptionId }
        });
        this.pushLog('info', `[Permission] Approved: ${id} (option: ${resolvedOptionId})`);
      } else {
        // 沒有任何 option 可選，仍視為 cancel
        pending.resolve({
          outcome: { outcome: 'cancelled' }
        });
        this.pushLog('warn', `[Permission] Approved but no options available: ${id}`);
      }
    } else {
      pending.resolve({
        outcome: { outcome: 'cancelled' }
      });
      this.pushLog('info', `[Permission] Denied: ${id}`);
    }
    return true;
  }

  /**
   * WP-01: 非同步權限請求處理 — 取代原本的 selectPermissionOutcome
   * 低風險操作自動 approve，高風險進入 pending 佇列等待前端確認
   */
  private async requestPermissionAsync(sessionId: string, params: any): Promise<any> {
    const options = params?.options || [];
    const candidateScopes = [params?.scope, params?.title, params?.resource?.uri];
    let scope = 'unknown';
    for (const candidate of candidateScopes) {
      if (typeof candidate === 'string') {
        const trimmed = candidate.trim();
        if (trimmed) {
          scope = trimmed;
          break;
        }
      }
    }
    const reason = params?.message || params?.reason || '';

    this.pushLog('info', `[Permission] Incoming request — scope: ${scope}, options: ${options.length}, params keys: ${Object.keys(params || {}).join(',')}`);

    // 白名單檢查 — 低風險操作自動 approve
    const isWhitelisted = this.permissionWhitelist.some(pattern =>
      scope.toLowerCase().includes(pattern.toLowerCase())
    );

    if (isWhitelisted && options.length > 0) {
      const first = options[0];
      this.pushLog('info', `[Permission] Auto-approved (whitelist): ${scope}`);
      return {
        outcome: { outcome: 'selected', optionId: first.optionId }
      };
    }

    // 無選項可選 → 直接 cancel
    if (options.length === 0) {
      return { outcome: { outcome: 'cancelled' } };
    }

    // 高風險 → 進入 pending 佇列
    const id = generatePermissionId();
    this.pushLog('warn', `[Permission] Pending approval: ${id} (scope: ${scope})`);

    return new Promise<any>((resolve) => {
      const pending: PendingPermission = {
        id,
        sessionId,
        scope,
        reason,
        options,
        timestamp: Date.now(),
        resolve,
      };

      this.pendingPermissions.set(id, pending);

      // 通知前端有新的 permission 請求
      for (const listener of this.permissionListeners) {
        try { listener(pending); } catch { /* ignore */ }
      }

      // 60s 超時自動 deny
      setTimeout(() => {
        if (this.pendingPermissions.has(id)) {
          this.pendingPermissions.delete(id);
          resolve({ outcome: { outcome: 'cancelled' } });
          this.pushLog('warn', `[Permission] Timed out (auto-deny): ${id}`);
        }
      }, PERMISSION_TIMEOUT_MS);
    });
  }

  async createSession(config: SessionConfig = {}): Promise<{ sessionId: string }> {
    const model = config.model || this.defaultModel;
    const args = ['--acp', '--stdio'];

    if (model) {
      args.push('--model', model);
    }

    const child = spawn(CONFIG.cliPath, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env,
      shell: IS_WINDOWS
    });

    child.on('error', (err) => {
      console.error('[ACP] child process error:', err.message);
      this.pushLog('error', `[ACP] child process error: ${err.message}`);
    });

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString().trim();
      if (text) {
        console.warn('[ACP stderr]', text);
        this.pushLog('warn', `[ACP stderr] ${text}`);
      }
    });

    child.stdin.on('error', (err) => {
      console.error('[ACP] stdin error:', err.message);
      this.pushLog('error', `[ACP] stdin error: ${err.message}`);
    });
    child.stdout.on('error', (err) => {
      console.error('[ACP] stdout error:', err.message);
      this.pushLog('error', `[ACP] stdout error: ${err.message}`);
    });

    const input = Writable.toWeb(child.stdin) as unknown as WritableStream<Uint8Array>;
    const output = Readable.toWeb(child.stdout) as unknown as ReadableStream<Uint8Array>;
    const stream = acp.ndJsonStream(input, output);

    // WP-01: 用 sessionId 閉包綁定 requestPermissionAsync
    const boundSessionId = `pending_${Date.now()}`;

    const connection = new acp.ClientSideConnection(
      () => ({
        requestPermission: async (params: any) => {
          // WP-01: 改用非同步佇列，不再自動 approve
          return this.requestPermissionAsync(boundSessionId, params);
        },
        sessionUpdate: async (params: any) => {
          const sid = params?.sessionId;
          const update = params?.update;
          if (!sid || !update) return;

          const session = this.sessions.get(sid);
          if (!session) return;

          session.listeners.forEach((listener) => {
            try {
              listener(update);
            } catch {
              // Ignore listener errors
            }
          });
        },
        readTextFile: async () => ({ content: '' }),
        writeTextFile: async () => ({})
      }),
      stream
    );

    await connection.initialize({
      protocolVersion: acp.PROTOCOL_VERSION,
      clientCapabilities: {
        fs: {
          readTextFile: false,
          writeTextFile: false
        }
      }
    });

    const newSessionParams: any = {
      cwd: process.cwd(),
      mcpServers: []
    };

    if (config.systemMessage?.trim()) {
      newSessionParams.initialPrompt = config.systemMessage.trim();
    }

    const sessionResult = await connection.newSession(newSessionParams);
    const sessionId = sessionResult.sessionId;

    const managed: ManagedSession = {
      sessionId,
      connection,
      process: child,
      model,
      systemMessage: config.systemMessage,
      listeners: new Set()
    };

    this.sessions.set(sessionId, managed);
    this.state = 'connected';
    this.pushLog('info', `[ACP] Session created: ${sessionId} (model: ${model})`);

    child.on('exit', () => {
      this.sessions.delete(sessionId);
      if (this.sessions.size === 0) {
        this.state = 'ready';
      }
    });

    return { sessionId };
  }

  async getOrCreateSession(sessionId?: string, config: SessionConfig = {}): Promise<{ sessionId: string }> {
    if (sessionId && this.sessions.has(sessionId)) {
      return { sessionId };
    }
    return this.createSession(config);
  }

  /**
   * WP-02: sendPrompt 含可配置 timeout
   * @param timeoutMs - 可選，per-request timeout override（預設 120s）
   */
  async sendPrompt(
    sessionId: string,
    prompt: string,
    onUpdate?: (update: any) => void,
    images?: Array<{ mimeType: string; data: string }>,
    timeoutMs?: number
  ): Promise<{ sessionId: string; content: string }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const effectiveTimeout = timeoutMs || DEFAULT_TIMEOUT_MS;
    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const chunks: string[] = [];
    const listener = (update: any) => {
      const delta = extractTextFromUpdate(update);
      if (delta) {
        chunks.push(delta);
      }
      if (onUpdate) {
        onUpdate(update);
      }
    };

    // WP-07: 注入 prompt 策略後綴
    const effectivePrompt = this.applyPromptStrategy(prompt);
    const promptBlocks: any[] = [{ type: 'text', text: effectivePrompt }];
    if (images && images.length > 0) {
      for (const img of images) {
        promptBlocks.push({
          type: 'image',
          mimeType: img.mimeType || 'image/png',
          data: img.data,
        });
      }
    }

    session.listeners.add(listener);

    // WP-02: Timeout race — AbortController + Promise.race
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timeout after ${effectiveTimeout}ms (id: ${requestId})`));
      }, effectiveTimeout);
    });

    try {
      await Promise.race([
        session.connection.prompt({
          sessionId,
          prompt: promptBlocks
        }),
        timeoutPromise
      ]);
    } catch (err: any) {
      // WP-02: Timeout 時嘗試 kill child process 避免僵屍程序
      if (err.message?.includes('Request timeout')) {
        this.pushLog('error', `[Timeout] ${err.message}`);
        try {
          if (!session.process.killed) {
            // Kill 子程序樹
            if (IS_WINDOWS) {
              spawn('taskkill', ['/pid', String(session.process.pid), '/t', '/f'], { shell: true });
            } else {
              session.process.kill('SIGKILL');
            }
            this.pushLog('warn', `[Timeout] Killed child process ${session.process.pid}`);
          }
        } catch { /* ignore kill errors */ }
        // 清除 session 讓後續請求可重建
        this.sessions.delete(sessionId);
        if (this.sessions.size === 0) this.state = 'ready';
      }
      throw err;
    } finally {
      session.listeners.delete(listener);
    }

    return {
      sessionId,
      content: chunks.join('')
    };
  }

  async listSessions(): Promise<Array<{ sessionId: string }>> {
    return Array.from(this.sessions.keys()).map(id => ({ sessionId: id }));
  }

  async deleteSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    this.sessions.delete(sessionId);

    try {
      if (!session.process.killed) {
        session.process.kill('SIGTERM');
      }
    } catch {
      // Ignore
    }

    if (this.sessions.size === 0) {
      this.state = 'ready';
    }
  }

  async cleanup(): Promise<void> {
    const ids = Array.from(this.sessions.keys());
    for (const id of ids) {
      await this.deleteSession(id);
    }
    this.state = 'idle';
  }
}
