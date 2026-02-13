// ============================================
// Session Manager
// Manages CopilotClient lifecycle and sessions
// ============================================

import { CopilotClient } from '@github/copilot-sdk';
import type { CopilotSession } from '@github/copilot-sdk';

interface SessionConfig {
  model?: string;
  systemMessage?: string;
}

// 預設模型 — 可透過環境變數覆蓋
const DEFAULT_MODEL = process.env.COPILOT_MODEL || 'gpt-4.1';

export class SessionManager {
  private client: CopilotClient;
  private sessions: Map<string, CopilotSession> = new Map();
  private defaultModel: string;

  constructor() {
    // 建立 CopilotClient — SDK 會自動管理 CLI 生命週期
    this.client = new CopilotClient({
      autoStart: true,
      autoRestart: true,
      logLevel: process.env.LOG_LEVEL || 'info',
    });
    this.defaultModel = DEFAULT_MODEL;
  }

  /**
   * 取得客戶端連線狀態
   */
  getState(): string {
    return this.client.getState();
  }

  /**
   * 列出可用模型（委派給 SDK ping 確認連線）
   */
  async listModels(): Promise<string[]> {
    await this.ensureStarted();
    // SDK 目前不直接暴露 listModels，回傳已知的常用模型
    return [
      'gpt-4.1',
      'gpt-5',
      'gpt-5.2',
      'claude-sonnet-4.5',
      'o4-mini',
    ];
  }

  /**
   * 建立新 session
   */
  async createSession(config: SessionConfig = {}): Promise<CopilotSession> {
    await this.ensureStarted();

    const session = await this.client.createSession({
      model: config.model || this.defaultModel,
      ...(config.systemMessage ? {
        systemMessage: {
          content: config.systemMessage,
        },
      } : {}),
    });

    this.sessions.set(session.sessionId, session);
    return session;
  }

  /**
   * 取得既有 session 或建立新的
   */
  async getOrCreateSession(
    sessionId?: string,
    config: SessionConfig = {},
  ): Promise<CopilotSession> {
    if (sessionId && this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId)!;
    }
    return this.createSession(config);
  }

  /**
   * 列出所有 sessions
   */
  async listSessions(): Promise<Array<{ sessionId: string }>> {
    return Array.from(this.sessions.keys()).map(id => ({ sessionId: id }));
  }

  /**
   * 刪除指定 session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      await session.destroy();
      this.sessions.delete(sessionId);
    }
  }

  /**
   * 清理所有資源
   */
  async cleanup(): Promise<void> {
    for (const [id, session] of this.sessions) {
      try {
        await session.destroy();
      } catch {
        // 忽略清理錯誤
      }
      this.sessions.delete(id);
    }

    try {
      await this.client.stop();
    } catch {
      await this.client.forceStop();
    }
  }

  /**
   * 確保客戶端已啟動
   */
  private async ensureStarted(): Promise<void> {
    if (this.client.getState() !== 'connected') {
      await this.client.start();
    }
  }
}
