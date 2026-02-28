// ============================================
// Session Manager (ACP)
// Manages `copilot --acp --stdio` sessions
// ============================================

import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { Writable, Readable } from 'node:stream';
import * as acp from '@agentclientprotocol/sdk';

interface SessionConfig {
  model?: string;
  systemMessage?: string;
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

function selectPermissionOutcome(options: any[] = []): any {
  const first = options[0];
  if (!first?.optionId) {
    return { outcome: { outcome: 'cancelled' } };
  }
  return {
    outcome: {
      outcome: 'selected',
      optionId: first.optionId
    }
  };
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

  constructor() {
    this.defaultModel = DEFAULT_MODEL;
    this.state = 'ready';
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

  async listModels(): Promise<string[]> {
    return MODEL_LIST;
  }

  async createSession(config: SessionConfig = {}): Promise<{ sessionId: string }> {
    const model = config.model || this.defaultModel;
    const args = ['--acp', '--stdio'];

    if (model) {
      args.push('--model', model);
    }

    const child = spawn('copilot', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env
    });

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString().trim();
      if (text) {
        console.warn('[ACP stderr]', text);
      }
    });

    const input = Writable.toWeb(child.stdin) as unknown as WritableStream<Uint8Array>;
    const output = Readable.toWeb(child.stdout) as unknown as ReadableStream<Uint8Array>;
    const stream = acp.ndJsonStream(input, output);

    const connection = new acp.ClientSideConnection(
      () => ({
        requestPermission: async (params: any) => selectPermissionOutcome(params?.options),
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

  async sendPrompt(
    sessionId: string,
    prompt: string,
    onUpdate?: (update: any) => void
  ): Promise<{ sessionId: string; content: string }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

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

    session.listeners.add(listener);
    try {
      await session.connection.prompt({
        sessionId,
        prompt: [
          {
            type: 'text',
            text: prompt
          }
        ]
      });
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
