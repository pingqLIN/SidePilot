'use strict';

// ============================================
// SDK Client Module
// Handles communication with Copilot CLI SDK server
// ============================================

const DEFAULT_PORT = 3000;
const CONNECT_TIMEOUT_MS = 5000;
const REQUEST_TIMEOUT_MS = 30000;
const HEALTH_CHECK_INTERVAL_MS = 30000;

// ============================================
// Error Codes
// ============================================

const ErrorCodes = {
  SDK_NOT_RUNNING: 'SDK_NOT_RUNNING',
  CONNECTION_TIMEOUT: 'CONNECTION_TIMEOUT',
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
  CONNECTION_LOST: 'CONNECTION_LOST'
};

// ============================================
// Module State
// ============================================

let initialized = false;
let connected = false;
let currentPort = DEFAULT_PORT;
let healthCheckIntervalId = null;

const connectionListeners = new Set();
const pendingRequests = new Map();

// ============================================
// Private Functions
// ============================================

/**
 * Generate a UUID v4 for correlation IDs
 * @returns {string}
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Create SDK Error with code
 * @param {string} message 
 * @param {string} code 
 * @returns {Error}
 */
function createSDKError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

/**
 * Get base URL for SDK server
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
      console.error('[SDKClient] Connection listener error:', err);
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
    notifyConnectionListeners(connected);
  }
}

/**
 * Perform health check
 * @returns {Promise<boolean>}
 */
async function checkHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONNECT_TIMEOUT_MS);

    const response = await fetch(`${getBaseUrl()}/health`, {
      method: 'GET',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      setConnectionState(true);
      return true;
    }
    
    setConnectionState(false);
    return false;
  } catch (err) {
    setConnectionState(false);
    return false;
  }
}

/**
 * Start health check interval
 */
function startHealthCheck() {
  stopHealthCheck();
  healthCheckIntervalId = setInterval(async () => {
    const healthy = await checkHealth();
    if (!healthy) {
      console.warn('[SDKClient] Health check failed, connection lost');
      rejectPendingRequests(ErrorCodes.CONNECTION_LOST);
    }
  }, HEALTH_CHECK_INTERVAL_MS);
}

/**
 * Stop health check interval
 */
function stopHealthCheck() {
  if (healthCheckIntervalId !== null) {
    clearInterval(healthCheckIntervalId);
    healthCheckIntervalId = null;
  }
}

/**
 * Reject all pending requests with error
 * @param {string} errorCode 
 */
function rejectPendingRequests(errorCode) {
  const error = createSDKError('Connection lost', errorCode);
  pendingRequests.forEach((pending, id) => {
    clearTimeout(pending.timeoutId);
    pending.reject(error);
  });
  pendingRequests.clear();
}

// ============================================
// Exported Functions
// ============================================

/**
 * Initialize the SDK client module.
 * Attempts initial connection to SDK server.
 * @returns {Promise<void>}
 */
async function init() {
  if (initialized) {
    return;
  }

  initialized = true;
  
  // Attempt initial connection (non-blocking)
  try {
    await connect(currentPort);
  } catch (err) {
    // Graceful degradation - SDK not available is OK
    console.warn('[SDKClient] Initial connection failed:', err.message);
  }
}

/**
 * Cleanup module resources.
 * Closes connection and clears all state.
 * @returns {void}
 */
function cleanup() {
  stopHealthCheck();
  rejectPendingRequests(ErrorCodes.CONNECTION_LOST);
  connectionListeners.clear();
  setConnectionState(false);
  initialized = false;
}

/**
 * Get the current status of the SDK client.
 * @returns {{initialized: boolean, connected: boolean, port: number}}
 */
function getStatus() {
  return {
    initialized,
    connected,
    port: currentPort
  };
}

/**
 * Check if currently connected to SDK server.
 * @returns {boolean}
 */
function isConnected() {
  return connected;
}

/**
 * Connect to SDK server on specified port.
 * @param {number} port - Port number (default: 4321)
 * @returns {Promise<void>}
 */
async function connect(port = DEFAULT_PORT) {
  currentPort = port;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONNECT_TIMEOUT_MS);

    const response = await fetch(`${getBaseUrl()}/health`, {
      method: 'GET',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw createSDKError('SDK server returned non-OK status', ErrorCodes.SDK_NOT_RUNNING);
    }

    setConnectionState(true);
    startHealthCheck();
    
  } catch (err) {
    setConnectionState(false);
    stopHealthCheck();

    if (err.code) {
      throw err;
    }

    if (err.name === 'AbortError') {
      throw createSDKError('Connection timed out', ErrorCodes.CONNECTION_TIMEOUT);
    }

    // Network error - SDK not running
    throw createSDKError('SDK server is not running', ErrorCodes.SDK_NOT_RUNNING);
  }
}

/**
 * Disconnect from SDK server.
 * @returns {void}
 */
function disconnect() {
  stopHealthCheck();
  rejectPendingRequests(ErrorCodes.CONNECTION_LOST);
  setConnectionState(false);
}

/**
 * Send message to SDK server.
 * @param {{type: 'chat'|'ping'|'status', content?: string}} msg - Message to send
 * @returns {Promise<{id: string, type: string, content: string, success: boolean}>}
 */
async function sendMessage(msg) {
  if (!connected) {
    throw createSDKError('Not connected to SDK server', ErrorCodes.CONNECTION_LOST);
  }

  const requestId = generateUUID();
  const request = {
    id: requestId,
    type: msg.type || 'chat',
    content: msg.content || '',
    timestamp: Date.now()
  };

  return new Promise((resolve, reject) => {
    // Set up timeout
    const timeoutId = setTimeout(() => {
      pendingRequests.delete(requestId);
      reject(createSDKError('Request timed out', ErrorCodes.REQUEST_TIMEOUT));
    }, REQUEST_TIMEOUT_MS);

    // Store pending request
    pendingRequests.set(requestId, { resolve, reject, timeoutId });

    // Send HTTP request
    (async () => {
      try {
        const controller = new AbortController();
        const abortTimeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        const response = await fetch(`${getBaseUrl()}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(request),
          signal: controller.signal
        });

        clearTimeout(abortTimeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        // Clear timeout and resolve
        const pending = pendingRequests.get(requestId);
        if (pending) {
          clearTimeout(pending.timeoutId);
          pendingRequests.delete(requestId);
          
          // Format response
          const result = {
            id: data.id || requestId,
            type: 'response',
            content: data.content || data.message || '',
            success: data.success !== false
          };
          
          pending.resolve(result);
        }

      } catch (err) {
        const pending = pendingRequests.get(requestId);
        if (pending) {
          clearTimeout(pending.timeoutId);
          pendingRequests.delete(requestId);

          if (err.name === 'AbortError') {
            pending.reject(createSDKError('Request timed out', ErrorCodes.REQUEST_TIMEOUT));
          } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
            // Connection lost during request
            setConnectionState(false);
            stopHealthCheck();
            pending.reject(createSDKError('Connection lost during request', ErrorCodes.CONNECTION_LOST));
          } else {
            pending.reject(err);
          }
        }
      }
    })();
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

  // Return unsubscribe function
  return () => {
    connectionListeners.delete(callback);
  };
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
  onConnectionChange
};
