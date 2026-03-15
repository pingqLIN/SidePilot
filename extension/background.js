'use strict';

import * as ModeManager from './js/mode-manager.js';
import * as SDKClient from './js/sdk-client.js';
import * as RulesManager from './js/rules-manager.js';
import * as MemoryBank from './js/memory-bank.js';
import * as VSCodeConnector from './js/vscode-connector.js';
import * as ConnectionController from './js/connection-controller.js';

// ============================================
// 常數
// ============================================

const COPILOT_URL = 'https://github.com/copilot';
const SDK_LOGIN_URL =
  'https://github.com/login?return_to=https%3A%2F%2Fgithub.com%2Fcopilot';
const SEAL_PATTERN = /^\d+\.\d+\.\d+\+[0-9a-f]{16}$/i;
const SEAL_DIGEST_PATTERN = /^[0-9a-f]{16}$/i;
const LEGACY_SEAL_DIGEST_PATTERN = /^[0-9a-f]{8}$/i;
const SETTINGS_STORAGE_KEY = 'sidepilot.settings.v1';
const ANTIGRAVITY_DEFAULT_BASE_URL = 'http://127.0.0.1:47619';
const BRIDGE_STATUS_API_VERSION = '2026-03-bridge-status-v1';
const BRIDGE_AUTO_START_PROTOCOL_BASE = 'sidepilot://start-bridge';
const DEFAULT_BRIDGE_PORT = 31031;
const BRIDGE_AUTO_START_TIMEOUT_MS = 45000;
const BRIDGE_AUTO_START_POLL_INTERVAL_MS = 1000;
const BRIDGE_AUTO_START_DEFAULT_COOLDOWN_MS = 60000;
const BRIDGE_AUTO_START_COOLDOWN_MIN_MS = 5000;
const BRIDGE_AUTO_START_COOLDOWN_MAX_MS = 300000;
const BRIDGE_DEFAULT_SETTINGS = {
  autoStartBridgeEnabled: true,
  autoStartBridgeCooldownMs: BRIDGE_AUTO_START_DEFAULT_COOLDOWN_MS,
  autoStartBridgeLastAttemptAt: 0,
  autoStartBridgeLastResult: 'idle',
  autoStartBridgeLastError: '',
  bridgeManualRuntime: 'auto',
  bridgeProjectRootWindows: '',
  bridgeProjectRootWsl: '',
  bridgeWslDistro: '',
};
const BRIDGE_LAUNCHER_ERROR_CODES = {
  launcherUnavailable: 'BRG-AUTO-001',
  timeout: 'BRG-AUTO-002',
  cooldown: 'BRG-AUTO-003',
  offline: 'BRG-OFFLINE',
  unauthorized: 'BRG-AUTH-401',
  unsupported: 'BRG-STATUS-404',
  wrongService: 'BRG-SERVICE-MISMATCH',
  degraded: 'BRG-CLI-DEGRADED',
  requestFailed: 'BRG-REQUEST-FAILED',
};

const startupGuard = {
  ready: false,
  locked: false,
  enabled: false,
  reasons: [],
  checkedAt: 0
};

const CORE_MODULES = [
  ['ModeManager', () => ModeManager.init()],
  ['SDKClient', () => SDKClient.init()],
  ['RulesManager', () => RulesManager.init()],
  ['MemoryBank', () => MemoryBank.init()],
  ['VSCodeConnector', () => VSCodeConnector.init()]
];

const sdkMonitorState = {
  connectionState: 'idle',
  chatState: 'standby',
  activeRequestId: null,
  lastTool: '',
  lastError: '',
  lastUpdatedAt: 0,
  resyncInFlight: false,
};

const bridgeOrchestratorState = {
  autoStartPromise: null,
  lastError: {
    code: '',
    message: '',
    at: 0,
  },
  lastSnapshot: null,
};

function updateSdkMonitorState(patch = {}) {
  Object.assign(sdkMonitorState, patch, {
    lastUpdatedAt: Date.now(),
  });
}

function getSdkMonitorSnapshot() {
  return {
    ...sdkMonitorState,
    sdkStatus: SDKClient.getStatus(),
    startupGuard: getStartupGuardStatus(),
  };
}

SDKClient.onConnectionChange((isConnected) => {
  updateSdkMonitorState({
    connectionState: isConnected ? 'connected' : 'offline',
  });
});

function clampBridgeAutoStartCooldownMs(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return BRIDGE_AUTO_START_DEFAULT_COOLDOWN_MS;
  }
  return Math.min(
    BRIDGE_AUTO_START_COOLDOWN_MAX_MS,
    Math.max(BRIDGE_AUTO_START_COOLDOWN_MIN_MS, Math.trunc(parsed)),
  );
}

function normalizeBridgeManualRuntime(value) {
  return value === 'windows' || value === 'wsl' ? value : 'auto';
}

function normalizeBridgeUiSettings(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    autoStartBridgeEnabled: source.autoStartBridgeEnabled !== false,
    autoStartBridgeCooldownMs: clampBridgeAutoStartCooldownMs(
      source.autoStartBridgeCooldownMs,
    ),
    autoStartBridgeLastAttemptAt:
      Number(source.autoStartBridgeLastAttemptAt) || 0,
    autoStartBridgeLastResult:
      typeof source.autoStartBridgeLastResult === 'string'
        ? source.autoStartBridgeLastResult
        : BRIDGE_DEFAULT_SETTINGS.autoStartBridgeLastResult,
    autoStartBridgeLastError:
      typeof source.autoStartBridgeLastError === 'string'
        ? source.autoStartBridgeLastError
        : '',
    bridgeManualRuntime: normalizeBridgeManualRuntime(
      source.bridgeManualRuntime,
    ),
    bridgeProjectRootWindows:
      typeof source.bridgeProjectRootWindows === 'string'
        ? source.bridgeProjectRootWindows.trim()
        : '',
    bridgeProjectRootWsl:
      typeof source.bridgeProjectRootWsl === 'string'
        ? source.bridgeProjectRootWsl.trim()
        : '',
    bridgeWslDistro:
      typeof source.bridgeWslDistro === 'string'
        ? source.bridgeWslDistro.trim()
        : '',
  };
}

async function readBridgeSettings() {
  const result = await chrome.storage.local.get(SETTINGS_STORAGE_KEY);
  return normalizeBridgeUiSettings(result?.[SETTINGS_STORAGE_KEY]);
}

async function persistBridgeSettingsPatch(patch = {}) {
  const result = await chrome.storage.local.get(SETTINGS_STORAGE_KEY);
  const current =
    result?.[SETTINGS_STORAGE_KEY] &&
    typeof result[SETTINGS_STORAGE_KEY] === 'object'
      ? result[SETTINGS_STORAGE_KEY]
      : {};

  const next = normalizeBridgeUiSettings({
    ...current,
    ...patch,
  });

  await chrome.storage.local.set({
    [SETTINGS_STORAGE_KEY]: {
      ...current,
      ...next,
    },
  });

  return next;
}

function inferBridgeManualRuntime(settings) {
  const normalized = normalizeBridgeUiSettings(settings);
  if (
    normalized.bridgeProjectRootWindows &&
    !normalized.bridgeProjectRootWsl
  ) {
    return 'windows';
  }
  if (
    normalized.bridgeProjectRootWsl &&
    !normalized.bridgeProjectRootWindows
  ) {
    return 'wsl';
  }
  if (/runtime=wsl|\/mnt\//i.test(normalized.autoStartBridgeLastError)) {
    return 'wsl';
  }
  return 'windows';
}

function getResolvedBridgeRuntime(settings) {
  const normalized = normalizeBridgeUiSettings(settings);
  return normalized.bridgeManualRuntime === 'auto'
    ? inferBridgeManualRuntime(normalized)
    : normalized.bridgeManualRuntime;
}

function getConfiguredBridgeProjectRoot(settings, runtime) {
  const normalized = normalizeBridgeUiSettings(settings);
  return runtime === 'wsl'
    ? normalized.bridgeProjectRootWsl || ''
    : normalized.bridgeProjectRootWindows || '';
}

function getBridgeRuntimeSnapshot(settings) {
  const normalized = normalizeBridgeUiSettings(settings);
  const resolved = getResolvedBridgeRuntime(normalized);
  return {
    selected: normalized.bridgeManualRuntime,
    resolved,
    repoRoot: getConfiguredBridgeProjectRoot(normalized, resolved),
    wslDistro: normalized.bridgeWslDistro || '',
    autoStartEnabled: normalized.autoStartBridgeEnabled === true,
  };
}

function getBridgeAutoStartProtocolUrl() {
  const params = new URLSearchParams({
    source: 'sidepilot-extension',
    v: '1',
  });
  if (chrome?.runtime?.id) {
    params.set('ext', chrome.runtime.id);
  }
  return `${BRIDGE_AUTO_START_PROTOCOL_BASE}?${params.toString()}`;
}

function rememberBridgeError(code, message) {
  bridgeOrchestratorState.lastError = {
    code: String(code || ''),
    message: String(message || ''),
    at: Date.now(),
  };
}

function clearBridgeError() {
  bridgeOrchestratorState.lastError = {
    code: '',
    message: '',
    at: 0,
  };
}

function extractBridgeErrorCode(text = '') {
  const matched = String(text).match(
    /(BRG-(?:AUTO-\d{3}|AUTH-\d{3}|STATUS-\d{3}|SERVICE-MISMATCH|OFFLINE|CLI-DEGRADED|REQUEST-FAILED))/,
  );
  return matched ? matched[1] : '';
}

function normalizeBridgeActionState(chatState = '', bridgeAvailability = 'offline') {
  switch (chatState) {
    case 'sending':
    case 'preparing':
      return 'connecting';
    case 'streaming':
    case 'tool_running':
      return 'streaming';
    case 'permission_required':
      return 'waiting_permission';
    case 'resyncing':
    case 'auto_reconnecting':
    case 'reconnecting':
      return 'recovering';
    case 'failed':
      return 'failed';
    default:
      return bridgeAvailability === 'starting' ? 'launching' : 'idle';
  }
}

function isBridgeCliHealthy(cli = {}) {
  const state = String(cli?.sdkState || '').trim();
  return ['idle', 'ready', 'connected'].includes(state);
}

function isAuthFailureMessage(message = '') {
  return /auth|login|copilot|api key|unauthorized/i.test(String(message));
}

async function openUrlInTab(url) {
  if (!url || typeof url !== 'string') {
    throw new Error('Invalid URL');
  }
  await chrome.tabs.create({ url, active: true });
  chrome.runtime.sendMessage({
    action: 'externalLinkRedirected',
    url,
  }).catch(() => {});
}

async function triggerBridgeAutoStartProtocol() {
  try {
    await openUrlInTab(getBridgeAutoStartProtocolUrl());
    return { success: true };
  } catch (err) {
    return {
      success: false,
      code: BRIDGE_LAUNCHER_ERROR_CODES.launcherUnavailable,
      error: err?.message || String(err),
    };
  }
}

async function waitForBridgeReady(timeoutMs = BRIDGE_AUTO_START_TIMEOUT_MS) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const health = await ConnectionController.checkBridgeHealth({
      port: DEFAULT_BRIDGE_PORT,
      timeoutMs: 2500,
    });
    if (health.success && health.isBridge) {
      return true;
    }
    await new Promise((resolve) =>
      setTimeout(resolve, BRIDGE_AUTO_START_POLL_INTERVAL_MS),
    );
  }
  return false;
}

function isBridgeAutoStartCoolingDown(settings) {
  const normalized = normalizeBridgeUiSettings(settings);
  const lastAttemptAt = Number(normalized.autoStartBridgeLastAttemptAt) || 0;
  if (lastAttemptAt <= 0) {
    return { coolingDown: false, remainingMs: 0 };
  }
  const remainingMs =
    normalized.autoStartBridgeCooldownMs - (Date.now() - lastAttemptAt);
  return {
    coolingDown: remainingMs > 0,
    remainingMs: remainingMs > 0 ? remainingMs : 0,
  };
}

async function attemptBridgeAutoStart(options = {}) {
  if (bridgeOrchestratorState.autoStartPromise) {
    return bridgeOrchestratorState.autoStartPromise;
  }

  const task = (async () => {
    const settings = await readBridgeSettings();
    if (settings.autoStartBridgeEnabled !== true && options.force !== true) {
      const detail = 'Bridge auto-start is disabled.';
      rememberBridgeError(BRIDGE_LAUNCHER_ERROR_CODES.offline, detail);
      return {
        success: false,
        code: BRIDGE_LAUNCHER_ERROR_CODES.offline,
        detail,
      };
    }

    if (options.bypassCooldown !== true) {
      const cooldown = isBridgeAutoStartCoolingDown(settings);
      if (cooldown.coolingDown) {
        const remainSec = Math.max(1, Math.ceil(cooldown.remainingMs / 1000));
        const detail = `${BRIDGE_LAUNCHER_ERROR_CODES.cooldown} | cooldown ${remainSec}s`;
        await persistBridgeSettingsPatch({
          autoStartBridgeLastError: detail,
          autoStartBridgeLastResult: 'failed',
        });
        rememberBridgeError(BRIDGE_LAUNCHER_ERROR_CODES.cooldown, detail);
        return {
          success: false,
          code: BRIDGE_LAUNCHER_ERROR_CODES.cooldown,
          detail,
        };
      }
    }

    await persistBridgeSettingsPatch({
      autoStartBridgeLastAttemptAt: Date.now(),
      autoStartBridgeLastResult: 'launching',
      autoStartBridgeLastError: '',
    });

    const launch = await triggerBridgeAutoStartProtocol();
    if (!launch.success) {
      const detail = `${launch.code} | ${launch.error || 'launcher unavailable'}`;
      await persistBridgeSettingsPatch({
        autoStartBridgeLastResult: 'failed',
        autoStartBridgeLastError: detail,
      });
      rememberBridgeError(launch.code, detail);
      return {
        success: false,
        code: launch.code,
        detail,
      };
    }

    const ready = await waitForBridgeReady();
    if (!ready) {
      const detail = `${BRIDGE_LAUNCHER_ERROR_CODES.timeout} | timeout ${Math.round(
        BRIDGE_AUTO_START_TIMEOUT_MS / 1000,
      )}s`;
      await persistBridgeSettingsPatch({
        autoStartBridgeLastResult: 'failed',
        autoStartBridgeLastError: detail,
      });
      rememberBridgeError(BRIDGE_LAUNCHER_ERROR_CODES.timeout, detail);
      return {
        success: false,
        code: BRIDGE_LAUNCHER_ERROR_CODES.timeout,
        detail,
      };
    }

    await persistBridgeSettingsPatch({
      autoStartBridgeLastResult: 'ready',
      autoStartBridgeLastError: '',
    });
    clearBridgeError();
    return { success: true, code: '' };
  })().finally(() => {
    bridgeOrchestratorState.autoStartPromise = null;
  });

  bridgeOrchestratorState.autoStartPromise = task;
  return task;
}

function mapBridgeAvailability({
  health,
  statusData,
  sdkStatus,
}) {
  if (!health?.success) return 'offline';
  if (!health?.isBridge) return 'unsupported';
  if (!statusData?.success) return 'unsupported';
  const cliState = String(statusData?.cli?.sdkState || sdkStatus || '').trim();
  return isBridgeCliHealthy({ sdkState: cliState }) ? 'ready' : 'degraded';
}

function buildBridgePrimaryAction(snapshot) {
  const lastErrorCode = snapshot?.lastError?.code || '';
  if (snapshot?.bridge?.availability === 'starting') {
    return {
      action: 'start',
      label: 'Bridge 啟動中...',
      disabled: true,
    };
  }
  if (
    snapshot?.bridge?.availability === 'ready' &&
    isAuthFailureMessage(snapshot?.lastError?.message)
  ) {
    return {
      action: 'open_login',
      label: '開啟 GitHub 登入頁',
      disabled: false,
    };
  }
  if (snapshot?.bridge?.availability === 'ready') {
    return {
      action: 'check',
      label: 'Bridge 已就緒',
      disabled: false,
    };
  }
  if (lastErrorCode === BRIDGE_LAUNCHER_ERROR_CODES.launcherUnavailable) {
    return {
      action: 'copy_manual_command',
      label: '複製 Quick Setup',
      disabled: false,
    };
  }
  if (snapshot?.lastError?.code) {
    return {
      action: 'start',
      label: '重試啟動 Bridge',
      disabled: false,
    };
  }
  return {
    action: 'start',
    label: '啟動 Bridge',
    disabled: false,
  };
}

function buildBridgeSummary(snapshot) {
  const availability = snapshot?.bridge?.availability || 'offline';
  if (availability === 'ready') {
    return {
      headline: 'Bridge 已就緒',
      detail: 'SDK 模式可直接使用；若聊天異常，再看詳細鏈路。',
    };
  }
  if (availability === 'starting') {
    return {
      headline: '正在啟動 Bridge',
      detail: '系統正在等待本機 bridge 就緒，通常幾秒內會完成。',
    };
  }
  if (availability === 'unsupported') {
    return {
      headline: 'Bridge 版本不相容',
      detail: '請升級到支援 /api/status 的新版 bridge。',
    };
  }
  if (snapshot?.lastError?.code === BRIDGE_LAUNCHER_ERROR_CODES.launcherUnavailable) {
    return {
      headline: '還沒有可用的啟動器',
      detail: '先執行 Quick Setup，再回來重新檢查或啟動 Bridge。',
    };
  }
  return {
    headline: 'Bridge 尚未連線',
    detail: '先確認 repo 路徑與 runtime，再啟動本機 bridge。',
  };
}

function buildBridgeSnapshotRows(snapshot) {
  return [
    {
      label: 'Repo Root',
      value: snapshot?.runtime?.repoRoot || '尚未設定',
    },
    {
      label: 'Runtime',
      value: snapshot?.runtime?.resolved || 'windows',
    },
    {
      label: 'Launcher',
      value: snapshot?.bridge?.launcherConfigured
        ? '已設定'
        : '尚未確認',
    },
    {
      label: 'Bridge',
      value: snapshot?.bridge?.version
        ? `v${snapshot.bridge.version} · ${snapshot.bridge.availability}`
        : snapshot?.bridge?.availability || 'offline',
    },
    {
      label: 'CLI',
      value: snapshot?.cli?.sdkState || 'idle',
    },
  ];
}

async function fetchBridgeStatusSnapshot(options = {}) {
  const settings = await readBridgeSettings();
  const runtime = getBridgeRuntimeSnapshot(settings);
  const health = await ConnectionController.checkBridgeHealth({
    port: Number(options?.port) || DEFAULT_BRIDGE_PORT,
    timeoutMs: Number(options?.timeoutMs) || 3000,
  });

  if (
    !health.success &&
    options?.allowAutoStart === true &&
    runtime.autoStartEnabled
  ) {
    await attemptBridgeAutoStart({
      force: options?.force === true,
      bypassCooldown: options?.bypassCooldown === true,
    });
    return fetchBridgeStatusSnapshot({
      ...options,
      allowAutoStart: false,
    });
  }

  let statusResult = {
    success: false,
    status: 0,
    data: null,
    error: '',
  };
  if (health.success && health.isBridge) {
    statusResult = await handleBridgeJsonRequestInternal({
      port: Number(options?.port) || DEFAULT_BRIDGE_PORT,
      path: '/api/status',
      method: 'GET',
      timeoutMs: Number(options?.timeoutMs) || 3000,
      requireAuth: true,
    });
  }

  if (!health.success) {
    rememberBridgeError(
      BRIDGE_LAUNCHER_ERROR_CODES.offline,
      health.error || 'bridge offline',
    );
  } else if (!health.isBridge) {
    rememberBridgeError(
      BRIDGE_LAUNCHER_ERROR_CODES.wrongService,
      health.data?.service
        ? `unexpected service: ${health.data.service}`
        : 'unexpected service on bridge port',
    );
  } else if (!statusResult.success) {
    const code =
      statusResult.status === 401
        ? BRIDGE_LAUNCHER_ERROR_CODES.unauthorized
        : statusResult.status === 404
          ? BRIDGE_LAUNCHER_ERROR_CODES.unsupported
          : BRIDGE_LAUNCHER_ERROR_CODES.requestFailed;
    rememberBridgeError(code, statusResult.error || `HTTP ${statusResult.status || 500}`);
  } else {
    const cliState = String(statusResult.data?.cli?.sdkState || '').trim();
    if (isBridgeCliHealthy({ sdkState: cliState })) {
      clearBridgeError();
    } else {
      const lastCliError =
        statusResult.data?.lastError?.message ||
        statusResult.data?.cli?.prompt?.lastError ||
        'bridge degraded';
      rememberBridgeError(BRIDGE_LAUNCHER_ERROR_CODES.degraded, lastCliError);
    }
  }

  const bridgeVersion =
    statusResult.data?.bridge?.version || chrome.runtime.getManifest()?.version || '';
  const availability = bridgeOrchestratorState.autoStartPromise
    ? 'starting'
    : mapBridgeAvailability({
        health,
        statusData: statusResult.data,
        sdkStatus: health?.data?.sdk,
      });

  const snapshot = {
    bridge: {
      service:
        statusResult.data?.bridge?.service ||
        health?.data?.service ||
        ConnectionController.BRIDGE_SERVICE_NAME,
      version: bridgeVersion,
      port: Number(options?.port) || DEFAULT_BRIDGE_PORT,
      availability,
      authConfigured:
        statusResult.data?.bridge?.authConfigured ??
        health?.data?.auth?.extensionBindingConfigured ??
        false,
      launcherConfigured:
        extractBridgeErrorCode(settings.autoStartBridgeLastError) !==
        BRIDGE_LAUNCHER_ERROR_CODES.launcherUnavailable,
      backend:
        statusResult.data?.bridge?.backend || health?.data?.backend || null,
    },
    cli: {
      sdkState:
        statusResult.data?.cli?.sdkState ||
        health?.data?.sdk ||
        'idle',
      sessionCount: Number(statusResult.data?.cli?.sessionCount || 0),
      pendingPermissionCount: Number(
        statusResult.data?.cli?.pendingPermissionCount || 0,
      ),
      prompt: statusResult.data?.cli?.prompt || null,
    },
    compatibility: {
      apiVersion:
        statusResult.data?.compatibility?.apiVersion ||
        BRIDGE_STATUS_API_VERSION,
      supported:
        availability !== 'unsupported' &&
        availability !== 'offline' &&
        health.isBridge === true,
      missingCapabilities:
        statusResult.status === 404 ? ['/api/status'] : [],
    },
    runtime,
    auth: {
      required: true,
      configured:
        health?.data?.auth?.extensionBindingConfigured === true ||
        statusResult.data?.bridge?.authConfigured === true,
      bootstrapPath:
        health?.data?.auth?.bootstrapPath || '/api/auth/bootstrap',
    },
    lastError: {
      ...bridgeOrchestratorState.lastError,
    },
    action: {
      state: normalizeBridgeActionState(
        sdkMonitorState.chatState,
        availability,
      ),
    },
    checkedAt: Date.now(),
  };

  snapshot.summary = buildBridgeSummary(snapshot);
  snapshot.primaryAction = buildBridgePrimaryAction(snapshot);
  snapshot.connectionRows = buildBridgeSnapshotRows(snapshot);

  bridgeOrchestratorState.lastSnapshot = snapshot;
  return snapshot;
}

function addStartupGuardFailure(message) {
  startupGuard.reasons.push(String(message || 'unknown failure'));
}

function normalizeSealDigest(value) {
  const digest = typeof value === 'string'
    ? value.trim().toLowerCase()
    : '';

  if (SEAL_DIGEST_PATTERN.test(digest)) {
    return { digest, legacy: false };
  }

  if (LEGACY_SEAL_DIGEST_PATTERN.test(digest)) {
    return { digest, legacy: true };
  }

  return { digest: '', legacy: false };
}

function getStartupGuardStatus() {
  return {
    ready: startupGuard.ready,
    locked: startupGuard.locked,
    enabled: startupGuard.enabled,
    reasons: [...startupGuard.reasons],
    checkedAt: startupGuard.checkedAt
  };
}

function normalizeSelfIterationSettings(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const normalizedDigest = normalizeSealDigest(source.selfIterationLastSealDigest);

  return {
    selfIterationEnabled: source.selfIterationEnabled === true,
    selfIterationFirstSealDone: source.selfIterationFirstSealDone === true,
    selfIterationLastSealDigest: normalizedDigest.digest,
    selfIterationLegacySealDigest: normalizedDigest.legacy
  };
}

async function readSelfIterationSettings() {
  const result = await chrome.storage.local.get(SETTINGS_STORAGE_KEY);
  return normalizeSelfIterationSettings(result?.[SETTINGS_STORAGE_KEY]);
}

async function persistSelfIterationSettingsPatch(patch) {
  const result = await chrome.storage.local.get(SETTINGS_STORAGE_KEY);
  const current = result?.[SETTINGS_STORAGE_KEY] && typeof result[SETTINGS_STORAGE_KEY] === 'object'
    ? result[SETTINGS_STORAGE_KEY]
    : {};

  await chrome.storage.local.set({
    [SETTINGS_STORAGE_KEY]: {
      ...current,
      ...patch
    }
  });
}

function getManifestSealDigest() {
  try {
    const manifest = chrome.runtime.getManifest();
    const seal = String(manifest?.version_name || '');
    const matched = seal.match(SEAL_PATTERN);
    if (!matched) {
      return { valid: false, versionName: seal, digest: '' };
    }
    const digest = seal.split('+')[1].toLowerCase();
    return { valid: true, versionName: seal, digest };
  } catch {
    return { valid: false, versionName: '', digest: '' };
  }
}

async function verifyIntegrityViaBridge(timeoutMs = 7000) {
  try {
    const response = await handleBridgeJsonRequestInternal({
      path: '/api/integrity/verify',
      method: 'POST',
      body: { timeoutMs },
      timeoutMs,
    });

    if (!response.success || !response.data?.success) {
      return {
        success: false,
        error: response.error || response.data?.error || `HTTP ${response.status || 500}`
      };
    }
    return { success: true };
  } catch (err) {
    const error = err?.name === 'AbortError'
      ? `verify timeout after ${timeoutMs}ms`
      : (err?.message || String(err));
    return { success: false, error };
  }
}

async function applyPanelStartupPolicy() {
  const openPanelOnActionClick = startupGuard.ready && !startupGuard.locked;
  try {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick });
  } catch (err) {
    console.error('Failed to set panel behavior:', err);
  }
}

async function initializeCoreModules(strictMode) {
  for (const [name, initFn] of CORE_MODULES) {
    try {
      await initFn();
    } catch (err) {
      const message = `${name}.init failed: ${err?.message || err}`;
      console.error(`[SidePilot] Failed to initialize ${name}:`, err);
      if (strictMode) {
        addStartupGuardFailure(message);
      }
    }
  }
}

async function runStartupGuardChecks() {
  startupGuard.ready = false;
  startupGuard.locked = false;
  startupGuard.enabled = false;
  startupGuard.reasons = [];
  startupGuard.checkedAt = Date.now();

  let settings;
  try {
    settings = await readSelfIterationSettings();
  } catch (err) {
    addStartupGuardFailure(`Cannot read self-iteration settings: ${err?.message || err}`);
    startupGuard.enabled = true;
    startupGuard.locked = true;
    startupGuard.ready = true;
    startupGuard.checkedAt = Date.now();
    await applyPanelStartupPolicy();
    return;
  }

  const guardEnabled = settings.selfIterationEnabled;
  startupGuard.enabled = guardEnabled;

  // Core modules should always be initialized; strict failure lock only applies
  // when self-iteration mode is enabled.
  await initializeCoreModules(guardEnabled);

  // Self-iteration mode not enabled -> startup guard bypassed (no lock enforcement)
  if (!guardEnabled) {
    startupGuard.ready = true;
    startupGuard.locked = false;
    startupGuard.checkedAt = Date.now();
    console.log('[SidePilot] Startup guard BYPASS (self-iteration disabled)');
    await applyPanelStartupPolicy();
    return;
  }

  // Check 1: Manifest seal format
  const manifestSeal = getManifestSealDigest();
  if (!manifestSeal.valid) {
    addStartupGuardFailure(
      `Manifest version_name seal missing or invalid: "${manifestSeal.versionName || '(empty)'}"`
    );
  }

  // Check 2: self-iteration must complete first seal
  if (!settings.selfIterationFirstSealDone) {
    addStartupGuardFailure('selfIterationFirstSealDone must be true when self-iteration is enabled');
  }

  if (!settings.selfIterationLastSealDigest) {
    if (settings.selfIterationFirstSealDone && manifestSeal.digest) {
      await persistSelfIterationSettingsPatch({
        selfIterationLastSealDigest: manifestSeal.digest
      });
      settings.selfIterationLastSealDigest = manifestSeal.digest;
      settings.selfIterationLegacySealDigest = false;
      console.warn('[SidePilot] Startup guard auto-recovered missing selfIterationLastSealDigest from manifest seal');
    } else {
      addStartupGuardFailure('selfIterationLastSealDigest missing when self-iteration is enabled');
    }
  }

  if (
    settings.selfIterationLegacySealDigest &&
    settings.selfIterationLastSealDigest &&
    manifestSeal.digest &&
    manifestSeal.digest.startsWith(settings.selfIterationLastSealDigest)
  ) {
    await persistSelfIterationSettingsPatch({
      selfIterationLastSealDigest: manifestSeal.digest
    });
    settings.selfIterationLastSealDigest = manifestSeal.digest;
    settings.selfIterationLegacySealDigest = false;
    console.warn('[SidePilot] Startup guard auto-migrated legacy 8-char seal digest to 16-char digest');
  }

  // Check 3: persisted digest should match current manifest digest
  if (
    settings.selfIterationLastSealDigest &&
    manifestSeal.digest &&
    settings.selfIterationLastSealDigest !== manifestSeal.digest
  ) {
    addStartupGuardFailure(
      `Seal digest mismatch: settings=${settings.selfIterationLastSealDigest}, manifest=${manifestSeal.digest}`
    );
  }

  // Check 4: external integrity verifier (bridge script)
  const verifyResult = await verifyIntegrityViaBridge();
  if (!verifyResult.success) {
    addStartupGuardFailure(`External integrity verify failed: ${verifyResult.error}`);
  }

  startupGuard.locked = startupGuard.reasons.length > 0;
  startupGuard.ready = true;

  if (startupGuard.locked) {
    console.error('[SidePilot] Startup guard LOCKED', startupGuard.reasons);
  } else {
    console.log('[SidePilot] Startup guard PASS');
  }

  await applyPanelStartupPolicy();
}

// ============================================
// Startup Guard
// ============================================

runStartupGuardChecks().catch(async (err) => {
  addStartupGuardFailure(`startup guard unexpected error: ${err?.message || err}`);
  startupGuard.locked = true;
  startupGuard.ready = true;
  startupGuard.enabled = true;
  startupGuard.checkedAt = Date.now();
  console.error('[SidePilot] Startup guard crashed:', err);
  await applyPanelStartupPolicy();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') return;
  const settingsChange = changes?.[SETTINGS_STORAGE_KEY];
  if (!settingsChange) return;

  const oldSettings = normalizeSelfIterationSettings(settingsChange.oldValue);
  const newSettings = normalizeSelfIterationSettings(settingsChange.newValue);
  const enabledChanged = oldSettings.selfIterationEnabled !== newSettings.selfIterationEnabled;
  const sealStateChanged =
    oldSettings.selfIterationFirstSealDone !== newSettings.selfIterationFirstSealDone ||
    oldSettings.selfIterationLastSealDigest !== newSettings.selfIterationLastSealDigest;

  if (!enabledChanged && !(newSettings.selfIterationEnabled && sealStateChanged)) {
    return;
  }

  runStartupGuardChecks().catch(async (err) => {
    addStartupGuardFailure(`startup guard refresh error: ${err?.message || err}`);
    startupGuard.locked = true;
    startupGuard.ready = true;
    startupGuard.enabled = true;
    startupGuard.checkedAt = Date.now();
    console.error('[SidePilot] Startup guard refresh crashed:', err);
    await applyPanelStartupPolicy();
  });
});

// ============================================
// Side Panel 控制
// ============================================

// Default deny until startup guard completes
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false })
  .catch(err => console.error('Failed to set panel behavior:', err));

chrome.action.onClicked.addListener(async (tab) => {
  if (!startupGuard.ready) {
    console.warn('[SidePilot] Startup guard is still running. Panel open blocked.');
    return;
  }
  if (startupGuard.locked) {
    console.error('[SidePilot] Startup guard locked. Panel open blocked.');
    return;
  }

  try {
    await chrome.sidePanel.open({ tabId: tab.id });
  } catch (err) {
    console.error('Failed to open side panel:', err);
  }
});

async function runSdkResync(options = {}) {
  const port = Number(options?.port) || 31031;
  const reconnect = options?.reconnect !== false;

  updateSdkMonitorState({
    resyncInFlight: true,
    chatState: 'resyncing',
    lastError: '',
  });

  try {
    SDKClient.disconnect();
    ConnectionController.clearBridgeAuth({ port });

    if (reconnect) {
      await SDKClient.connect(port);
    }

    updateSdkMonitorState({
      connectionState: reconnect ? 'connected' : 'idle',
      chatState: 'standby',
      activeRequestId: null,
      resyncInFlight: false,
      lastTool: '',
    });

    return { success: true, monitor: getSdkMonitorSnapshot() };
  } catch (err) {
    updateSdkMonitorState({
      connectionState: 'offline',
      chatState: 'failed',
      activeRequestId: null,
      resyncInFlight: false,
      lastError: err?.message || String(err),
    });

    return {
      success: false,
      error: err?.message || String(err),
      monitor: getSdkMonitorSnapshot(),
    };
  }
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'sdk-chat-stream') return;

  let closed = false;
  const safePost = (payload) => {
    if (closed) return;
    try {
      port.postMessage(payload);
    } catch {
      closed = true;
    }
  };

  port.onDisconnect.addListener(() => {
    closed = true;
  });

  port.onMessage.addListener(async (message) => {
    if (startupGuard.locked || !startupGuard.ready) {
      safePost({
        type: 'error',
        error: startupGuard.locked ? 'STARTUP_GUARD_LOCKED' : 'STARTUP_GUARD_PENDING',
      });
      return;
    }

    if (message?.type !== 'send') return;

    if (sdkMonitorState.activeRequestId && sdkMonitorState.activeRequestId !== message.requestId) {
      safePost({
        type: 'error',
        requestId: message.requestId,
        error: 'Another SDK request is already running',
      });
      return;
    }

    const requestId = message.requestId || `sdk_${Date.now()}`;
    const payload = message.payload || {};

    updateSdkMonitorState({
      activeRequestId: requestId,
      chatState: 'preparing',
      lastError: '',
      lastTool: '',
    });
    safePost({ type: 'status', requestId, state: 'preparing' });

    try {
      updateSdkMonitorState({
        chatState: 'sending',
      });
      safePost({ type: 'status', requestId, state: 'sending' });
      updateSdkMonitorState({
        chatState: 'waiting_cli',
      });
      safePost({ type: 'status', requestId, state: 'waiting_cli' });

      const result = await SDKClient.sendMessageStreaming(
        payload,
        (delta) => {
          if (delta) {
            updateSdkMonitorState({
              chatState: 'streaming',
            });
            safePost({ type: 'delta', requestId, delta });
          }
        },
        (toolEvent) => {
          const toolName = toolEvent?.toolName || toolEvent?.title || toolEvent?.name || 'tool';
          updateSdkMonitorState({
            chatState: toolEvent?.pendingPermissions ? 'permission_required' : 'tool_running',
            lastTool: String(toolName),
          });
          safePost({
            type: 'tool',
            requestId,
            tool: toolName,
            detail: toolEvent,
          });
          safePost({
            type: 'status',
            requestId,
            state: toolEvent?.pendingPermissions ? 'permission_required' : 'tool_running',
            detail: toolName,
          });
        },
      );

      updateSdkMonitorState({
        chatState: 'completed',
        activeRequestId: null,
      });
      safePost({ type: 'status', requestId, state: 'completed' });
      safePost({ type: 'done', requestId, content: result });
    } catch (err) {
      updateSdkMonitorState({
        chatState: 'failed',
        activeRequestId: null,
        lastError: err?.message || String(err),
      });
      safePost({
        type: 'error',
        requestId,
        error: err?.message || String(err),
      });
    }
  });
});

// ============================================
// 訊息處理
// ============================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const action = message?.action;

  if (action === 'startupGuardStatus') {
    sendResponse({
      success: !startupGuard.locked,
      guard: getStartupGuardStatus()
    });
    return false;
  }

  if (action === 'startupGuardRefresh') {
    runStartupGuardChecks()
      .then(() => {
        sendResponse({ success: !startupGuard.locked, guard: getStartupGuardStatus() });
      })
      .catch((err) => {
        sendResponse({
          success: false,
          error: err?.message || String(err),
          guard: getStartupGuardStatus()
        });
      });
    return true;
  }

  if (!startupGuard.ready) {
    sendResponse({
      success: false,
      error: 'STARTUP_GUARD_PENDING',
      guard: getStartupGuardStatus()
    });
    return false;
  }

  if (startupGuard.locked) {
    sendResponse({
      success: false,
      error: 'STARTUP_GUARD_LOCKED',
      guard: getStartupGuardStatus()
    });
    return false;
  }

  switch (action) {
    case 'getPageContent':
      handleGetPageContent(message, sendResponse);
      return true;

    case 'getSelectedText':
      handleGetSelectedText(message, sendResponse);
      return true;

    case 'captureVisibleScreenshot':
      handleCaptureVisibleScreenshot(message, sendResponse);
      return true;

    case 'capturePartialScreenshot':
      handleCapturePartialScreenshot(message, sendResponse);
      return true;

    case 'captureFullPageScreenshot':
      handleCaptureFullPageScreenshot(message, sendResponse);
      return true;

    case 'openCopilotWindow':
      handleOpenCopilotWindow(sendResponse);
      return true;

    case 'openExternalLink':
      handleOpenExternalLink(message.url, sendResponse);
      return true;

    case 'getMode':
      sendResponse({ success: true, mode: ModeManager.getActiveMode() });
      return false;

    case 'setMode':
      ModeManager.setMode(message.mode).then(() => {
        sendResponse({ success: true, mode: message.mode });
      }).catch(err => {
        sendResponse({ success: false, error: err.message });
      });
      return true;

    case 'detectMode':
      ModeManager.detectMode().then(mode => {
        sendResponse({ success: true, mode });
      }).catch(err => {
        sendResponse({ success: false, error: err.message });
      });
      return true;

    case 'sdkConnect':
      SDKClient.connect(message.port).then(() => {
        sendResponse({ success: true });
      }).catch(err => {
        sendResponse({ success: false, error: err.message, code: err.code });
      });
      return true;

    case 'sdkDisconnect':
      SDKClient.disconnect();
      sendResponse({ success: true });
      return false;

    case 'sdkSend':
      updateSdkMonitorState({
        chatState: 'sending',
        lastError: '',
      });
      SDKClient.sendMessage(message.data).then(response => {
        updateSdkMonitorState({
          chatState: 'completed',
          activeRequestId: null,
        });
        sendResponse({ success: true, data: response });
      }).catch(err => {
        updateSdkMonitorState({
          chatState: 'failed',
          activeRequestId: null,
          lastError: err.message,
        });
        sendResponse({ success: false, error: err.message, code: err.code });
      });
      return true;

    case 'sdkStatus':
      sendResponse({ success: true, status: SDKClient.getStatus() });
      return false;

    case 'sdkMonitorStatus':
      sendResponse({ success: true, monitor: getSdkMonitorSnapshot() });
      return false;

    case 'sdkResync':
      runSdkResync(message).then(sendResponse);
      return true;

    case 'bridgeStatusSnapshot':
      handleBridgeStatusSnapshot(message, sendResponse);
      return true;

    case 'bridgeStatusAction':
      handleBridgeStatusAction(message, sendResponse);
      return true;

    case 'sdkModels':
      SDKClient.listModels().then(models => {
        sendResponse({ success: true, models });
      }).catch(err => {
        sendResponse({ success: false, error: err.message });
      });
      return true;

    case 'bridgeHealth':
      handleBridgeHealth(message, sendResponse);
      return true;

    case 'bridgeAuthBootstrap':
      handleBridgeAuthBootstrap(message, sendResponse);
      return true;

    case 'bridgeRequest':
      handleBridgeRequest(message, sendResponse);
      return true;

    case 'antigravityProbe':
      handleAntigravityProbe(message, sendResponse);
      return true;

    // Rules Manager
    case 'rules.save':
      RulesManager.saveRules(message.content)
        .then(success => sendResponse({ success }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;

    case 'rules.load':
      RulesManager.loadRules()
        .then(result => sendResponse({ success: true, ...result }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;

    case 'rules.export':
      RulesManager.exportAsFile()
        .then(success => sendResponse({ success }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;

    case 'rules.getTemplates':
      sendResponse({ success: true, templates: RulesManager.getTemplates() });
      return false;

    case 'rules.applyTemplate':
      RulesManager.applyTemplate(message.templateId)
        .then(result => sendResponse(result))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;

    // Memory Bank
    case 'memory.create':
      MemoryBank.createEntry(message.entry)
        .then(entry => sendResponse({ success: true, entry }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;

    case 'memory.get':
      sendResponse({ success: true, entry: MemoryBank.getEntry(message.id) });
      return false;

    case 'memory.update':
      MemoryBank.updateEntry(message.id, message.data)
        .then(entry => sendResponse({ success: true, entry }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;

    case 'memory.delete':
      MemoryBank.deleteEntry(message.id)
        .then(success => sendResponse({ success }))
        .catch(err => sendResponse({ success: false, error: err.message }));
      return true;

    case 'memory.list':
      sendResponse({ success: true, entries: MemoryBank.listEntries(message.filter) });
      return false;

     case 'memory.search':
       sendResponse({ success: true, entries: MemoryBank.searchEntries(message.query) });
       return false;

    // VS Code Connector
    case 'vscode.send': {
      const entry = MemoryBank.getEntry(message.id);
      if (!entry) {
        sendResponse({ success: false, error: '找不到此條目' });
        return false;
      }
      VSCodeConnector.sendToVSCode(entry).then(result => {
        sendResponse({ success: result });
      }).catch(err => {
        sendResponse({ success: false, error: err.message });
      });
      return true;
    }

    default:
      return false;
  }
});

async function handleBridgeHealth(message, sendResponse) {
  const port = Number(message?.port) || 31031;
  const timeoutMs = Number(message?.timeoutMs) || 3000;
  const result = await ConnectionController.checkBridgeHealth({ port, timeoutMs });
  sendResponse(result);
}

async function handleBridgeStatusSnapshot(message, sendResponse) {
  try {
    const snapshot = await fetchBridgeStatusSnapshot(message);
    sendResponse({ success: true, snapshot });
  } catch (err) {
    sendResponse({
      success: false,
      error: err?.message || String(err),
      snapshot: bridgeOrchestratorState.lastSnapshot,
    });
  }
}

async function handleBridgeStatusAction(message, sendResponse) {
  const action = String(message?.bridgeAction || '').trim();

  try {
    if (action === 'open_login') {
      await openUrlInTab(SDK_LOGIN_URL);
      sendResponse({ success: true });
      return;
    }

    if (action === 'resync') {
      const resync = await runSdkResync({
        port: Number(message?.port) || DEFAULT_BRIDGE_PORT,
        reconnect: message?.reconnect !== false,
      });
      const snapshot = await fetchBridgeStatusSnapshot({
        port: Number(message?.port) || DEFAULT_BRIDGE_PORT,
      });
      sendResponse({
        success: resync.success,
        error: resync.error || '',
        monitor: resync.monitor,
        snapshot,
      });
      return;
    }

    const snapshot = await fetchBridgeStatusSnapshot({
      port: Number(message?.port) || DEFAULT_BRIDGE_PORT,
      allowAutoStart: action === 'start',
      force: message?.force === true || action === 'start',
      bypassCooldown: message?.bypassCooldown === true || action === 'start',
      timeoutMs: Number(message?.timeoutMs) || 3000,
    });
    sendResponse({ success: true, snapshot });
  } catch (err) {
    sendResponse({
      success: false,
      error: err?.message || String(err),
      snapshot: bridgeOrchestratorState.lastSnapshot,
    });
  }
}

async function handleBridgeAuthBootstrap(message, sendResponse) {
  const port = Number(message?.port) || 31031;
  const timeoutMs = Number(message?.timeoutMs) || 2500;
  const forceRefresh = message?.forceRefresh === true;
  const result = await ConnectionController.bootstrapBridgeAuth({
    port,
    timeoutMs,
    forceRefresh,
  });
  sendResponse(result);
}

async function handleBridgeRequest(message, sendResponse) {
  try {
    const result = await handleBridgeJsonRequestInternal(message);
    sendResponse(result);
  } catch (err) {
    sendResponse({
      success: false,
      error: err?.message || String(err),
      status: 0,
      data: null,
    });
  }
}

async function handleBridgeJsonRequestInternal(message = {}) {
  const port = Number(message?.port) || 31031;
  const path = String(message?.path || '');
  const method = String(message?.method || 'GET').toUpperCase();
  const timeoutMs = Number(message?.timeoutMs) || 5000;
  const requireAuth = message?.requireAuth !== false;

  if (!path.startsWith('/api/')) {
    return {
      success: false,
      status: 400,
      error: 'invalid bridge path',
      data: null,
    };
  }

  const baseUrl = ConnectionController.getBridgeBaseUrl(port);
  const url = `${baseUrl}${path}`;
  const body = message?.body;

  const doFetch = async (forceRefresh = false) => {
    let token = '';
    if (requireAuth) {
      const auth = await ConnectionController.bootstrapBridgeAuth({
        port,
        timeoutMs: Math.min(timeoutMs, 2500),
        forceRefresh,
      });
      if (!auth.success || !auth.token) {
        return {
          success: false,
          status: auth.status || 401,
          error: auth.error || 'bridge auth bootstrap failed',
          data: null,
          url,
        };
      }
      token = auth.token;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers: ConnectionController.buildBridgeHeaders({
          token,
          json: body !== undefined,
        }),
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      const text = await response.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      return {
        success: response.ok,
        status: response.status,
        data,
        error: response.ok ? '' : (data?.error || `HTTP ${response.status}`),
        url,
      };
    } catch (err) {
      return {
        success: false,
        status: 0,
        data: null,
        error: err?.name === 'AbortError' ? 'timeout' : (err?.message || 'unknown error'),
        url,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  };

  let result = await doFetch(false);
  if (result.status === 401 && requireAuth) {
    ConnectionController.clearBridgeAuth({ port });
    result = await doFetch(true);
  }
  return result;
}

function normalizeLoopbackBaseUrl(rawValue, fallbackUrl = ANTIGRAVITY_DEFAULT_BASE_URL) {
  try {
    const parsed = new URL(String(rawValue || fallbackUrl).trim() || fallbackUrl);
    const protocol = parsed.protocol === 'https:' ? 'https:' : 'http:';
    const host = String(parsed.hostname || '').toLowerCase();
    if (host !== '127.0.0.1' && host !== 'localhost') {
      throw new Error('loopback_only');
    }
    const port = Number.parseInt(parsed.port || '', 10);
    const normalizedPort = Number.isInteger(port) && port > 0 ? port : (protocol === 'https:' ? 443 : 80);
    return `${protocol}//${host}:${normalizedPort}`;
  } catch {
    return fallbackUrl;
  }
}

function getAntigravityProbeRequest(message = {}) {
  const probe = String(message?.probe || 'health').toLowerCase();
  switch (probe) {
    case 'meta':
      return { probe, method: 'GET', path: '/v1/meta', requiresAuth: true };
    case 'session':
      return { probe, method: 'GET', path: '/v1/session', requiresAuth: true };
    case 'detect':
      return { probe, method: 'POST', path: '/v1/detect', requiresAuth: true };
    default:
      return { probe: 'health', method: 'GET', path: '/health', requiresAuth: false };
  }
}

async function handleAntigravityProbe(message, sendResponse) {
  const baseUrl = normalizeLoopbackBaseUrl(message?.baseUrl);
  const timeoutMs = Number(message?.timeoutMs) || 3500;
  const token = String(message?.token || '').trim();
  const request = getAntigravityProbeRequest(message);
  const url = `${baseUrl}${request.path}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers = {
    Accept: 'application/json',
  };
  if (request.requiresAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (request.method === 'POST') {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, {
      method: request.method,
      headers,
      body: request.method === 'POST' ? '{}' : undefined,
      signal: controller.signal,
    });

    const text = await response.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }

    const isAntigravity =
      data?.app === 'antigravity-chat-standalone' ||
      (data?.ok === true && typeof data?.bridge === 'object');
    const requiresAuth =
      response.status === 401 || data?.error === 'unauthorized' || false;

    if (!response.ok) {
      sendResponse({
        success: false,
        url,
        baseUrl,
        status: response.status,
        error: data?.error || `HTTP ${response.status}`,
        data,
        isAntigravity,
        requiresAuth,
      });
      return;
    }

    sendResponse({
      success: true,
      url,
      baseUrl,
      status: response.status,
      data,
      isAntigravity,
      requiresAuth,
      probe: request.probe,
    });
  } catch (err) {
    const error = err?.name === 'AbortError' ? 'timeout' : (err?.message || 'unknown error');
    sendResponse({
      success: false,
      url,
      baseUrl,
      error,
      isAntigravity: false,
      requiresAuth: false,
      probe: request.probe,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================
// Capture Tab Helper
// ============================================

async function getCaptureTab(message) {
  let tabs;
  if (message?.windowId) {
    tabs = await chrome.tabs.query({ active: true, windowId: message.windowId });
  }
  if (!tabs || tabs.length === 0) {
    tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  }
  return tabs[0] || null;
}

// 取得頁面內容
async function handleGetPageContent(message, sendResponse) {
  try {
    const tab = await getCaptureTab(message);

    if (!tab) {
      sendResponse({ success: false, error: '找不到使用中的分頁' });
      return;
    }

    const url = tab.url || '';

    // 檢查受限頁面
    if (isRestrictedUrl(url)) {
      sendResponse({
        success: false,
        error: '無法在此頁面擷取內容（瀏覽器內部頁面）',
        pageInfo: { title: tab.title, url: url }
      });
      return;
    }

    // Inject vendor bundle (Defuddle + Turndown) then extract content
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['js/vendor-content-cleaner.js']
      });
    } catch {
      // Vendor injection may fail on some pages; fall back to basic extraction
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractPageContent
    });

    sendResponse({
      success: true,
      content: results[0]?.result || null,
      url: tab.url,
      title: tab.title
    });
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}

// 取得選取文字
async function handleGetSelectedText(message, sendResponse) {
  try {
    const tab = await getCaptureTab(message);

    if (!tab || isRestrictedUrl(tab.url)) {
      sendResponse({ success: false, selectedText: '' });
      return;
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => window.getSelection()?.toString() || ''
    });

    sendResponse({
      success: true,
      selectedText: results[0]?.result || ''
    });
  } catch (err) {
    sendResponse({ success: false, error: err.message, selectedText: '' });
  }
}

// 擷取可見範圍截圖
async function handleCaptureVisibleScreenshot(message, sendResponse) {
  try {
    const tab = await getCaptureTab(message);

    if (!tab || isRestrictedUrl(tab.url)) {
      sendResponse({ success: false, error: '無法在此頁面擷取截圖' });
      return;
    }

    const dataUrl = await captureVisibleTabDataUrl(tab.windowId);
    sendResponse({ success: true, dataUrl });
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}

// 擷取部分截圖（選取區域）
async function handleCapturePartialScreenshot(message, sendResponse) {
  try {
    const tab = await getCaptureTab(message);

    if (!tab || isRestrictedUrl(tab.url)) {
      sendResponse({ success: false, error: '無法在此頁面擷取截圖' });
      return;
    }

    const selectionResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: selectCaptureRegion
    });

    const region = selectionResults?.[0]?.result;
    if (!region) {
      sendResponse({ success: false, error: '已取消擷取' });
      return;
    }

    const dataUrl = await captureVisibleTabDataUrl(tab.windowId);
    const croppedUrl = await cropImageDataUrl(dataUrl, region);
    sendResponse({ success: true, dataUrl: croppedUrl });
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}

// 整頁截圖（scroll-and-stitch）
async function handleCaptureFullPageScreenshot(message, sendResponse) {
  const CAPTURE_DELAY = 350;
  const MAX_STEPS = 50;
  const FIXED_HIDE_CLASS = '__sidepilot_hide_fixed__';

  try {
    const tab = await getCaptureTab(message);

    if (!tab || isRestrictedUrl(tab.url)) {
      sendResponse({ success: false, error: '無法在此頁面擷取整頁截圖' });
      return;
    }

    // 1. Get page dimensions, force instant scroll, and hide fixed/sticky elements
    const dimResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: (hideClass) => {
        const orig = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = 'auto';

        // Inject a style rule to hide position:fixed and position:sticky elements
        const style = document.createElement('style');
        style.id = hideClass;
        style.textContent = `.${hideClass} { visibility: hidden !important; }`;
        document.head.appendChild(style);

        // Find and mark all fixed/sticky elements
        const allEls = document.querySelectorAll('*');
        let hiddenCount = 0;
        for (const el of allEls) {
          const cs = window.getComputedStyle(el);
          if (cs.position === 'fixed' || cs.position === 'sticky') {
            el.classList.add(hideClass);
            hiddenCount++;
          }
        }

        return {
          fullHeight: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
          viewportHeight: window.innerHeight,
          viewportWidth: window.innerWidth,
          scrollY: window.scrollY,
          devicePixelRatio: window.devicePixelRatio || 1,
          origScrollBehavior: orig || '',
          hiddenCount
        };
      },
      args: [FIXED_HIDE_CLASS]
    });

    const dims = dimResults?.[0]?.result;
    if (!dims) {
      sendResponse({ success: false, error: '無法取得頁面尺寸' });
      return;
    }

    const { fullHeight, viewportHeight, scrollY: origScrollY, devicePixelRatio: dpr, origScrollBehavior } = dims;

    if (fullHeight <= viewportHeight) {
      // Page fits in one viewport — restore and capture once
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: (hideClass, scrollBehavior) => {
          try {
            document.querySelectorAll(`.${hideClass}`).forEach(el => el.classList.remove(hideClass));
            document.getElementById(hideClass)?.remove();
          } finally {
            document.documentElement.style.scrollBehavior = scrollBehavior || '';
          }
        },
        args: [FIXED_HIDE_CLASS, origScrollBehavior]
      });
      const dataUrl = await captureVisibleTabDataUrl(tab.windowId);
      sendResponse({ success: true, dataUrl });
      return;
    }

    // 2. Calculate scroll positions — sequential, non-overlapping except last strip
    const maxScrollY = fullHeight - viewportHeight;
    const scrollPositions = [];
    for (let y = 0; y < maxScrollY; y += viewportHeight) {
      scrollPositions.push(y);
    }
    scrollPositions.push(maxScrollY);

    if (scrollPositions.length > MAX_STEPS) {
      scrollPositions.length = MAX_STEPS;
    }

    // 3. Scroll-and-capture loop (fixed/sticky elements are already hidden)
    const captures = [];
    try {
      for (let i = 0; i < scrollPositions.length; i++) {
        const targetY = scrollPositions[i];

        const scrollResults = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: (y) => {
            window.scrollTo({ top: y, behavior: 'instant' });
            return window.scrollY;
          },
          args: [targetY]
        });

        const actualScrollY = scrollResults?.[0]?.result ?? targetY;
        await new Promise(r => setTimeout(r, CAPTURE_DELAY));

        const dataUrl = await captureVisibleTabDataUrl(tab.windowId);
        captures.push({ dataUrl, scrollY: actualScrollY, index: i });
      }
    } finally {
      // 4. Restore: unhide fixed/sticky elements, scroll position, scroll behavior
      // Wrapped in try/catch so a cleanup failure never masks the original capture error.
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: (y, origBehavior, hideClass) => {
            document.querySelectorAll(`.${hideClass}`).forEach(el => el.classList.remove(hideClass));
            document.getElementById(hideClass)?.remove();
            window.scrollTo({ top: y, behavior: 'instant' });
            document.documentElement.style.scrollBehavior = origBehavior;
          },
          args: [origScrollY, dims.origScrollBehavior, FIXED_HIDE_CLASS]
        });
      } catch (restoreErr) {
        console.warn('[SidePilot] Failed to restore page state after full-page capture:', restoreErr);
      }
    }

    // 5. Deduplicate by rounded scrollY, keep order
    const uniqueCaptures = [];
    const seenY = new Set();
    for (const cap of captures) {
      const key = Math.round(cap.scrollY);
      if (!seenY.has(key)) {
        seenY.add(key);
        uniqueCaptures.push(cap);
      }
    }

    uniqueCaptures.sort((a, b) => a.scrollY - b.scrollY);

    // 6. Stitch on OffscreenCanvas
    const canvasW = Math.round(dims.viewportWidth * dpr);
    const canvasH = Math.round(fullHeight * dpr);
    const canvas = new OffscreenCanvas(canvasW, canvasH);
    const ctx = canvas.getContext('2d');

    for (let i = 0; i < uniqueCaptures.length; i++) {
      const resp = await fetch(uniqueCaptures[i].dataUrl);
      const blob = await resp.blob();
      const bitmap = await createImageBitmap(blob);

      const drawY = Math.round(uniqueCaptures[i].scrollY * dpr);
      const nextDrawY = (i < uniqueCaptures.length - 1)
        ? Math.round(uniqueCaptures[i + 1].scrollY * dpr)
        : canvasH;

      const stripH = Math.min(bitmap.height, nextDrawY - drawY);

      if (i === uniqueCaptures.length - 1) {
        // Last strip: align bottom of bitmap to bottom of canvas
        const remaining = canvasH - drawY;
        if (remaining > 0 && remaining < bitmap.height) {
          const srcY = bitmap.height - remaining;
          ctx.drawImage(bitmap, 0, srcY, bitmap.width, remaining, 0, drawY, bitmap.width, remaining);
        } else {
          ctx.drawImage(bitmap, 0, drawY);
        }
      } else if (stripH > 0) {
        ctx.drawImage(bitmap, 0, 0, bitmap.width, stripH, 0, drawY, bitmap.width, stripH);
      }

      bitmap.close();
    }

    const stitchedBlob = await canvas.convertToBlob({ type: 'image/png' });
    const buffer = await stitchedBlob.arrayBuffer();
    const base64 = arrayBufferToBase64(buffer);
    sendResponse({ success: true, dataUrl: `data:image/png;base64,${base64}` });
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}

function captureVisibleTabDataUrl(windowId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.captureVisibleTab(windowId, { format: 'png' }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(dataUrl);
    });
  });
}

async function cropImageDataUrl(dataUrl, region) {
  if (!dataUrl || !region || typeof OffscreenCanvas === 'undefined') {
    return dataUrl;
  }

  const scale = region.devicePixelRatio || 1;
  const sx = Math.max(0, Math.round(region.x * scale));
  const sy = Math.max(0, Math.round(region.y * scale));
  const sw = Math.max(1, Math.round(region.width * scale));
  const sh = Math.max(1, Math.round(region.height * scale));

  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);

  const maxWidth = Math.max(1, Math.min(sw, bitmap.width - sx));
  const maxHeight = Math.max(1, Math.min(sh, bitmap.height - sy));

  const canvas = new OffscreenCanvas(maxWidth, maxHeight);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, sx, sy, maxWidth, maxHeight, 0, 0, maxWidth, maxHeight);

  const croppedBlob = await canvas.convertToBlob({ type: 'image/png' });
  const buffer = await croppedBlob.arrayBuffer();
  const base64 = arrayBufferToBase64(buffer);
  return `data:image/png;base64,${base64}`;
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

// 注入頁面：顯示選取框並回傳選取區域
function selectCaptureRegion() {
  return new Promise(resolve => {
    const existing = document.getElementById('sidepilot-capture-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'sidepilot-capture-overlay';
    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:2147483647',
      'background:rgba(0,0,0,0.35)',
      'cursor:crosshair'
    ].join(';');

    const hint = document.createElement('div');
    hint.textContent = '拖曳選取區域，按 Esc 取消';
    hint.style.cssText = [
      'position:absolute',
      'top:16px',
      'left:16px',
      'padding:6px 10px',
      'background:rgba(13,17,23,0.85)',
      'color:#fff',
      'font-size:12px',
      'border:1px solid rgba(255,255,255,0.2)',
      'border-radius:6px'
    ].join(';');

    const box = document.createElement('div');
    box.style.cssText = [
      'position:absolute',
      'border:2px solid #58a6ff',
      'background:rgba(88,166,255,0.15)',
      'border-radius:4px',
      'display:none'
    ].join(';');

    overlay.appendChild(hint);
    overlay.appendChild(box);
    document.documentElement.appendChild(overlay);

    let startX = 0;
    let startY = 0;
    let isDragging = false;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    function cleanup(result) {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('mousemove', onMouseMove, true);
      window.removeEventListener('mouseup', onMouseUp, true);
      overlay.removeEventListener('mousedown', onMouseDown, true);
      overlay.remove();
      document.body.style.userSelect = previousUserSelect;
      resolve(result);
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        cleanup(null);
      }
    }

    function onMouseDown(event) {
      event.preventDefault();
      isDragging = true;
      startX = event.clientX;
      startY = event.clientY;
      box.style.display = 'block';
      box.style.left = `${startX}px`;
      box.style.top = `${startY}px`;
      box.style.width = '0px';
      box.style.height = '0px';
    }

    function onMouseMove(event) {
      if (!isDragging) return;
      const currentX = event.clientX;
      const currentY = event.clientY;
      const x = Math.min(startX, currentX);
      const y = Math.min(startY, currentY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);
      box.style.left = `${x}px`;
      box.style.top = `${y}px`;
      box.style.width = `${width}px`;
      box.style.height = `${height}px`;
    }

    function onMouseUp(event) {
      if (!isDragging) return;
      isDragging = false;
      const endX = event.clientX;
      const endY = event.clientY;
      const x = Math.min(startX, endX);
      const y = Math.min(startY, endY);
      const width = Math.abs(endX - startX);
      const height = Math.abs(endY - startY);

      if (width < 10 || height < 10) {
        cleanup(null);
        return;
      }

      cleanup({
        x,
        y,
        width,
        height,
        devicePixelRatio: window.devicePixelRatio || 1
      });
    }

    overlay.addEventListener('mousedown', onMouseDown, true);
    window.addEventListener('mousemove', onMouseMove, true);
    window.addEventListener('mouseup', onMouseUp, true);
    window.addEventListener('keydown', onKeyDown, true);
  });
}

// 開啟 Copilot 獨立視窗
async function handleOpenCopilotWindow(sendResponse) {
  try {
    await chrome.windows.create({
      url: COPILOT_URL,
      type: 'popup',
      width: 450,
      height: 700
    });
    sendResponse({ success: true });
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}

async function handleOpenExternalLink(url, sendResponse) {
  try {
    await openUrlInTab(url);
    sendResponse({ success: true });
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}

// 檢查是否為受限 URL
function isRestrictedUrl(url) {
  if (!url) return true;
  const restrictedPrefixes = [
    'chrome://', 'chrome-extension://', 'about:',
    'edge://', 'brave://', 'opera://', 'vivaldi://',
    'file://', 'data:', 'blob:'
  ];
  return restrictedPrefixes.some(prefix => url.startsWith(prefix));
}

// ============================================
// 頁面內容擷取（注入到目標頁面執行）
// ============================================

function extractPageContent() {
  const selectedText = window.getSelection?.()?.toString?.().trim?.() || '';
  const selectionWordCount = selectedText
    ? selectedText.split(/\s+/).filter(Boolean).length
    : 0;
  const content = {
    title: document.title || '',
    url: window.location.href,
    selectedText,
    selectionActive: !!selectedText,
    text: '',
    markdown: '',
    paragraphs: [],
    wordCount: 0,
    charCount: 0,
    headings: [],
    codeBlocks: [],
    meta: {},
    extractor: 'basic'
  };

  if (selectedText) {
    content.text = selectedText.substring(0, 12000);
    content.paragraphs = selectedText
      .split(/\n{2,}/g)
      .map(part => part.trim())
      .filter(Boolean)
      .slice(0, 120);
    content.wordCount = selectionWordCount;
    content.charCount = selectedText.replace(/\s+/g, '').length;
    content.extractor = 'selection';
  }

  try {
    if (selectedText) {
      document.querySelectorAll('meta[name], meta[property]').forEach(meta => {
        const name = meta.getAttribute('name') || meta.getAttribute('property');
        const value = meta.getAttribute('content');
        if (name && value && ['description', 'keywords', 'og:title', 'og:description'].includes(name) && !content.meta[name]) {
          content.meta[name] = value.substring(0, 300);
        }
      });
      return content;
    }

    // Try Defuddle + Turndown for high-quality extraction
    if (typeof __SidePilotVendor !== 'undefined' && __SidePilotVendor.Defuddle) {
      try {
        const Defuddle = __SidePilotVendor.Defuddle;
        const TurndownService = __SidePilotVendor.TurndownService;

        const defuddled = new Defuddle(document).parse();

        content.title = defuddled.title || content.title;
        content.extractor = 'defuddle';

        if (defuddled.author) content.meta.author = defuddled.author;
        if (defuddled.description) content.meta.description = defuddled.description;
        if (defuddled.site) content.meta.site = defuddled.site;
        if (defuddled.published) content.meta.published = defuddled.published;
        if (defuddled.wordCount) content.wordCount = defuddled.wordCount;

        // Convert cleaned HTML to Markdown
        if (defuddled.content && TurndownService) {
          const td = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced',
            bulletListMarker: '-',
          });
          // Skip images to save tokens
          td.addRule('skipImages', {
            filter: 'img',
            replacement: () => ''
          });
          const md = td.turndown(defuddled.content);
          content.markdown = md.substring(0, 15000);
          content.text = md.substring(0, 12000);
        } else if (defuddled.content) {
          // Turndown unavailable — parse in an isolated document and extract plain text only
          const parsedDoc = new DOMParser().parseFromString(String(defuddled.content), 'text/html');
          const plainText = (parsedDoc.body?.textContent || '')
            .replace(/[\t ]+/g, ' ')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
          content.text = plainText.substring(0, 12000);
        }

        content.charCount = content.text ? content.text.replace(/\s+/g, '').length : 0;
        if (!content.wordCount) {
          content.wordCount = content.text ? content.text.split(/\s+/).length : 0;
        }

        // Extract paragraphs from markdown
        if (content.markdown) {
          content.paragraphs = content.markdown.split(/\n{2,}/).filter(p => p.trim().length > 20).slice(0, 120);
        }

        // Extract headings from markdown
        const headingRe = /^(#{1,4})\s+(.+)$/gm;
        let hMatch;
        while ((hMatch = headingRe.exec(content.markdown)) !== null && content.headings.length < 20) {
          content.headings.push({ level: `H${hMatch[1].length}`, text: hMatch[2].trim() });
        }

        // Extract code blocks from markdown
        const codeRe = /```(\w*)\n([\s\S]*?)```/g;
        let cMatch;
        while ((cMatch = codeRe.exec(content.markdown)) !== null && content.codeBlocks.length < 5) {
          if (cMatch[2].trim().length > 10) {
            content.codeBlocks.push({ language: cMatch[1] || 'plaintext', code: cMatch[2].trim() });
          }
        }

        // Fill remaining meta from document
        document.querySelectorAll('meta[name], meta[property]').forEach(meta => {
          const name = meta.getAttribute('name') || meta.getAttribute('property');
          const value = meta.getAttribute('content');
          if (name && value && ['description', 'keywords', 'og:title', 'og:description'].includes(name) && !content.meta[name]) {
            content.meta[name] = value.substring(0, 300);
          }
        });

        return content;
      } catch (defuddleErr) {
        console.warn('[SidePilot] Defuddle extraction failed, falling back:', defuddleErr);
        content.extractor = 'basic-fallback';
      }
    }

    // Fallback: basic extraction (original logic)
    const mainSelectors = [
      'main', 'article', '[role="main"]',
      '.content', '#content', '.main',
      '.post-content', '.article-content', '.entry-content',
      '.markdown-body', '.prose'
    ];

    let mainContent = null;
    for (const selector of mainSelectors) {
      mainContent = document.querySelector(selector);
      if (mainContent) break;
    }
    mainContent = mainContent || document.body;

    const clone = mainContent.cloneNode(true);
    const removeSelectors = [
      'script', 'style', 'nav', 'footer', 'header',
      '.sidebar', '.advertisement', '.ads', 'aside',
      '.promo', '.sponsor', '.banner', '.cookie', '.consent',
      '.newsletter', '.subscribe', '.share', '.social',
      '.nav', '.menu', '.comment', '.comments', '.related',
      '[role="banner"]', '[role="navigation"]', '[role="contentinfo"]',
      '[aria-label*="advert"]', '[aria-label*="ad"]', '[id*="ad-"]', '[class*="ad-"]'
    ];

     removeSelectors.forEach(sel => {
       clone.querySelectorAll(sel).forEach(el => {
         el.remove();
       });
     });

    const noisePattern = /(ad-|ads|advert|promo|sponsor|cookie|consent|subscribe|newsletter|share|social|comment|breadcrumb|related|recommend|popup|modal|banner|toolbar|nav|footer|header)/i;

    clone.querySelectorAll('*').forEach(el => {
      const idClass = `${el.id || ''} ${el.className || ''}`;
      if (noisePattern.test(idClass)) {
        el.remove();
        return;
      }

      const text = el.innerText?.trim() || '';
      const links = el.querySelectorAll?.('a')?.length || 0;
      if (text.length > 0 && text.length < 80 && links >= 4) {
        el.remove();
      }
    });

    const paragraphs = [];
    const seenParagraphs = new Set();
    clone.querySelectorAll('p, li').forEach(el => {
      const text = el.innerText?.trim();
      if (!text || text.length < 30 || text.length > 2000) return;
      if (seenParagraphs.has(text)) return;
      seenParagraphs.add(text);
      paragraphs.push(text);
    });

    const cleanedText = (paragraphs.length > 0 ? paragraphs.join('\n\n') : clone.innerText || '')
      .replace(/[\t ]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    content.text = cleanedText.substring(0, 12000);
    content.paragraphs = paragraphs.slice(0, 120);
    content.wordCount = cleanedText ? cleanedText.split(/\s+/).length : 0;
    content.charCount = cleanedText ? cleanedText.replace(/\s+/g, '').length : 0;

    // 標題結構
    document.querySelectorAll('h1, h2, h3, h4').forEach(h => {
      const text = h.innerText?.trim();
      if (text && text.length > 0 && text.length < 200) {
        content.headings.push({
          level: h.tagName,
          text: text
        });
      }
    });
    content.headings = content.headings.slice(0, 20);

    // 程式碼區塊
    const seenCode = new Set();
    document.querySelectorAll('pre code, pre, .highlight, [class*="language-"]').forEach(code => {
      const text = code.innerText?.trim();
      if (text && text.length > 10 && text.length < 5000 && !seenCode.has(text)) {
        seenCode.add(text);

        const classNames = (code.className || '') + ' ' + (code.parentElement?.className || '');
        const langMatch = classNames.match(/language-(\w+)|lang-(\w+)/);
        const language = langMatch?.[1] || langMatch?.[2] || 'plaintext';

        content.codeBlocks.push({ language, code: text });
      }
    });
    content.codeBlocks = content.codeBlocks.slice(0, 5);

    // Meta 資訊
    document.querySelectorAll('meta[name], meta[property]').forEach(meta => {
      const name = meta.getAttribute('name') || meta.getAttribute('property');
      const value = meta.getAttribute('content');
      if (name && value && ['description', 'keywords', 'author', 'og:title', 'og:description'].includes(name)) {
        content.meta[name] = value.substring(0, 300);
      }
    });

  } catch (e) {
    console.error('Content extraction error:', e);
  }

  return content;
}

// ============================================
// 分頁事件監聽
// ============================================

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    chrome.runtime.sendMessage({
      action: 'tabUpdated',
      tabId,
      url: tab.url,
      title: tab.title
    }).catch(() => {});
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    chrome.runtime.sendMessage({
      action: 'tabActivated',
      tabId: activeInfo.tabId,
      url: tab.url,
      title: tab.title
    }).catch(() => {});
  } catch (e) {
    // 忽略錯誤
  }
});
