'use strict';

const DEFAULT_BRIDGE_PORT = 31031;
const DEFAULT_HEALTH_TIMEOUT_MS = 3000;
const DEFAULT_AUTH_TIMEOUT_MS = 2500;
const BRIDGE_SERVICE_NAME = 'sidepilot-copilot-bridge';

const authTokenByPort = new Map();
const lastHealthByPort = new Map();

function getExtensionId() {
  const runtime = globalThis.chrome?.runtime;
  const explicitId = runtime?.id;
  if (typeof explicitId === 'string' && explicitId.trim()) {
    return explicitId.trim();
  }

  try {
    const runtimeUrl = runtime?.getURL?.('');
    if (typeof runtimeUrl === 'string' && runtimeUrl.startsWith('chrome-extension://')) {
      const parsed = new URL(runtimeUrl);
      return parsed.hostname || '';
    }
  } catch {
    // Ignore and fall through.
  }

  return '';
}

function getBridgeBaseUrl(port = DEFAULT_BRIDGE_PORT) {
  const normalizedPort = Number(port) || DEFAULT_BRIDGE_PORT;
  return `http://localhost:${normalizedPort}`;
}

function buildBridgeHeaders({ token = '', json = false } = {}) {
  const headers = {
    Accept: 'application/json',
  };

  const extensionId = getExtensionId();
  if (extensionId) {
    headers['X-SidePilot-Extension-Id'] = extensionId;
  }

  if (token) {
    headers['X-SidePilot-Token'] = token;
  }

  if (json) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_HEALTH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function clearBridgeAuth({ port = DEFAULT_BRIDGE_PORT } = {}) {
  authTokenByPort.delete(Number(port) || DEFAULT_BRIDGE_PORT);
}

function getCachedBridgeAuthToken({ port = DEFAULT_BRIDGE_PORT } = {}) {
  return authTokenByPort.get(Number(port) || DEFAULT_BRIDGE_PORT) || '';
}

async function checkBridgeHealth({ port = DEFAULT_BRIDGE_PORT, timeoutMs = DEFAULT_HEALTH_TIMEOUT_MS } = {}) {
  const normalizedPort = Number(port) || DEFAULT_BRIDGE_PORT;
  const url = `${getBridgeBaseUrl(normalizedPort)}/health`;

  try {
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: buildBridgeHeaders(),
    }, timeoutMs);

    const data = await readJsonResponse(response);
    const isBridge =
      response.ok &&
      data?.service === BRIDGE_SERVICE_NAME &&
      data?.status === 'ok';

    const result = {
      success: response.ok,
      url,
      status: response.status,
      data,
      isBridge,
      error: response.ok ? '' : (data?.error || `HTTP ${response.status}`),
    };

    lastHealthByPort.set(normalizedPort, result);
    if (!isBridge) {
      clearBridgeAuth({ port: normalizedPort });
    }
    return result;
  } catch (err) {
    const result = {
      success: false,
      url,
      status: 0,
      data: null,
      isBridge: false,
      error: err?.name === 'AbortError' ? 'timeout' : (err?.message || 'unknown error'),
    };
    lastHealthByPort.set(normalizedPort, result);
    clearBridgeAuth({ port: normalizedPort });
    return result;
  }
}

async function bootstrapBridgeAuth({
  port = DEFAULT_BRIDGE_PORT,
  timeoutMs = DEFAULT_AUTH_TIMEOUT_MS,
  forceRefresh = false,
} = {}) {
  const normalizedPort = Number(port) || DEFAULT_BRIDGE_PORT;
  const cachedToken = getCachedBridgeAuthToken({ port: normalizedPort });
  if (cachedToken && !forceRefresh) {
    return { success: true, token: cachedToken, cached: true };
  }

  const url = `${getBridgeBaseUrl(normalizedPort)}/api/auth/bootstrap`;

  try {
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: buildBridgeHeaders({ json: true }),
      body: '{}',
    }, timeoutMs);
    const data = await readJsonResponse(response);

    if (!response.ok || !data?.success || typeof data?.token !== 'string' || !data.token) {
      clearBridgeAuth({ port: normalizedPort });
      return {
        success: false,
        status: response.status,
        error: data?.error || `HTTP ${response.status}`,
      };
    }

    authTokenByPort.set(normalizedPort, data.token);
    return { success: true, token: data.token, cached: false };
  } catch (err) {
    clearBridgeAuth({ port: normalizedPort });
    return {
      success: false,
      status: 0,
      error: err?.name === 'AbortError' ? 'timeout' : (err?.message || 'unknown error'),
    };
  }
}

async function detectPreferredMode({ port = DEFAULT_BRIDGE_PORT, timeoutMs = DEFAULT_HEALTH_TIMEOUT_MS } = {}) {
  const health = await checkBridgeHealth({ port, timeoutMs });
  return health.success && health.isBridge ? 'sdk' : 'iframe';
}

function getLastBridgeHealth({ port = DEFAULT_BRIDGE_PORT } = {}) {
  return lastHealthByPort.get(Number(port) || DEFAULT_BRIDGE_PORT) || null;
}

export {
  BRIDGE_SERVICE_NAME,
  DEFAULT_AUTH_TIMEOUT_MS,
  DEFAULT_BRIDGE_PORT,
  DEFAULT_HEALTH_TIMEOUT_MS,
  bootstrapBridgeAuth,
  buildBridgeHeaders,
  checkBridgeHealth,
  clearBridgeAuth,
  detectPreferredMode,
  getBridgeBaseUrl,
  getCachedBridgeAuthToken,
  getExtensionId,
  getLastBridgeHealth,
};
