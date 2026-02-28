// ============================================
// SidePilot Copilot Bridge — Supervisor Process
// Manages the Worker process lifecycle:
//   - Forks worker via child_process.fork()
//   - Monitors heartbeat and auto-restarts on crash
//   - Handles graceful shutdown (SIGINT / SIGTERM)
// ============================================

import { fork, type ChildProcess } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { WorkerMessage, SupervisorShutdownMessage } from './ipc-types.js';
import { isWorkerMessage } from './ipc-types.js';

// --- Configuration ---
const HEARTBEAT_TIMEOUT_MS = 30_000;      // worker 超過此時間無心跳視為 unresponsive
const RESTART_BASE_DELAY_MS = 1_000;      // 重啟初始延遲
const RESTART_MAX_DELAY_MS = 30_000;      // 重啟最大延遲
const MAX_RAPID_RESTARTS = 5;             // 快速重啟上限（在 RAPID_WINDOW 內）
const RAPID_WINDOW_MS = 60_000;           // 快速重啟偵測窗口

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKER_SCRIPT = path.join(__dirname, 'server.js');

// --- State ---
let worker: ChildProcess | null = null;
let heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
let shuttingDown = false;
let consecutiveFailures = 0;
let restartTimestamps: number[] = [];

// ============================================
// Worker Lifecycle
// ============================================

function spawnWorker(): void {
  if (shuttingDown) return;

  // Rapid restart guard
  const now = Date.now();
  restartTimestamps = restartTimestamps.filter(t => now - t < RAPID_WINDOW_MS);
  if (restartTimestamps.length >= MAX_RAPID_RESTARTS) {
    console.error(
      `❌ Worker restarted ${MAX_RAPID_RESTARTS} times within ${RAPID_WINDOW_MS / 1000}s — giving up.`
    );
    process.exit(1);
  }
  restartTimestamps.push(now);

  console.log('🚀 Supervisor: spawning worker...');

  worker = fork(WORKER_SCRIPT, {
    stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
    env: process.env,
  });

  worker.on('message', (raw: unknown) => {
    if (!isWorkerMessage(raw)) return;
    handleWorkerMessage(raw);
  });

  worker.on('exit', (code, signal) => {
    clearHeartbeatTimer();
    worker = null;

    if (shuttingDown) {
      console.log('🛬 Supervisor: worker exited during shutdown.');
      process.exit(0);
      return;
    }

    console.warn(`⚠️  Worker exited (code=${code}, signal=${signal})`);
    consecutiveFailures++;
    scheduleRestart();
  });

  worker.on('error', (err) => {
    console.error('❌ Worker process error:', err.message);
  });
}

function handleWorkerMessage(msg: WorkerMessage): void {
  switch (msg.type) {
    case 'ready':
      console.log(`✅ Worker ready on port ${msg.port}`);
      consecutiveFailures = 0;
      resetHeartbeatTimer();
      break;

    case 'heartbeat':
      resetHeartbeatTimer();
      break;

    case 'error':
      console.error(`❌ Worker reported error: ${msg.message}`);
      break;
  }
}

// ============================================
// Heartbeat Monitoring
// ============================================

function resetHeartbeatTimer(): void {
  clearHeartbeatTimer();
  heartbeatTimer = setTimeout(() => {
    console.warn('⚠️  Worker heartbeat timeout — killing worker...');
    killWorker();
  }, HEARTBEAT_TIMEOUT_MS);
  heartbeatTimer.unref();
}

function clearHeartbeatTimer(): void {
  if (heartbeatTimer) {
    clearTimeout(heartbeatTimer);
    heartbeatTimer = null;
  }
}

// ============================================
// Restart with Exponential Backoff
// ============================================

function scheduleRestart(): void {
  if (shuttingDown) return;

  const delay = Math.min(
    RESTART_BASE_DELAY_MS * Math.pow(2, consecutiveFailures - 1),
    RESTART_MAX_DELAY_MS
  );
  console.log(`🔄 Restarting worker in ${delay}ms (attempt ${consecutiveFailures})...`);

  setTimeout(() => {
    spawnWorker();
  }, delay);
}

// ============================================
// Graceful Shutdown
// ============================================

function shutdown(): void {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log('\n🛬 Supervisor: initiating graceful shutdown...');
  clearHeartbeatTimer();

  if (worker && worker.connected) {
    const msg: SupervisorShutdownMessage = { type: 'shutdown' };
    worker.send(msg);

    // Force kill if worker doesn't exit within 5s
    const forceTimer = setTimeout(() => {
      console.warn('⚠️  Worker did not exit in time — force killing.');
      killWorker();
      process.exit(1);
    }, 5_000);
    forceTimer.unref();
  } else {
    process.exit(0);
  }
}

function killWorker(): void {
  if (worker && !worker.killed) {
    try {
      worker.kill('SIGTERM');
    } catch {
      // Ignore
    }
  }
}

// ============================================
// Signal Handlers
// ============================================

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// ============================================
// Entry Point
// ============================================

console.log('============================================');
console.log(' SidePilot Copilot Bridge — Supervisor');
console.log('============================================');
spawnWorker();
