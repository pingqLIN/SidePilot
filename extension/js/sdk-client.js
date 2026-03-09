'use strict';

// ============================================
// SDK Client Module
// Handles communication with SidePilot Copilot Bridge server
// via HTTP REST + SSE (Server-Sent Events) for streaming
// ============================================

const DEFAULT_PORT = 31031;
const CONNECT_TIMEOUT_MS = 5000;
const BRIDGE_BASE = `http://localhost:${DEFAULT_PORT}`;
const BRIDGE_SERVICE_NAME = 'sidepilot-copilot-bridge';

// ============================================
// Module State
// ============================================

let initialized = false;
let connected = false;
let currentPort = DEFAULT_PORT;
let currentSessionId = null;
let currentSessionProfileKey = null;
let healthCheckIntervalId = null;

const connectionListeners = new Set();
const SESSION_RECOVERY_PATTERNS = [
  /api key not found/i,
  /invalid_argument/i,
  /rpcstreamexception/i,
  /request timeout/i,
  /session not found/i,
  /transport closed/i,
  /connection (?:closed|lost|reset)/i,
];

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
      const data = await response.json().catch(() => null);
      const isExpectedBridge = data?.service === BRIDGE_SERVICE_NAME && data?.status === 'ok';

      if (isExpectedBridge) {
        setConnectionState(true);
        return true;
      }
    }

    setConnectionState(false);
    return false;
  } catch {
    setConnectionState(false);
    return false;
  }
}

/**
 * Start health check interval (every 3s)
 */
function startHealthCheck() {
  stopHealthCheck();
  healthCheckIntervalId = setInterval(checkHealth, 3000);
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

/**
 * Build a deterministic key for session profile.
 * Session profile = model + systemMessage.
 * @param {{model?: string, systemMessage?: string}} profile
 * @returns {string}
 */
function getSessionProfileKey(profile = {}) {
  const model = typeof profile.model === 'string' ? profile.model : '';
  const systemMessage = typeof profile.systemMessage === 'string' ? profile.systemMessage : '';
  return `${model}::${systemMessage}`;
}

function shouldRetryWithFreshSession(errorMessage) {
  const text = typeof errorMessage === 'string' ? errorMessage : '';
  return SESSION_RECOVERY_PATTERNS.some(pattern => pattern.test(text));
}

async function forgetCurrentSession(reason = '') {
  const staleSessionId = currentSessionId;
  currentSessionId = null;
  currentSessionProfileKey = null;

  if (!staleSessionId) return;

  if (reason) {
    console.warn(`[SDKClient] Resetting stale session ${staleSessionId}: ${reason}`);
  }

  try {
    await fetch(`${getBaseUrl()}/api/sessions/${encodeURIComponent(staleSessionId)}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('[SDKClient] Failed to delete stale session:', err?.message || err);
  }
}

async function readErrorMessage(response, endpoint) {
  const fallback = `HTTP ${response.status} (${endpoint})`;

  try {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json().catch(() => null);
      return data?.error || fallback;
    }

    const text = await response.text();
    return text || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Create a new session with optional model/systemMessage.
 * @param {{model?: string, systemMessage?: string}} profile
 * @returns {Promise<string>} - sessionId
 */
async function createSession(profile = {}) {
  const body = {};
  if (profile.model) body.model = profile.model;
  if (profile.systemMessage) body.systemMessage = profile.systemMessage;

  const response = await fetch(`${getBaseUrl()}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!data?.success || !data?.sessionId) {
    throw new Error(data?.error || 'Failed to create session');
  }

  return data.sessionId;
}

async function createFreshSession(profile = {}) {
  await forgetCurrentSession('fresh session requested');
  const sessionId = await createSession(profile);
  currentSessionId = sessionId;
  currentSessionProfileKey = getSessionProfileKey(profile);
  return sessionId;
}

/**
 * Ensure we are using a session that matches the requested profile.
 * @param {{model?: string, systemMessage?: string}} profile
 * @returns {Promise<string|null>}
 */
async function ensureSession(profile = {}) {
  const requestedKey = getSessionProfileKey(profile);

  if (currentSessionId && currentSessionProfileKey === requestedKey) {
    return currentSessionId;
  }

  try {
    const sessionId = await createSession(profile);
    currentSessionId = sessionId;
    currentSessionProfileKey = requestedKey;
    return currentSessionId;
  } catch (err) {
    // Fallback to legacy auto-create flow in /api/chat when session creation fails.
    console.warn('[SDKClient] Failed to create profiled session, fallback to auto session:', err.message);
    return currentSessionId;
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
  currentSessionProfileKey = null;
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
  
  const MAX_RETRIES = 3;
  const INITIAL_RETRY_DELAY = 1000;
  
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONNECT_TIMEOUT_MS);

      const response = await fetch(`${getBaseUrl()}/health`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Health check failed: HTTP ${response.status}`);
      }

      const payload = await response.json().catch(() => null);
      const isExpectedBridge = payload?.service === BRIDGE_SERVICE_NAME && payload?.status === 'ok';
      if (!isExpectedBridge) {
        throw new Error(`Port ${port} is reachable but not SidePilot Bridge`);
      }

      setConnectionState(true);
      startHealthCheck();
      return;
      
    } catch (err) {
      clearTimeout(timeoutId);
      
      if (err.name === 'AbortError') {
        if (attempt < MAX_RETRIES) {
          const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
          console.log(`[SDKClient] Connection timeout, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        setConnectionState(false);
        stopHealthCheck();
        throw new Error('Connection timed out after retries');
      }

      if (attempt < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
        console.log(`[SDKClient] Connection error (${err.message}), retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      setConnectionState(false);
      stopHealthCheck();
      throw new Error(err?.message || 'SDK server is not running');
    }
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
  currentSessionProfileKey = null;
}

/**
 * List available models from bridge server.
 * @returns {Promise<string[]>}
 */
async function listModels() {
  if (!connected) {
    const healthy = await checkHealth();
    if (!healthy) {
      throw new Error('Bridge server not available');
    }
  }

  const response = await fetch(`${getBaseUrl()}/api/models`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${response.status} (/api/models)`);
  }

  const data = await response.json();
  if (!data?.success) {
    throw new Error(data?.error || 'Failed to load models');
  }

  return Array.isArray(data.models) ? data.models : [];
}

/**
 * Send a chat message to the bridge server.
 * Returns the full response (non-streaming).
 * @param {{type?: string, content: string, model?: string, systemMessage?: string, images?: Array<{mimeType: string, data: string}>}} msg
 * @returns {Promise<{success: boolean, content: string, sessionId: string}>}
 */
async function sendMessage(msg, attempt = 0) {
  if (!connected) {
    const healthy = await checkHealth();
    if (!healthy) {
      throw new Error('Bridge server not available');
    }
  }

  const ensuredSessionId = await ensureSession({
    model: msg.model,
    systemMessage: msg.systemMessage,
  });

  const payload = {
    sessionId: ensuredSessionId || currentSessionId,
    prompt: msg.content,
    model: msg.model,
  };
  if (msg.images && msg.images.length > 0) {
    payload.images = msg.images;
  }

  const response = await fetch(`${getBaseUrl()}/api/chat/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  // Backward compatibility:
  // Some older bridge builds only expose /api/chat (SSE) and return 404 on /api/chat/sync.
  if (response.status === 404) {
    const streamedContent = await sendMessageStreaming({
      content: msg.content,
      model: msg.model,
      systemMessage: msg.systemMessage,
    }, undefined, undefined, attempt);

    return {
      success: true,
      content: streamedContent,
      sessionId: currentSessionId,
    };
  }

  if (!response.ok) {
    const errorMessage = await readErrorMessage(response, '/api/chat/sync');

    if (attempt === 0 && shouldRetryWithFreshSession(errorMessage)) {
      await createFreshSession({
        model: msg.model,
        systemMessage: msg.systemMessage,
      });
      return sendMessage(msg, attempt + 1);
    }

    throw new Error(errorMessage);
  }

  const data = await response.json();
  if (data.sessionId) {
    currentSessionId = data.sessionId;
    currentSessionProfileKey = getSessionProfileKey({
      model: msg.model,
      systemMessage: msg.systemMessage,
    });
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
 * @param {{content: string, model?: string, systemMessage?: string}} msg
 * @param {function(string): void} onDelta - Called with each text chunk
 * @param {function(object): void} [onTool] - Called with tool execution events
 * @returns {Promise<string>} - Final complete response
 */
async function sendMessageStreaming(msg, onDelta, onTool, attempt = 0) {
  if (!connected) {
    const healthy = await checkHealth();
    if (!healthy) {
      throw new Error('Bridge server not available');
    }
  }

  const ensuredSessionId = await ensureSession({
    model: msg.model,
    systemMessage: msg.systemMessage,
  });

  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      sessionId: ensuredSessionId || currentSessionId,
      prompt: msg.content,
      model: msg.model,
    });

    // 使用 fetch + ReadableStream 處理 SSE
    fetch(`${getBaseUrl()}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    }).then(async response => {
      if (!response.ok) {
        const errorMessage = await readErrorMessage(response, '/api/chat');

        if (attempt === 0 && shouldRetryWithFreshSession(errorMessage)) {
          try {
            await createFreshSession({
              model: msg.model,
              systemMessage: msg.systemMessage,
            });
            const retriedContent = await sendMessageStreaming(
              msg,
              onDelta,
              onTool,
              attempt + 1,
            );
            resolve(retriedContent);
            return;
          } catch (retryErr) {
            reject(retryErr);
            return;
          }
        }

        reject(new Error(errorMessage));
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
  listModels,
  sendMessage,
  sendMessageStreaming,
  onConnectionChange
};
