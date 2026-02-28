// ============================================
// IPC Message Types
// Defines the protocol between Supervisor and Worker processes
// ============================================

// --- Worker → Supervisor ---

export interface WorkerReadyMessage {
  type: 'ready';
  port: number;
}

export interface WorkerErrorMessage {
  type: 'error';
  message: string;
}

export interface WorkerHeartbeatMessage {
  type: 'heartbeat';
}

export type WorkerMessage =
  | WorkerReadyMessage
  | WorkerErrorMessage
  | WorkerHeartbeatMessage;

// --- Supervisor → Worker ---

export interface SupervisorShutdownMessage {
  type: 'shutdown';
}

export type SupervisorMessage = SupervisorShutdownMessage;

// --- Helpers ---

export function isWorkerMessage(msg: unknown): msg is WorkerMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    typeof (msg as any).type === 'string'
  );
}
