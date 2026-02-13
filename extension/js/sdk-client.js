'use strict';

// ============================================
// SDK Client Module
// Handles communication with SidePilot Copilot Bridge server
// via HTTP REST + SSE (Server-Sent Events) for streaming
// ============================================

const DEFAULT_PORT = 3000;
const CONNECT_TIMEOUT_MS = 5000;
const BRIDGE_BASE = `http://localhost:${DEFAULT_PORT}`;

// ============================================
// Module State
// ============================================

let initialized = false;
let connected = false;
let currentPort = DEFAULT_PORT;
let currentSessionId = null;
let healthCheckIntervalId = null;

const connectionListeners = new Set();

// ============================================
// Private Functions
// ============================================

/**
 * Get base URL for bridge server
 * @returns {string}
 */
function getBaseUrl() {
  return `http://localhost:${currentPort}`;
}

/**
 * Notify all connection listeners
 * @param {boolean} isConnected
 */
function notifyConnectionListeners(isConnected) {
  connectionListeners.forEach(callback => {
    try {
      callback(isConnected);
    } catch (err) {
      console.error('[SDKClient] Listener callback error:', err);
    }
  });
}

/**
 * Update connection state and notify listeners
 * @param {boolean} newState
 */
function setConnectionState(newState) {
  if (connected !== newState) {
    connected = newState;
    notifyConnectionListeners(newState);
  }
}

/**
 * Perform health check against bridge server
 * @returns {Promise<boolean>}
 */
async function checkHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONNECT_TIMEOUT_MS);

    const response = await fetch(`${getBaseUrl()}/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      setConnectionState(true);
      return true;
    }

    setConnectionState(false);
    return false;
  } catch {
    setConnectionState(false);
    return false;
  }
}

/**
 * Start health check interval (every 30s)
 */
function startHealthCheck() {
  stopHealthCheck();
  healthCheckIntervalId = setInterval(checkHealth, 30000);
}

/**
 * Stop health check interval
 */
function stopHealthCheck() {
  if (healthCheckIntervalId) {
    clearInterval(healthCheckIntervalId);
    healthCheckIntervalId = null;
  }
}

// ============================================
// Exported Functions
// ============================================

/**
 * Initialize the SDK client module.
 * Attempts initial connection to bridge server.
 * @returns {Promise<void>}
 */
async function init() {
  if (initialized) return;

  try {
    const healthy = await checkHealth();
    if (healthy) {
      startHealthCheck();
      console.log('[SDKClient] Connected to Copilot Bridge');
    } else {
      console.log('[SDKClient] Bridge not available, will retry on demand');
    }
  } catch (err) {
    console.warn('[SDKClient] Init warning:', err.message);
  }

  initialized = true;
}

/**
 * Cleanup module resources.
 * @returns {void}
 */
function cleanup() {
  stopHealthCheck();
  initialized = false;
  connected = false;
  currentSessionId = null;
  connectionListeners.clear();
}

/**
 * Get the current status of the SDK client.
 * @returns {{initialized: boolean, connected: boolean, port: number, sessionId: string|null}}
 */
function getStatus() {
  return {
    initialized,
    connected,
    port: currentPort,
    sessionId: currentSessionId,
  };
}

/**
 * Check if currently connected to bridge server.
 * @returns {boolean}
 */
function isConnected() {
  return connected;
}

/**
 * Connect to bridge server on specified port.
 * @param {number} port - Port number (default: 3000)
 * @returns {Promise<void>}
 */
async function connect(port = DEFAULT_PORT) {
  currentPort = port;
  const healthy = await checkHealth();

  if (!healthy) {
    throw new Error(`Bridge server not available at localhost:${port}`);
  }

  startHealthCheck();
  console.log(`[SDKClient] Connected to bridge on port ${port}`);
}

/**
 * Disconnect from bridge server.
 * @returns {void}
 */
function disconnect() {
  stopHealthCheck();
  setConnectionState(false);
  currentSessionId = null;
}

/**
 * Send a chat message to the bridge server.
 * Returns the full response (non-streaming).
 * @param {{type?: string, content: string, model?: string}} msg
 * @returns {Promise<{success: boolean, content: string, sessionId: string}>}
 */
async function sendMessage(msg) {
  if (!connected) {
    const healthy = await checkHealth();
    if (!healthy) {
      throw new Error('Bridge server not available');
    }
  }

  const response = await fetch(`${getBaseUrl()}/api/chat/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: currentSessionId,
      prompt: msg.content,
      model: msg.model,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  if (data.sessionId) {
    currentSessionId = data.sessionId;
  }

  return {
    success: data.success,
    content: data.content,
    sessionId: data.sessionId,
  };
}

/**
 * Send a chat message with SSE streaming.
 * Calls onDelta for each chunk, returns final content.
 * @param {{content: string, model?: string}} msg
 * @param {function(string): void} onDelta - Called with each text chunk
 * @param {function(object): void} [onTool] - Called with tool execution events
 * @returns {Promise<string>} - Final complete response
 */
async function sendMessageStreaming(msg, onDelta, onTool) {
  if (!connected) {
    const healthy = await checkHealth();
    if (!healthy) {
      throw new Error('Bridge server not available');
    }
  }

  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      sessionId: currentSessionId,
      prompt: msg.content,
      model: msg.model,
    });

    // 使用 fetch + ReadableStream 處理 SSE
    fetch(`${getBaseUrl()}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    }).then(response => {
      if (!response.ok) {
        reject(new Error(`HTTP ${response.status}`));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalContent = '';

      function processChunk() {
        reader.read().then(({ done, value }) => {
          if (done) {
            resolve(finalContent);
            return;
          }

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE events from buffer
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          let currentEvent = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              const dataStr = line.slice(6);
              try {
                const data = JSON.parse(dataStr);

                switch (currentEvent) {
                  case 'delta':
                    if (data.content && onDelta) {
                      onDelta(data.content);
                    }
                    break;
                  case 'message':
                    finalContent = data.content || '';
                    break;
                  case 'tool':
                    if (onTool) onTool(data);
                    break;
                  case 'error':
                    reject(new Error(data.message));
                    return;
                  case 'done':
                    resolve(finalContent);
                    return;
                }
              } catch {
                // Ignore malformed JSON
              }
            }
          }

          processChunk();
        }).catch(reject);
      }

      processChunk();
    }).catch(reject);
  });
}

/**
 * Subscribe to connection state changes.
 * @param {function(boolean): void} callback - Called with connection state
 * @returns {function(): void} - Unsubscribe function
 */
function onConnectionChange(callback) {
  if (typeof callback !== 'function') {
    console.error('[SDKClient] onConnectionChange requires a function callback');
    return () => {};
  }

  connectionListeners.add(callback);
  return () => connectionListeners.delete(callback);
}

// ============================================
// Module Export
// ============================================

export {
  init,
  cleanup,
  getStatus,
  isConnected,
  connect,
  disconnect,
  sendMessage,
  sendMessageStreaming,
  onConnectionChange
};
