'use strict';

// ============================================
// 常數與狀態
// ============================================

const STORAGE_KEY = 'copilot_sidepanel_welcomed';
const STORAGE_KEY_DECLINED = 'copilot_sidepanel_declined';
const STORAGE_KEY_SDK_MODEL = 'sidepilot_sdk_model';
const STORAGE_KEY_SDK_LOGIN_GUIDE_SHOWN = 'sidepilot_sdk_login_guide_shown';
const FRAME_LOAD_TIMEOUT = 15000;
const MEMORY_PROMPT_MAX_ENTRIES = 5;
const MEMORY_PROMPT_MAX_TOTAL_LENGTH = 3600;
const MEMORY_PROMPT_MAX_ENTRY_CONTENT = 700;
const RULES_PROMPT_MAX_LENGTH = 2200;
const SETTINGS_STORAGE_KEY = 'sidepilot.settings.v1';
const SETTINGS_AUTOSAVE_DELAY = 600;
const SDK_LOGIN_URL = 'https://github.com/login?return_to=https%3A%2F%2Fgithub.com%2Fcopilot';
const SDK_BRIDGE_PORT = 31031;
const COPILOT_HOME_URL = 'https://github.com/copilot';
const DEFAULT_CAPTURE_BUTTON_WIDTH = 42;
const BRIDGE_WORKDIR_HINT = 'C:\\Dev\\Projects\\SidePilot\\scripts\\copilot-bridge';
const SDK_SESSION_STATE_PATH_HINT = 'C:\\Users\\miles\\.copilot\\session-state\\';
const DEFAULT_CHAT_SAVE_PATH = 'C:\\Users\\miles\\copilot\\chat-exports\\';
const DEFAULT_SCREENSHOT_SAVE_PATH = 'C:\\Users\\miles\\copilot\\screenshots\\';
const SIDEPILOT_PACKET_SCHEMA = 'sidepilot.turn-packet.v1';
const SIDEPILOT_SANDBOX_SCHEMA = 'sidepilot.sandbox.v1';
const SETTINGS_TOOLTIP_DELAY_MS = 800;
const SIDEPILOT_SANDBOX_SYSTEM_MESSAGE = [
  `You are running inside ${SIDEPILOT_SANDBOX_SCHEMA}.`,
  'For each response, output exactly 2 XML blocks in this order:',
  '1) <sidepilot_packet>{valid JSON object}</sidepilot_packet>',
  '2) <assistant_response>...</assistant_response>',
  'The sidepilot_packet JSON must include:',
  '- schema',
  '- used_memory_ids (array of ids)',
  '- used_rules (boolean)',
  '- decision_summary (short string)',
  '- confidence (number from 0 to 1)',
  'Do not output chain-of-thought or extra sections outside these 2 blocks.',
].join('\n');

const MEMORY_TYPE_WEIGHT = {
  context: 4,
  reference: 3,
  note: 2,
  task: 1
};

const DEFAULT_SETTINGS = {
  autoSDKLoginGuide: true,
  playIntroEveryOpen: false,
  showWarningOverlay: true,
  captureButtonWidth: DEFAULT_CAPTURE_BUTTON_WIDTH,
  sdkIncludeMemory: true,
  sdkIncludeRules: true,
  sdkShowStorageLocation: false,
  sdkSessionStatePath: SDK_SESSION_STATE_PATH_HINT,
  sdkConversationSavePath: DEFAULT_CHAT_SAVE_PATH,
  sdkScreenshotSavePath: DEFAULT_SCREENSHOT_SAVE_PATH,
  sdkConfigSyncRenderMarkdown: false,
  sdkConfigSyncTheme: false,
  sdkConfigSyncBanner: false,
  sdkConfigSyncReasoningEffort: false,
  sdkDisplayTags: {
    assistant: true,
    packet: false,
    raw: false
  },
  linkGuardMode: 'allow',
  linkAllowlist: [
    'https://github.com/copilot/*',
    'https://github.com/settings/copilot*',
    'https://github.com/features/copilot*'
  ]
};

const state = {
  currentPageContent: null,
  currentPageScreenshot: null,
  currentPartialScreenshot: null,
  currentPageError: null,
  isCapturePanelOpen: false,
  frameLoaded: false,
  loadTimeout: null,
  detectedMode: null,
  settings: { ...DEFAULT_SETTINGS },
  sdkConfigInfo: null
};

let settingsAutoSaveTimer = null;
let settingsAutoSaveInFlight = null;
let settingsTooltipTimer = null;
let settingsTooltipEl = null;
let settingsTooltipAnchor = null;

// ============================================
// DOM 元素
// ============================================

const dom = {};

// ============================================
// 初始化
// ============================================

function init() {
  // 取得所有 DOM 元素
  dom.copilotFrame = document.getElementById('copilotFrame');
  dom.loadingOverlay = document.getElementById('loadingOverlay');
  dom.errorOverlay = document.getElementById('errorOverlay');
  dom.errorMessage = document.getElementById('errorMessage');
  dom.floatingCaptureBtn = document.getElementById('floatingCaptureBtn');
  dom.pageInfo = document.getElementById('pageInfo');
  dom.pageTitle = document.getElementById('pageTitle');
  dom.pageUrl = document.getElementById('pageUrl');
  dom.capturePanel = document.getElementById('capturePanel');
  dom.captureContent = document.getElementById('captureContent');
  dom.copyAllBtn = document.getElementById('copyAllBtn');
  dom.closeCaptureBtn = document.getElementById('closeCaptureBtn');
  dom.retryBtn = document.getElementById('retryBtn');
  dom.openWindowBtn = document.getElementById('openWindowBtn');
  dom.toast = document.getElementById('toast');
  dom.welcomeOverlay = document.getElementById('welcomeOverlay');
  dom.welcomeCloseBtn = document.getElementById('welcomeCloseBtn');
  dom.welcomeDeclineBtn = document.getElementById('welcomeDeclineBtn');
  dom.welcomeSuppressCheckbox = document.getElementById('welcomeSuppressCheckbox');

  // Intro Video
  dom.introContainer = document.getElementById('introContainer');
  dom.introVideo = document.getElementById('introVideo');
  dom.skipIntroBtn = document.getElementById('skipIntroBtn');
  dom.homeBtn = document.getElementById('homeBtn');

  // Tab navigation
  dom.tabBar = document.querySelector('.tab-bar');
  dom.tabs = document.querySelectorAll('.tab');
  dom.tabContents = document.querySelectorAll('.tab-content');
  dom.modeSwitch = document.getElementById('modeSwitch');
  dom.modeSwitchBtns = document.querySelectorAll('.mode-switch-btn');

  // SDK Chat elements
  dom.sdkChat = document.getElementById('sdkChat');
  dom.sdkMessages = document.getElementById('sdkMessages');
  dom.sdkInput = document.getElementById('sdkInput');
  dom.sdkSendBtn = document.getElementById('sdkSendBtn');
  dom.settingSdkIncludeMemory = document.getElementById('settingSdkIncludeMemory');
  dom.sdkMemorySummary = document.getElementById('sdkMemorySummary');
  dom.sdkModelSelect = document.getElementById('sdkModelSelect');
  dom.sdkStorageLocation = document.getElementById('sdkStorageLocation');
  dom.sdkStorageLink = document.getElementById('sdkStorageLink');

  if (dom.sdkModelSelect) {
    const selectedModel = localStorage.getItem(STORAGE_KEY_SDK_MODEL) || '';
    dom.sdkModelSelect.value = selectedModel;
  }

  // Rules tab
  dom.rulesEditor = document.getElementById('rulesEditor');
  dom.saveRulesBtn = document.getElementById('saveRulesBtn');
  dom.exportRulesBtn = document.getElementById('exportRulesBtn');
  dom.importRulesBtn = document.getElementById('importRulesBtn');
  dom.rulesFileInput = document.getElementById('rulesFileInput');
  dom.templateSelect = document.getElementById('templateSelect');
  dom.rulesStatus = document.getElementById('rulesStatus');

  // Memory tab
  dom.memoryList = document.getElementById('memoryList');
  dom.memorySearch = document.getElementById('memorySearch');
  dom.memoryFilter = document.getElementById('memoryFilter');
  dom.addMemoryBtn = document.getElementById('addMemoryBtn');
  dom.memoryModal = document.getElementById('memoryModal');
  dom.closeMemoryModal = document.getElementById('closeMemoryModal');
  dom.saveMemoryBtn = document.getElementById('saveMemoryBtn');
  dom.cancelMemoryBtn = document.getElementById('cancelMemoryBtn');
  dom.entryType = document.getElementById('entryType');
  dom.entryTitle = document.getElementById('entryTitle');
  dom.entryContent = document.getElementById('entryContent');
  dom.entryStatus = document.getElementById('entryStatus');
  dom.memoryModalTitle = document.getElementById('memoryModalTitle');
  dom.sendToVSCodeBtn = document.getElementById('sendToVSCodeBtn');

  // Settings tab
  dom.saveSettingsBtn = document.getElementById('saveSettingsBtn');
  dom.settingsStatus = document.getElementById('settingsStatus');
  dom.settingAutoSdkLogin = document.getElementById('settingAutoSdkLogin');
  dom.settingPlayIntroEveryOpen = document.getElementById('settingPlayIntroEveryOpen');
  dom.settingShowWarningOverlay = document.getElementById('settingShowWarningOverlay');
  dom.settingCaptureButtonWidth = document.getElementById('settingCaptureButtonWidth');
  dom.settingLinkAllowlist = document.getElementById('settingLinkAllowlist');
  dom.captureBtnWidthValue = document.getElementById('captureBtnWidthValue');
  dom.settingLinkGuardMode = document.getElementById('settingLinkGuardMode');
  dom.linkAllowlistTitle = document.getElementById('linkAllowlistTitle');
  dom.linkAllowlistDesc = document.getElementById('linkAllowlistDesc');
  dom.openSdkLoginGuideBtn = document.getElementById('openSdkLoginGuideBtn');
  dom.testSdkBridgeBtn = document.getElementById('testSdkBridgeBtn');
  dom.settingSdkTagAssistant = document.getElementById('settingSdkTagAssistant');
  dom.settingSdkTagPacket = document.getElementById('settingSdkTagPacket');
  dom.settingSdkTagRaw = document.getElementById('settingSdkTagRaw');
  dom.settingSdkIncludeRules = document.getElementById('settingSdkIncludeRules');
  dom.settingSdkShowStorageLocation = document.getElementById('settingSdkShowStorageLocation');
  dom.settingSdkSessionPath = document.getElementById('settingSdkSessionPath');
  dom.settingSdkConversationSavePath = document.getElementById('settingSdkConversationSavePath');
  dom.settingSdkScreenshotSavePath = document.getElementById('settingSdkScreenshotSavePath');
  dom.settingSdkSyncRenderMarkdown = document.getElementById('settingSdkSyncRenderMarkdown');
  dom.settingSdkSyncTheme = document.getElementById('settingSdkSyncTheme');
  dom.settingSdkSyncBanner = document.getElementById('settingSdkSyncBanner');
  dom.settingSdkSyncReasoningEffort = document.getElementById('settingSdkSyncReasoningEffort');
  dom.settingSdkRenderMarkdown = document.getElementById('settingSdkRenderMarkdown');
  dom.settingSdkTheme = document.getElementById('settingSdkTheme');
  dom.settingSdkBanner = document.getElementById('settingSdkBanner');
  dom.settingSdkReasoningEffort = document.getElementById('settingSdkReasoningEffort');
  dom.sdkConfigPath = document.getElementById('sdkConfigPath');
  dom.sdkConfigSummary = document.getElementById('sdkConfigSummary');
  dom.bridgeInstallStatus = document.getElementById('bridgeInstallStatus');
  dom.bridgeInstallDetail = document.getElementById('bridgeInstallDetail');
  dom.bridgeCheckBtn = document.getElementById('bridgeCheckBtn');
  dom.bridgeCopyCmdBtn = document.getElementById('bridgeCopyCmdBtn');
  dom.bridgeCopyCheckBtn = document.getElementById('bridgeCopyCheckBtn');
  dom.bridgeStatusDot = document.getElementById('bridgeStatusDot');

  // SDK login guide modal
  dom.sdkLoginModal = document.getElementById('sdkLoginModal');
  dom.closeSdkLoginModal = document.getElementById('closeSdkLoginModal');
  dom.sdkLoginLaterBtn = document.getElementById('sdkLoginLaterBtn');
  dom.sdkLoginNowBtn = document.getElementById('sdkLoginNowBtn');
  dom.sdkLoginSuppressCheckbox = document.getElementById('sdkLoginSuppressCheckbox');

  // 驗證必要元素
  const required = ['copilotFrame', 'loadingOverlay', 'capturePanel', 'toast'];
  for (const key of required) {
    if (!dom[key]) {
      console.error(`Missing required element: ${key}`);
      return;
    }
  }

  setupSettingsSections();
  setupSettingsTooltips();
  setupEventListeners();
  setBridgeInstallDefaultHint();
  setupFrameLoadDetection();
  loadCurrentPageInfo();

  loadSettings()
    .catch((err) => {
      console.warn('[SidePilot] Failed to load settings, using defaults:', err?.message || err);
      applySettingsToUI();
      applyCaptureButtonWidth(state.settings.captureButtonWidth);
      updateSettingsStatus('使用預設設定', 'warning');
    })
    .finally(() => {
      checkIntroVideo();
    });

  // Detect mode on startup (non-blocking)
  detectModeOnStartup();
}

// ============================================
// Mode Detection
// ============================================

async function detectModeOnStartup() {
  try {
    const stored = await chrome.runtime.sendMessage({ action: 'getMode' });
    if (stored?.success && (stored.mode === 'sdk' || stored.mode === 'iframe')) {
      state.detectedMode = stored.mode;
      console.log('[SidePilot] Loaded mode:', stored.mode);
    } else {
      const detected = await chrome.runtime.sendMessage({ action: 'detectMode' });
      if (detected?.success) {
        state.detectedMode = detected.mode;
        console.log('[SidePilot] Detected mode:', detected.mode);
      } else {
        state.detectedMode = 'iframe';
        console.warn('[SidePilot] Mode detection failed, defaulting to iframe');
      }
    }
    updateModeBadge();

    if (state.detectedMode === 'sdk') {
      const bridgeReady = await ensureSDKBridgeConnection({ port: SDK_BRIDGE_PORT });
      if (bridgeReady) {
        await loadSDKModelOptions();
      }
    }
  } catch (err) {
    state.detectedMode = 'iframe';
    console.warn('[SidePilot] Mode detection error, defaulting to iframe:', err.message);
    updateModeBadge();
  }
}

function updateModeBadge() {
  const mode = state.detectedMode || 'iframe';
  document.body.classList.toggle('is-sdk-mode', mode === 'sdk');
  document.body.classList.toggle('is-iframe-mode', mode !== 'sdk');

  dom.modeSwitchBtns?.forEach(btn => {
    const isActive = btn.dataset.mode === mode;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
  
  // Switch UI mode
  if (mode === 'sdk') {
    dom.copilotFrame?.classList.add('hidden');
    dom.sdkChat?.classList.remove('hidden');
  } else {
    dom.copilotFrame?.classList.remove('hidden');
    dom.sdkChat?.classList.add('hidden');
  }

  syncCapturePanelMode();
  updateSDKStorageLocationDisplay();
}

// ============================================
// Tab Navigation
// ============================================

function switchTab(tabId) {
  // Update tab buttons
  dom.tabs.forEach(tab => {
    if (tab.dataset.tab === tabId) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // Update tab content
  dom.tabContents.forEach(content => {
    if (content.id === `${tabId}-tab`) {
      content.classList.add('active');
    } else {
      content.classList.remove('active');
    }
  });

  // Load content if needed
  if (tabId === 'rules') {
    loadRules();
    loadTemplates();
  } else if (tabId === 'memory') {
    loadMemoryEntries();
  } else if (tabId === 'settings') {
    loadSettings().catch((err) => {
      console.warn('[SidePilot] Failed to reload settings:', err?.message || err);
      applySettingsToUI();
    });
    loadSDKConfigAndApplyUI();
  }
}

// ============================================
// Settings Management
// ============================================

function normalizeSettings(raw = {}) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const captureWidth = clampCaptureButtonWidth(source.captureButtonWidth);
  const sdkIncludeMemory = source.sdkIncludeMemory !== false;
  const sdkIncludeRules = source.sdkIncludeRules !== false;
  const sdkShowStorageLocation = source.sdkShowStorageLocation === true;
  const sdkSessionStatePath = normalizeSessionStatePath(source.sdkSessionStatePath);
  const sdkConversationSavePath = normalizeSavePath(source.sdkConversationSavePath, DEFAULT_CHAT_SAVE_PATH);
  const sdkScreenshotSavePath = normalizeSavePath(source.sdkScreenshotSavePath, DEFAULT_SCREENSHOT_SAVE_PATH);
  const sdkConfigSyncRenderMarkdown = source.sdkConfigSyncRenderMarkdown === true;
  const sdkConfigSyncTheme = source.sdkConfigSyncTheme === true;
  const sdkConfigSyncBanner = source.sdkConfigSyncBanner === true;
  const sdkConfigSyncReasoningEffort = source.sdkConfigSyncReasoningEffort === true;
  const sdkDisplayTags = normalizeSdkDisplayTags(source.sdkDisplayTags);
  const linkGuardMode = source.linkGuardMode === 'deny' ? 'deny' : 'allow';
  const linkAllowlist = normalizeLinkAllowlist(source.linkAllowlist, linkGuardMode);

  return {
    autoSDKLoginGuide: source.autoSDKLoginGuide !== false,
    playIntroEveryOpen: source.playIntroEveryOpen === true,
    showWarningOverlay: source.showWarningOverlay !== false,
    captureButtonWidth: captureWidth,
    sdkIncludeMemory,
    sdkIncludeRules,
    sdkShowStorageLocation,
    sdkSessionStatePath,
    sdkConversationSavePath,
    sdkScreenshotSavePath,
    sdkConfigSyncRenderMarkdown,
    sdkConfigSyncTheme,
    sdkConfigSyncBanner,
    sdkConfigSyncReasoningEffort,
    sdkDisplayTags,
    linkGuardMode,
    linkAllowlist
  };
}

function clampCaptureButtonWidth(value) {
  if (value === '' || value === null || value === undefined) {
    return DEFAULT_CAPTURE_BUTTON_WIDTH;
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return DEFAULT_CAPTURE_BUTTON_WIDTH;
  }
  return Math.min(128, Math.max(1, Math.round(number)));
}

function normalizeLinkAllowlist(value, mode = 'allow') {
  const sourceList = Array.isArray(value)
    ? value
    : (typeof value === 'string' ? value.split('\n') : []);
  const normalized = [];
  const seen = new Set();

  for (const item of sourceList) {
    const trimmed = String(item || '').trim();
    if (!trimmed) continue;
    if (!/^https?:\/\//i.test(trimmed)) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    normalized.push(trimmed);
  }

  if (normalized.length > 0) return normalized;
  return mode === 'deny' ? [] : [...DEFAULT_SETTINGS.linkAllowlist];
}

function formatAllowlistForTextarea(list, mode) {
  const normalized = normalizeLinkAllowlist(list, mode);
  return normalized.join('\n');
}

function normalizeSdkDisplayTags(value) {
  const source = value && typeof value === 'object' ? value : {};
  const assistant = source.assistant !== false;
  const packet = source.packet === true;
  const raw = source.raw === true;

  if (!assistant && !packet && !raw) {
    return { assistant: true, packet: false, raw: false };
  }

  return { assistant, packet, raw };
}

function isAssistantOnlyTags(tags) {
  const normalized = normalizeSdkDisplayTags(tags);
  return normalized.assistant && !normalized.packet && !normalized.raw;
}

function normalizeSessionStatePath(value) {
  const trimmed = String(value || '').trim();
  return trimmed || SDK_SESSION_STATE_PATH_HINT;
}

function normalizeSavePath(value, fallback) {
  const trimmed = String(value || '').trim();
  return trimmed || fallback;
}

async function loadSettings() {
  const result = await chrome.storage.local.get(SETTINGS_STORAGE_KEY);
  state.settings = normalizeSettings(result?.[SETTINGS_STORAGE_KEY]);
  applySettingsToUI();
  applyCaptureButtonWidth(state.settings.captureButtonWidth);
  updateSettingsStatus('設定已載入', 'success');
  return state.settings;
}

async function persistSettings(settings, options = {}) {
  const normalized = normalizeSettings(settings);
  await chrome.storage.local.set({ [SETTINGS_STORAGE_KEY]: normalized });
  state.settings = normalized;

  if (normalized.playIntroEveryOpen) {
    localStorage.removeItem('intro_played');
  }

  if (normalized.showWarningOverlay) {
    localStorage.removeItem('copilot_warning_suppressed');
  } else {
    localStorage.setItem('copilot_warning_suppressed', 'true');
  }

  applySettingsToUI();
  applyCaptureButtonWidth(state.settings.captureButtonWidth);

  if (options.showToast) {
    showToast('設定已儲存');
  }

  const statusText = options.statusText || '設定已儲存';
  updateSettingsStatus(statusText, 'success');
  return normalized;
}

function applySettingsToUI() {
  const settings = normalizeSettings(state.settings);
  state.settings = settings;

  if (dom.settingAutoSdkLogin) {
    dom.settingAutoSdkLogin.checked = settings.autoSDKLoginGuide;
  }
  if (dom.settingPlayIntroEveryOpen) {
    dom.settingPlayIntroEveryOpen.checked = settings.playIntroEveryOpen;
  }
  if (dom.settingShowWarningOverlay) {
    dom.settingShowWarningOverlay.checked = settings.showWarningOverlay;
  }
  if (dom.settingCaptureButtonWidth) {
    dom.settingCaptureButtonWidth.value = String(settings.captureButtonWidth);
  }
  if (dom.settingSdkIncludeMemory) {
    dom.settingSdkIncludeMemory.checked = settings.sdkIncludeMemory !== false;
  }
  if (dom.settingSdkIncludeRules) {
    dom.settingSdkIncludeRules.checked = settings.sdkIncludeRules !== false;
  }
  if (dom.settingSdkShowStorageLocation) {
    dom.settingSdkShowStorageLocation.checked = settings.sdkShowStorageLocation === true;
  }
  if (dom.settingSdkSessionPath) {
    dom.settingSdkSessionPath.value = settings.sdkSessionStatePath || SDK_SESSION_STATE_PATH_HINT;
  }
  if (dom.settingSdkConversationSavePath) {
    dom.settingSdkConversationSavePath.value = settings.sdkConversationSavePath || DEFAULT_CHAT_SAVE_PATH;
  }
  if (dom.settingSdkScreenshotSavePath) {
    dom.settingSdkScreenshotSavePath.value = settings.sdkScreenshotSavePath || DEFAULT_SCREENSHOT_SAVE_PATH;
  }
  if (dom.settingSdkSyncRenderMarkdown) {
    dom.settingSdkSyncRenderMarkdown.checked = settings.sdkConfigSyncRenderMarkdown === true;
  }
  if (dom.settingSdkSyncTheme) {
    dom.settingSdkSyncTheme.checked = settings.sdkConfigSyncTheme === true;
  }
  if (dom.settingSdkSyncBanner) {
    dom.settingSdkSyncBanner.checked = settings.sdkConfigSyncBanner === true;
  }
  if (dom.settingSdkSyncReasoningEffort) {
    dom.settingSdkSyncReasoningEffort.checked = settings.sdkConfigSyncReasoningEffort === true;
  }
  if (dom.settingSdkTagAssistant) {
    dom.settingSdkTagAssistant.checked = settings.sdkDisplayTags.assistant !== false;
  }
  if (dom.settingSdkTagPacket) {
    dom.settingSdkTagPacket.checked = settings.sdkDisplayTags.packet === true;
  }
  if (dom.settingSdkTagRaw) {
    dom.settingSdkTagRaw.checked = settings.sdkDisplayTags.raw === true;
  }
  if (dom.settingLinkGuardMode) {
    dom.settingLinkGuardMode.value = settings.linkGuardMode || 'allow';
  }
  if (dom.settingLinkAllowlist) {
    dom.settingLinkAllowlist.value = formatAllowlistForTextarea(settings.linkAllowlist, settings.linkGuardMode);
  }
  updateLinkGuardLabels(settings.linkGuardMode);
  updateCaptureWidthLabel(settings.captureButtonWidth);
  refreshSDKMemorySummary();
  applySDKAssistantOnlyMode();
  updateSDKStorageLocationDisplay();
  applySDKConfigToUI();
}

function collectSettingsFromUI() {
  const rawWidth = dom.settingCaptureButtonWidth?.value;
  const captureWidth = rawWidth === '' || rawWidth === null || rawWidth === undefined
    ? state.settings.captureButtonWidth
    : rawWidth;

  return normalizeSettings({
    autoSDKLoginGuide: !!dom.settingAutoSdkLogin?.checked,
    playIntroEveryOpen: !!dom.settingPlayIntroEveryOpen?.checked,
    showWarningOverlay: !!dom.settingShowWarningOverlay?.checked,
    captureButtonWidth: captureWidth,
    sdkIncludeMemory: !!dom.settingSdkIncludeMemory?.checked,
    sdkIncludeRules: !!dom.settingSdkIncludeRules?.checked,
    sdkShowStorageLocation: !!dom.settingSdkShowStorageLocation?.checked,
    sdkSessionStatePath: dom.settingSdkSessionPath?.value,
    sdkConversationSavePath: dom.settingSdkConversationSavePath?.value,
    sdkScreenshotSavePath: dom.settingSdkScreenshotSavePath?.value,
    sdkConfigSyncRenderMarkdown: !!dom.settingSdkSyncRenderMarkdown?.checked,
    sdkConfigSyncTheme: !!dom.settingSdkSyncTheme?.checked,
    sdkConfigSyncBanner: !!dom.settingSdkSyncBanner?.checked,
    sdkConfigSyncReasoningEffort: !!dom.settingSdkSyncReasoningEffort?.checked,
    sdkDisplayTags: {
      assistant: !!dom.settingSdkTagAssistant?.checked,
      packet: !!dom.settingSdkTagPacket?.checked,
      raw: !!dom.settingSdkTagRaw?.checked
    },
    linkGuardMode: dom.settingLinkGuardMode?.value,
    linkAllowlist: dom.settingLinkAllowlist?.value
  });
}

function updateCaptureWidthLabel(width) {
  if (!dom.captureBtnWidthValue) return;
  const normalized = clampCaptureButtonWidth(width);
  dom.captureBtnWidthValue.textContent = `${normalized}px`;
}

function applyCaptureButtonWidth(width) {
  const normalized = clampCaptureButtonWidth(width);
  if (normalized <= 15) {
    dom.floatingCaptureBtn?.classList.add('capture-compact');
  } else {
    dom.floatingCaptureBtn?.classList.remove('capture-compact');
  }
  document.documentElement.style.setProperty('--capture-button-width', `${normalized}px`);
  document.documentElement.style.setProperty('--capture-idle-opacity', `${computeCaptureIdleOpacity(normalized)}`);
}

function computeCaptureIdleOpacity(width) {
  const normalized = Math.max(1, Math.round(width));
  if (normalized === 1) return 1;
  if (normalized > 15) return 0.5;
  const span = 14;
  const ratio = (normalized - 1) / span;
  const opacity = 1 - ratio * 0.5;
  return Math.max(0.5, Math.min(1, Number(opacity.toFixed(2))));
}

async function saveSettings() {
  const nextSettings = collectSettingsFromUI();
  await persistSettings(nextSettings, { showToast: true });
}

function queueSettingsAutoSave(options = {}) {
  const { immediate = false, showToast = false } = options;

  if (settingsAutoSaveTimer) {
    clearTimeout(settingsAutoSaveTimer);
    settingsAutoSaveTimer = null;
  }

  if (immediate) {
    void runSettingsAutoSave({ showToast });
    return;
  }

  settingsAutoSaveTimer = setTimeout(() => {
    settingsAutoSaveTimer = null;
    void runSettingsAutoSave({ showToast });
  }, SETTINGS_AUTOSAVE_DELAY);
}

async function runSettingsAutoSave(options = {}) {
  if (settingsAutoSaveInFlight) return settingsAutoSaveInFlight;

  const { showToast = false } = options;
  const nextSettings = collectSettingsFromUI();

  settingsAutoSaveInFlight = persistSettings(nextSettings, {
    showToast,
    statusText: '已自動儲存'
  })
    .catch((err) => {
      console.error('[SidePilot] Auto-save settings failed:', err);
      updateSettingsStatus('自動儲存失敗', 'error');
    })
    .finally(() => {
      settingsAutoSaveInFlight = null;
    });

  return settingsAutoSaveInFlight;
}

function updateSettingsStatus(text, type = 'info') {
  if (!dom.settingsStatus) return;
  dom.settingsStatus.textContent = text;
  dom.settingsStatus.className = `settings-status ${type}`;
}

function setSettingsSectionExpanded(section, expanded, options = {}) {
  if (!section) return;
  const header = section.querySelector('.settings-section-header');
  const toggle = section.querySelector('.settings-section-toggle');
  const willExpand = !!expanded;
  section.classList.toggle('collapsed', !willExpand);
  if (header) {
    header.setAttribute('aria-expanded', String(willExpand));
  }
  if (toggle) {
    toggle.textContent = willExpand ? '–' : '+';
  }

  if (willExpand && options.scrollIntoView) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function setupSettingsSections() {
  const sections = document.querySelectorAll('.settings-section.collapsible');
  sections.forEach((section) => {
    const header = section.querySelector('.settings-section-header');
    if (!header) return;
    const isCollapsed = section.classList.contains('collapsed');
    setSettingsSectionExpanded(section, !isCollapsed);
    header.addEventListener('click', () => {
      const isCollapsed = section.classList.contains('collapsed');
      setSettingsSectionExpanded(section, isCollapsed);
    });
    header.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const isCollapsed = section.classList.contains('collapsed');
        setSettingsSectionExpanded(section, isCollapsed);
      }
    });
  });

  const tocLinks = document.querySelectorAll('.settings-toc-link');
  tocLinks.forEach((link) => {
    link.addEventListener('click', () => {
      const target = link.dataset.target;
      if (!target) return;
      const section = document.querySelector(`.settings-section.collapsible[data-section="${target}"]`);
      if (!section) return;
      setSettingsSectionExpanded(section, true, { scrollIntoView: true });
    });
  });
}

function ensureSettingsTooltip() {
  if (settingsTooltipEl) return settingsTooltipEl;
  const tooltip = document.createElement('div');
  tooltip.className = 'settings-tooltip';
  tooltip.id = 'settingsTooltip';
  document.body.appendChild(tooltip);
  settingsTooltipEl = tooltip;
  return settingsTooltipEl;
}

function getSettingsTooltipText(target) {
  if (!target) return '';
  const explicit = target.closest?.('[data-help]');
  if (explicit?.dataset?.help) {
    const text = explicit.dataset.help.trim();
    if (text) return text;
  }

  const item = target.closest?.('.settings-item');
  if (item) {
    const desc = item.querySelector('.settings-item-desc');
    if (desc?.textContent?.trim()) {
      return desc.textContent.trim();
    }
    const title = item.querySelector('.settings-item-title');
    if (title?.textContent?.trim()) {
      return title.textContent.trim();
    }
  }

  return '';
}

function positionSettingsTooltip(anchor) {
  if (!settingsTooltipEl || !anchor) return;
  const rect = anchor.getBoundingClientRect();
  const tooltipRect = settingsTooltipEl.getBoundingClientRect();
  const padding = 8;
  const spacing = 8;
  let top = rect.bottom + spacing;

  if (top + tooltipRect.height > window.innerHeight - padding) {
    top = rect.top - tooltipRect.height - spacing;
  }
  if (top < padding) {
    top = padding;
  }

  let left = rect.left;
  if (left + tooltipRect.width > window.innerWidth - padding) {
    left = window.innerWidth - tooltipRect.width - padding;
  }
  if (left < padding) {
    left = padding;
  }

  settingsTooltipEl.style.top = `${Math.round(top)}px`;
  settingsTooltipEl.style.left = `${Math.round(left)}px`;
}

function showSettingsTooltip(anchor, text) {
  if (!text) return;
  const tooltip = ensureSettingsTooltip();
  tooltip.textContent = text;
  tooltip.classList.add('visible');
  positionSettingsTooltip(anchor);
}

function hideSettingsTooltip() {
  if (!settingsTooltipEl) return;
  settingsTooltipEl.classList.remove('visible');
}

function clearSettingsTooltipTimer() {
  if (settingsTooltipTimer) {
    clearTimeout(settingsTooltipTimer);
    settingsTooltipTimer = null;
  }
}

function setupSettingsTooltips() {
  const container = document.getElementById('settings-tab');
  if (!container) return;

  const handleMouseOver = (event) => {
    const target = event.target;
    const anchor = target.closest?.('.settings-item, [data-help]');
    if (!anchor || !container.contains(anchor)) return;
    const helpText = getSettingsTooltipText(target);
    if (!helpText) return;

    if (settingsTooltipAnchor === anchor) return;
    settingsTooltipAnchor = anchor;
    clearSettingsTooltipTimer();
    hideSettingsTooltip();
    settingsTooltipTimer = setTimeout(() => {
      showSettingsTooltip(anchor, helpText);
    }, SETTINGS_TOOLTIP_DELAY_MS);
  };

  const handleMouseOut = (event) => {
    if (!settingsTooltipAnchor) return;
    const related = event.relatedTarget;
    if (related && settingsTooltipAnchor.contains(related)) return;
    clearSettingsTooltipTimer();
    hideSettingsTooltip();
    settingsTooltipAnchor = null;
  };

  container.addEventListener('mouseover', handleMouseOver, true);
  container.addEventListener('mouseout', handleMouseOut, true);
  container.addEventListener('mousedown', hideSettingsTooltip, true);
  document.addEventListener('scroll', hideSettingsTooltip, true);
  window.addEventListener('resize', () => {
    if (settingsTooltipAnchor && settingsTooltipEl?.classList.contains('visible')) {
      positionSettingsTooltip(settingsTooltipAnchor);
    }
  });
}

function updateLinkGuardLabels(mode) {
  const resolved = mode === 'deny' ? 'deny' : 'allow';
  if (dom.linkAllowlistTitle) {
    dom.linkAllowlistTitle.textContent = resolved === 'deny'
      ? '禁止留在 Sidecar 的連結前綴'
      : '允許留在 Sidecar 的連結前綴';
  }
  if (dom.linkAllowlistDesc) {
    dom.linkAllowlistDesc.textContent = resolved === 'deny'
      ? '符合以下前綴的連結會改用新分頁開啟'
      : '每行一個 URL 前綴，支援結尾萬用字元 *';
  }
}

function getBridgeHealthUrl(port = SDK_BRIDGE_PORT) {
  return `http://localhost:${port}/health`;
}

function buildBridgeStartCommands() {
  const lines = [
    `cd /d "${BRIDGE_WORKDIR_HINT}"`,
    'npm install',
    'npm run dev'
  ];
  return lines.join('\n');
}

function buildBridgeCheckCommand(port = SDK_BRIDGE_PORT) {
  const url = getBridgeHealthUrl(port);
  return `powershell -Command "Invoke-RestMethod ${url}"`;
}

function setBridgeInstallStatus(statusText, detailText, type = 'info') {
  if (!dom.bridgeInstallStatus) return;
  dom.bridgeInstallStatus.textContent = statusText;
  dom.bridgeInstallStatus.dataset.status = type;
  if (dom.bridgeStatusDot) {
    dom.bridgeStatusDot.dataset.status = type;
  }

  if (dom.bridgeInstallDetail) {
    dom.bridgeInstallDetail.textContent = detailText || '-';
  }
}

function setBridgeInstallDefaultHint() {
  if (!dom.bridgeInstallStatus || !dom.bridgeInstallDetail) return;
  if (!dom.bridgeInstallStatus.textContent || dom.bridgeInstallStatus.textContent === '尚未檢查') {
    dom.bridgeInstallDetail.textContent = `啟動目錄: ${BRIDGE_WORKDIR_HINT}`;
  }
}

async function checkBridgeHealth(options = {}) {
  const port = SDK_BRIDGE_PORT;
  const url = getBridgeHealthUrl(port);
  const toastEnabled = options.showToast !== false;

  setBridgeInstallStatus('檢查中...', url, 'warning');

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'bridgeHealth',
      port,
      timeoutMs: 3000
    });

    if (response?.success) {
      if (response?.isBridge) {
        const sdkStateValue = response?.data?.sdk || '';
        const sdkState = sdkStateValue ? `sdk: ${sdkStateValue}` : '';
        const backendType = response?.data?.backend?.type ? `backend: ${response.data.backend.type}` : '';
        const detail = [url, sdkState, backendType].filter(Boolean).join(' | ');
        const statusType = sdkStateValue && sdkStateValue !== 'ready' ? 'warning' : 'success';
        setBridgeInstallStatus('Bridge 已連線', detail, statusType);
        if (toastEnabled) {
          showToast(statusType === 'success' ? 'Bridge 已連線' : 'Bridge 已連線但狀態異常', statusType === 'success' ? 'success' : 'warning');
        }

        const connected = await ensureSDKBridgeConnection({ port });
        if (connected) {
          await loadSDKModelOptions();
        }
        return;
      }

      const serviceName = response?.data?.service || 'unknown';
      setBridgeInstallStatus('不是 SidePilot Bridge', `service: ${serviceName}`, 'warning');
      if (toastEnabled) showToast('埠口不是 SidePilot Bridge', 'warning');
      return;
    }

    const statusCode = response?.status;
    if (statusCode === 404) {
      setBridgeInstallStatus(
        'Bridge 未啟動或版本不符',
        `HTTP 404，啟動目錄: ${BRIDGE_WORKDIR_HINT}`,
        'warning'
      );
      if (toastEnabled) showToast('Bridge 回應 404，請確認啟動目錄', 'warning');
      return;
    }

    const errMessage = response?.error || '連線失敗';
    setBridgeInstallStatus(
      '無法連線',
      `${errMessage}，啟動目錄: ${BRIDGE_WORKDIR_HINT}`,
      'error'
    );
    if (toastEnabled) showToast('Bridge 無法連線', 'error');
  } catch (err) {
    setBridgeInstallStatus(
      '檢查失敗',
      `${err?.message || 'unknown error'}，啟動目錄: ${BRIDGE_WORKDIR_HINT}`,
      'error'
    );
    if (toastEnabled) showToast('Bridge 檢查失敗', 'error');
  }
}

function markSettingsDirty() {
  updateSettingsStatus('變更已記錄，稍後自動儲存', 'warning');
  queueSettingsAutoSave();
}

async function goCopilotHome() {
  if (state.detectedMode !== 'iframe') {
    await setModeFromUI('iframe');
  }

  if (dom.copilotFrame) {
    dom.copilotFrame.src = COPILOT_HOME_URL;
    showToast('已回到 Copilot 首頁');
  }
}

function showSDKLoginGuide() {
  if (!dom.sdkLoginModal) return;
  if (dom.sdkLoginSuppressCheckbox) {
    dom.sdkLoginSuppressCheckbox.checked = !state.settings.autoSDKLoginGuide;
  }
  dom.sdkLoginModal.classList.remove('hidden');
}

function closeSDKLoginGuide() {
  dom.sdkLoginModal?.classList.add('hidden');
}

async function syncSDKGuideSettingFromModal() {
  const shouldSuppress = !!dom.sdkLoginSuppressCheckbox?.checked;
  const nextAutoGuide = !shouldSuppress;
  if (nextAutoGuide === state.settings.autoSDKLoginGuide) return;

  const nextSettings = {
    ...state.settings,
    autoSDKLoginGuide: nextAutoGuide
  };
  await persistSettings(nextSettings, {
    statusText: 'SDK 登入引導設定已更新'
  });
}

function maybeShowSDKLoginGuideOnFirstUse() {
  const enabled = state.settings.autoSDKLoginGuide !== false;
  if (!enabled) return;

  const alreadyShown = localStorage.getItem(STORAGE_KEY_SDK_LOGIN_GUIDE_SHOWN) === 'true';
  if (alreadyShown) return;

  localStorage.setItem(STORAGE_KEY_SDK_LOGIN_GUIDE_SHOWN, 'true');
  showSDKLoginGuide();
}

function openSDKLoginPage() {
  chrome.tabs.create({ url: SDK_LOGIN_URL });
  showToast('已開啟 GitHub 登入頁');
}

async function handleSDKLoginModalAction(options = {}) {
  try {
    await syncSDKGuideSettingFromModal();
  } catch (err) {
    console.error('[SidePilot] Failed to update SDK guide setting:', err);
    showToast('SDK 引導設定更新失敗', 'error');
  } finally {
    closeSDKLoginGuide();
  }

  if (options.openLoginPage) {
    openSDKLoginPage();
  }
}

function sendSDKMessageViaBackground(data) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'sdkSend', data }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (!response?.success) {
        reject(new Error(response?.error || 'SDK send failed'));
        return;
      }

      resolve(response.data || {});
    });
  });
}

async function loadSDKConfig() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'sdkConfig.get' });
    if (!response?.success) {
      throw new Error(response?.error || 'Failed to load SDK config');
    }
    state.sdkConfigInfo = {
      path: response.path,
      exists: !!response.exists,
      config: response.config || {}
    };
    return state.sdkConfigInfo;
  } catch (err) {
    console.warn('[SidePilot] Failed to load SDK config:', err?.message || err);
    state.sdkConfigInfo = {
      path: '',
      exists: false,
      config: null,
      error: err?.message || 'unknown'
    };
    return null;
  }
}

async function loadSDKConfigAndApplyUI() {
  await loadSDKConfig();
  applySDKConfigToUI();
}

function getSDKConfigValue(key) {
  const config = state.sdkConfigInfo?.config;
  if (!config || typeof config !== 'object') return undefined;
  return config[key];
}

function getSDKConfigSummaryText() {
  const info = state.sdkConfigInfo;
  if (!info) {
    return '尚未讀取 Copilot CLI 設定';
  }
  if (info?.error) {
    return 'Bridge 未連線，無法讀取設定';
  }
  const config = info.config || {};
  const model = config.model || 'default';
  const renderMarkdown = typeof config.render_markdown === 'boolean' ? config.render_markdown : 'default';
  const theme = config.theme || 'default';
  const banner = config.banner || 'default';
  const reasoningEffort = config.reasoning_effort || 'default';

  return `model: ${model} | render_markdown: ${renderMarkdown} | theme: ${theme} | banner: ${banner} | reasoning_effort: ${reasoningEffort}`;
}

function setSDKConfigSelectValue(select, value) {
  if (!select) return;
  const nextValue = value === undefined || value === null ? '' : String(value);
  select.value = nextValue;
  if (select.value !== nextValue) {
    select.value = '';
  }
}

function applySDKConfigToUI() {
  const info = state.sdkConfigInfo;
  const hasConfig = !!info && !info?.error;

  if (dom.sdkConfigPath) {
    if (!info) {
      dom.sdkConfigPath.textContent = '尚未讀取';
    } else if (info.error) {
      dom.sdkConfigPath.textContent = 'Bridge 未連線';
    } else {
      const suffix = info.exists === false ? ' (尚未建立)' : '';
      dom.sdkConfigPath.textContent = `${info.path || '未知路徑'}${suffix}`;
    }
  }

  if (dom.sdkConfigSummary) {
    dom.sdkConfigSummary.textContent = getSDKConfigSummaryText();
  }

  setSDKConfigSelectValue(dom.settingSdkRenderMarkdown, getSDKConfigValue('render_markdown'));
  setSDKConfigSelectValue(dom.settingSdkTheme, getSDKConfigValue('theme'));
  setSDKConfigSelectValue(dom.settingSdkBanner, getSDKConfigValue('banner'));
  setSDKConfigSelectValue(dom.settingSdkReasoningEffort, getSDKConfigValue('reasoning_effort'));

  if (!hasConfig) {
    setSDKConfigSelectValue(dom.settingSdkRenderMarkdown, '');
    setSDKConfigSelectValue(dom.settingSdkTheme, '');
    setSDKConfigSelectValue(dom.settingSdkBanner, '');
    setSDKConfigSelectValue(dom.settingSdkReasoningEffort, '');
  }

  updateSDKConfigControlState();
}

function updateSDKConfigControlState() {
  const info = state.sdkConfigInfo;
  const hasConfig = !!info && !info?.error;

  const setDisabled = (el, disabled) => {
    if (!el) return;
    el.disabled = disabled;
  };

  setDisabled(dom.settingSdkRenderMarkdown, !hasConfig || !state.settings.sdkConfigSyncRenderMarkdown);
  setDisabled(dom.settingSdkTheme, !hasConfig || !state.settings.sdkConfigSyncTheme);
  setDisabled(dom.settingSdkBanner, !hasConfig || !state.settings.sdkConfigSyncBanner);
  setDisabled(dom.settingSdkReasoningEffort, !hasConfig || !state.settings.sdkConfigSyncReasoningEffort);
}

function buildSDKConfigPatchFromUI(fields = null) {
  const patch = {};
  const allow = Array.isArray(fields) ? new Set(fields) : null;

  if (state.settings.sdkConfigSyncRenderMarkdown && (!allow || allow.has('render_markdown'))) {
    const value = dom.settingSdkRenderMarkdown?.value ?? '';
    patch.render_markdown = value === '' ? null : value === 'true';
  }
  if (state.settings.sdkConfigSyncTheme && (!allow || allow.has('theme'))) {
    const value = dom.settingSdkTheme?.value ?? '';
    patch.theme = value === '' ? null : value;
  }
  if (state.settings.sdkConfigSyncBanner && (!allow || allow.has('banner'))) {
    const value = dom.settingSdkBanner?.value ?? '';
    patch.banner = value === '' ? null : value;
  }
  if (state.settings.sdkConfigSyncReasoningEffort && (!allow || allow.has('reasoning_effort'))) {
    const value = dom.settingSdkReasoningEffort?.value ?? '';
    patch.reasoning_effort = value === '' ? null : value;
  }

  return patch;
}

async function updateSDKConfigFromUI(options = {}) {
  const patch = buildSDKConfigPatchFromUI(options.fields);
  if (!Object.keys(patch).length) return;

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'sdkConfig.update',
      patch
    });
    if (!response?.success) {
      throw new Error(response?.error || 'Failed to update config');
    }

    state.sdkConfigInfo = {
      path: response.path || state.sdkConfigInfo?.path || '',
      exists: true,
      config: response.config || {}
    };
    applySDKConfigToUI();

    if (options.showToast) {
      showToast('Copilot CLI 設定已更新');
    }
  } catch (err) {
    console.warn('[SidePilot] Failed to update SDK config:', err?.message || err);
    if (options.showToast) {
      showToast('Copilot CLI 設定更新失敗', 'error');
    }
  }
}

async function syncSDKConfigModel(model) {
  const trimmed = String(model || '').trim();
  const current = typeof getSDKConfigValue('model') === 'string' ? getSDKConfigValue('model') : null;

  if (!trimmed) {
    if (current === null || current === undefined || current === '') return;
  } else if (current === trimmed) {
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'sdkConfig.update',
      patch: { model: trimmed ? trimmed : null }
    });
    if (response?.success) {
      state.sdkConfigInfo = {
        path: response.path || state.sdkConfigInfo?.path || '',
        exists: true,
        config: response.config || {}
      };
      applySDKConfigToUI();
    }
  } catch (err) {
    console.warn('[SidePilot] Failed to update SDK config model:', err?.message || err);
  }
}

async function loadSDKModelOptions() {
  if (!dom.sdkModelSelect) return;

  try {
    const [response, configInfo] = await Promise.all([
      chrome.runtime.sendMessage({ action: 'sdkModels' }),
      loadSDKConfig()
    ]);
    if (!response?.success || !Array.isArray(response.models)) {
      throw new Error(response?.error || 'Failed to load model list');
    }

    const current = localStorage.getItem(STORAGE_KEY_SDK_MODEL) || '';
    const configModel = typeof configInfo?.config?.model === 'string' ? configInfo.config.model.trim() : '';
    dom.sdkModelSelect.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'default';
    dom.sdkModelSelect.appendChild(defaultOption);

    response.models.forEach((model) => {
      const option = document.createElement('option');
      option.value = model;
      option.textContent = model;
      dom.sdkModelSelect.appendChild(option);
    });

    if (current && response.models.includes(current)) {
      dom.sdkModelSelect.value = current;
    } else if (configModel && response.models.includes(configModel)) {
      dom.sdkModelSelect.value = configModel;
    } else {
      dom.sdkModelSelect.value = '';
      localStorage.removeItem(STORAGE_KEY_SDK_MODEL);
    }
    applySDKConfigToUI();
  } catch (err) {
    console.warn('[SidePilot] Failed to load SDK models:', err?.message || err);
  }
}

function getSelectedSDKModel() {
  const model = dom.sdkModelSelect?.value?.trim();
  return model || undefined;
}

async function ensureSDKBridgeConnection(options = {}) {
  const port = Number(options.port) || SDK_BRIDGE_PORT;
  const response = await chrome.runtime.sendMessage({ action: 'sdkConnect', port });
  return !!response?.success;
}

function buildSDKUnavailableHelpMessage(errorMessage = '') {
  const lines = [
    '❌ SDK 連線失敗：Bridge server not available',
    '',
    '請先在本機啟動 Bridge：',
    '1. cd scripts/copilot-bridge',
    '2. npm install',
    '3. npm run dev',
    '',
    '再完成 GitHub 登入：',
    `- 開啟 ${SDK_LOGIN_URL}`,
    '',
    `原始錯誤：${errorMessage || 'unknown'}`
  ];
  return lines.join('\n');
}

function buildSDK404HelpMessage(errorMessage = '') {
  const lines = [
    '❌ SDK API 找不到 (HTTP 404)',
    '',
    '常見原因：',
    `1. ${SDK_BRIDGE_PORT} 埠口不是 SidePilot Bridge`,
    '2. Bridge 版本不完整或未啟動正確專案',
    '',
    '請確認你是在此目錄啟動：',
    '1. cd scripts/copilot-bridge',
    '2. npm install',
    '3. npm run dev',
    '',
    `原始錯誤：${errorMessage || 'HTTP 404'}`
  ];
  return lines.join('\n');
}

// ============================================
// Rules Management
// ============================================

async function loadRules() {
  chrome.runtime.sendMessage({ action: 'rules.load' }, (response) => {
    if (response?.success && dom.rulesEditor) {
      dom.rulesEditor.value = response.content || '';
      updateRulesStatus('Loaded', 'success');
    } else {
      updateRulesStatus('Failed to load', 'error');
    }
  });
}

async function saveRules() {
  if (!dom.rulesEditor) return;
  
  updateRulesStatus('Saving...', 'pending');
  const content = dom.rulesEditor.value;
  
  chrome.runtime.sendMessage({ action: 'rules.save', content }, (response) => {
    if (response?.success) {
      updateRulesStatus('Saved', 'success');
      showToast('Rules saved successfully');
    } else {
      updateRulesStatus('Save failed', 'error');
      showToast('Failed to save rules', 'error');
    }
  });
}

function exportRules() {
  chrome.runtime.sendMessage({ action: 'rules.export' }, (response) => {
    if (response?.success) {
      showToast('Rules exported');
    } else {
      showToast('Export failed', 'error');
    }
  });
}

function importRules(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const content = event.target.result;
    if (dom.rulesEditor) {
      dom.rulesEditor.value = content;
      saveRules(); // Auto-save after import
      showToast('Rules imported');
    }
  };
  reader.readAsText(file);
  
  // Reset input
  e.target.value = '';
}

function loadTemplates() {
  chrome.runtime.sendMessage({ action: 'rules.getTemplates' }, (response) => {
    if (response?.success && dom.templateSelect) {
      // Keep first option
      const firstOption = dom.templateSelect.options[0];
      dom.templateSelect.innerHTML = '';
      dom.templateSelect.appendChild(firstOption);
      
      response.templates.forEach(tpl => {
        const option = document.createElement('option');
        option.value = tpl.id;
        option.textContent = tpl.name;
        dom.templateSelect.appendChild(option);
      });
    }
  });
}

function applyTemplate(templateId) {
  if (!confirm('This will overwrite current rules. Continue?')) {
    if (dom.templateSelect) dom.templateSelect.value = '';
    return;
  }

  chrome.runtime.sendMessage({ action: 'rules.applyTemplate', templateId }, (response) => {
    if (response?.success && dom.rulesEditor) {
      dom.rulesEditor.value = response.content || '';
      updateRulesStatus('Template applied', 'success');
      showToast('Template applied');
    } else {
      showToast('Failed to apply template', 'error');
    }
    if (dom.templateSelect) dom.templateSelect.value = '';
  });
}

function updateRulesStatus(text, type) {
  if (!dom.rulesStatus) return;
  dom.rulesStatus.textContent = text;
  dom.rulesStatus.className = `rules-status ${type}`;
}

// ============================================
// Memory Management
// ============================================

let currentEditingId = null;

function loadMemoryEntries() {
  const filter = {};
  if (dom.memoryFilter && dom.memoryFilter.value) {
    const val = dom.memoryFilter.value;
    if (['task', 'note', 'context', 'reference'].includes(val)) {
      filter.type = val;
    }
  }

  chrome.runtime.sendMessage({ action: 'memory.list', filter }, (response) => {
    if (response?.success) {
      renderMemoryList(response.entries);
    }
  });
}

function searchMemory(query) {
  if (!query) {
    loadMemoryEntries();
    return;
  }

  chrome.runtime.sendMessage({ action: 'memory.search', query }, (response) => {
    if (response?.success) {
      renderMemoryList(response.entries);
    }
  });
}

// Render memory entries list with proper event delegation
function renderMemoryList(entries) {
  if (!dom.memoryList) return;
  
  if (!entries || entries.length === 0) {
    dom.memoryList.innerHTML = '<div class="memory-empty">No entries found.</div>';
    return;
  }

  dom.memoryList.innerHTML = entries.map(entry => `
    <div class="memory-entry" data-id="${entry.id}">
      <div class="memory-entry-header">
        <span class="memory-entry-title">${escapeHtml(entry.title)}</span>
        <span class="memory-entry-type">${entry.type}</span>
      </div>
      <div class="memory-entry-content">${escapeHtml(entry.content)}</div>
      <div class="memory-entry-footer">
        <span>${new Date(entry.updatedAt).toLocaleDateString()}</span>
        ${entry.type === 'task' ? `<span class="memory-entry-status ${entry.status}">${entry.status.replace('_', ' ')}</span>` : ''}
      </div>
      <div class="memory-entry-actions">
        <button class="btn-entry-action btn-send-vscode" data-id="${entry.id}" title="Send to VS Code">
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path d="M2.5 1.5A1.5 1.5 0 0 0 1 3v10a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5V3a1.5 1.5 0 0 0-1.5-1.5h-11ZM2 3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 .5.5v10a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5V3Z"/>
            <path d="M7 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM4.5 8.5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1Zm7 0a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1Z"/>
          </svg>
        </button>
      </div>
    </div>
  `).join('');

  dom.memoryList.querySelectorAll('.btn-send-vscode').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      sendMemoryToVSCode(id);
    });
  });
}

function setupMemoryListeners() {
  if (dom.memoryList) {
    dom.memoryList.addEventListener('click', (e) => {
      const entryDiv = e.target.closest('.memory-entry');
      if (entryDiv) {
        editMemoryEntry(entryDiv.dataset.id);
      }
    });
  }
}

function openMemoryModal(entry = null) {
  currentEditingId = entry ? entry.id : null;
  
  if (dom.memoryModalTitle) dom.memoryModalTitle.textContent = entry ? 'Edit Entry' : 'New Entry';
  if (dom.entryType) dom.entryType.value = entry ? entry.type : 'task';
  if (dom.entryTitle) dom.entryTitle.value = entry ? entry.title : '';
  if (dom.entryContent) dom.entryContent.value = entry ? entry.content : '';
  if (dom.entryStatus) {
    dom.entryStatus.value = entry && entry.status ? entry.status : 'pending';
    dom.entryStatus.style.display = (entry ? entry.type : 'task') === 'task' ? 'block' : 'none';
  }
  
  // Add delete button if editing
  const footer = dom.memoryModal.querySelector('.modal-footer');
  const existingDelete = footer.querySelector('.btn-delete');
  if (existingDelete) existingDelete.remove();
  
  if (entry) {
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-icon btn-delete';
    deleteBtn.innerHTML = '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M6.5 1.75a.25.25 0 0 1 .25-.25h2.5a.25.25 0 0 1 .25.25V3h-3V1.75Zm4.5 0V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.75 1.75 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 6.5a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 0 1.5 0v-4.5a.75.75 0 0 0-.75-.75Zm3 0a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 0 1.5 0v-4.5a.75.75 0 0 0-.75-.75Z"/></svg>';
    deleteBtn.style.marginRight = 'auto';
    deleteBtn.onclick = () => deleteMemoryEntry(entry.id);
    footer.insertBefore(deleteBtn, footer.firstChild);
  }

  dom.memoryModal.classList.remove('hidden');
}

function closeMemoryModal() {
  dom.memoryModal.classList.add('hidden');
  currentEditingId = null;
}

function editMemoryEntry(id) {
  chrome.runtime.sendMessage({ action: 'memory.get', id }, (response) => {
    if (response?.success && response.entry) {
      openMemoryModal(response.entry);
    }
  });
}

function saveMemoryEntry() {
  const entry = {
    type: dom.entryType.value,
    title: dom.entryTitle.value,
    content: dom.entryContent.value,
    status: dom.entryStatus.value
  };

  if (!entry.title) {
    showToast('Title is required', 'error');
    return;
  }

  if (currentEditingId) {
    chrome.runtime.sendMessage({ action: 'memory.update', id: currentEditingId, data: entry }, (response) => {
      if (response?.success) {
        closeMemoryModal();
        loadMemoryEntries();
        showToast('Entry updated');
      } else {
        showToast('Failed to update: ' + response.error, 'error');
      }
    });
  } else {
    chrome.runtime.sendMessage({ action: 'memory.create', entry }, (response) => {
      if (response?.success) {
        closeMemoryModal();
        loadMemoryEntries();
        showToast('Entry created');
      } else {
        showToast('Failed to create: ' + response.error, 'error');
      }
    });
  }
}

function deleteMemoryEntry(id) {
  if (!confirm('Are you sure you want to delete this entry?')) return;
  
  chrome.runtime.sendMessage({ action: 'memory.delete', id }, (response) => {
    if (response?.success) {
      closeMemoryModal();
      loadMemoryEntries();
      showToast('Entry deleted');
    } else {
      showToast('Failed to delete', 'error');
    }
  });
}

// 傳送目前編輯中的條目到 VS Code
function sendEntryToVSCode() {
  if (!currentEditingId) {
    showToast('請先選取一個條目', 'error');
    return;
  }
  chrome.runtime.sendMessage({ action: 'vscode.send', id: currentEditingId }, (response) => {
    if (response?.success) {
      showToast('已傳送到 VS Code');
    } else {
      showToast('傳送失敗: ' + (response?.error || '未知錯誤'), 'error');
    }
  });
}

// ============================================
// 事件監聽器設置
// ============================================

function setupEventListeners() {
  // 底部浮動擷取按鈕
  dom.floatingCaptureBtn?.addEventListener('click', toggleCapturePanel);

  // 擷取面板
  dom.closeCaptureBtn?.addEventListener('click', closeCapturePanel);
  dom.captureContent?.addEventListener('click', handleCaptureContentClick);
  dom.copyAllBtn?.addEventListener('click', outputTextToChat);

  // 錯誤處理
  dom.retryBtn?.addEventListener('click', refreshFrame);
  dom.openWindowBtn?.addEventListener('click', openCopilotWindow);

  // 歡迎畫面
  dom.welcomeCloseBtn?.addEventListener('click', closeWelcome);
  dom.welcomeDeclineBtn?.addEventListener('click', declineAndClose);

  // 監聽來自 background 的訊息
  chrome.runtime.onMessage.addListener(handleBackgroundMessage);
  dom.homeBtn?.addEventListener('click', () => {
    goCopilotHome().catch((err) => {
      showToast(`回首頁失敗：${err.message}`, 'error');
    });
  });

  // Tab Navigation
  dom.tabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });
  dom.modeSwitchBtns?.forEach(btn => {
    btn.addEventListener('click', () => setModeFromUI(btn.dataset.mode));
  });

  // Rules Tab
  dom.saveRulesBtn?.addEventListener('click', saveRules);
  dom.exportRulesBtn?.addEventListener('click', exportRules);
  dom.importRulesBtn?.addEventListener('click', () => dom.rulesFileInput?.click());
  dom.rulesFileInput?.addEventListener('change', importRules);
  dom.templateSelect?.addEventListener('change', (e) => {
    if (e.target.value) applyTemplate(e.target.value);
  });

  // Memory Tab
  dom.addMemoryBtn?.addEventListener('click', () => openMemoryModal());
  dom.closeMemoryModal?.addEventListener('click', closeMemoryModal);
  dom.cancelMemoryBtn?.addEventListener('click', closeMemoryModal);
  dom.saveMemoryBtn?.addEventListener('click', saveMemoryEntry);
  dom.memorySearch?.addEventListener('input', (e) => searchMemory(e.target.value));
  dom.memoryFilter?.addEventListener('change', () => loadMemoryEntries());
  dom.entryType?.addEventListener('change', (e) => {
    // Show/hide status based on type
    if (dom.entryStatus) {
      dom.entryStatus.style.display = e.target.value === 'task' ? 'block' : 'none';
    }
  });
  dom.sendToVSCodeBtn?.addEventListener('click', sendEntryToVSCode);
  dom.settingSdkIncludeMemory?.addEventListener('change', () => {
    state.settings.sdkIncludeMemory = !!dom.settingSdkIncludeMemory?.checked;
    refreshSDKMemorySummary();
    markSettingsDirty();
  });
  dom.settingSdkIncludeRules?.addEventListener('change', () => {
    state.settings.sdkIncludeRules = !!dom.settingSdkIncludeRules?.checked;
    refreshSDKMemorySummary();
    markSettingsDirty();
  });
  dom.settingSdkShowStorageLocation?.addEventListener('change', () => {
    state.settings.sdkShowStorageLocation = !!dom.settingSdkShowStorageLocation?.checked;
    updateSDKStorageLocationDisplay();
    markSettingsDirty();
  });
  dom.settingSdkSessionPath?.addEventListener('input', () => {
    state.settings.sdkSessionStatePath = normalizeSessionStatePath(dom.settingSdkSessionPath?.value);
    updateSDKStorageLocationDisplay();
    markSettingsDirty();
  });
  dom.settingSdkConversationSavePath?.addEventListener('input', () => {
    state.settings.sdkConversationSavePath = normalizeSavePath(
      dom.settingSdkConversationSavePath?.value,
      DEFAULT_CHAT_SAVE_PATH
    );
    markSettingsDirty();
  });
  dom.settingSdkScreenshotSavePath?.addEventListener('input', () => {
    state.settings.sdkScreenshotSavePath = normalizeSavePath(
      dom.settingSdkScreenshotSavePath?.value,
      DEFAULT_SCREENSHOT_SAVE_PATH
    );
    markSettingsDirty();
  });
  dom.settingSdkSyncRenderMarkdown?.addEventListener('change', () => {
    state.settings.sdkConfigSyncRenderMarkdown = !!dom.settingSdkSyncRenderMarkdown?.checked;
    updateSDKConfigControlState();
    markSettingsDirty();
    if (state.settings.sdkConfigSyncRenderMarkdown) {
      updateSDKConfigFromUI({ fields: ['render_markdown'], showToast: true });
    }
  });
  dom.settingSdkSyncTheme?.addEventListener('change', () => {
    state.settings.sdkConfigSyncTheme = !!dom.settingSdkSyncTheme?.checked;
    updateSDKConfigControlState();
    markSettingsDirty();
    if (state.settings.sdkConfigSyncTheme) {
      updateSDKConfigFromUI({ fields: ['theme'], showToast: true });
    }
  });
  dom.settingSdkSyncBanner?.addEventListener('change', () => {
    state.settings.sdkConfigSyncBanner = !!dom.settingSdkSyncBanner?.checked;
    updateSDKConfigControlState();
    markSettingsDirty();
    if (state.settings.sdkConfigSyncBanner) {
      updateSDKConfigFromUI({ fields: ['banner'], showToast: true });
    }
  });
  dom.settingSdkSyncReasoningEffort?.addEventListener('change', () => {
    state.settings.sdkConfigSyncReasoningEffort = !!dom.settingSdkSyncReasoningEffort?.checked;
    updateSDKConfigControlState();
    markSettingsDirty();
    if (state.settings.sdkConfigSyncReasoningEffort) {
      updateSDKConfigFromUI({ fields: ['reasoning_effort'], showToast: true });
    }
  });
  dom.settingSdkRenderMarkdown?.addEventListener('change', () => {
    if (state.settings.sdkConfigSyncRenderMarkdown) {
      updateSDKConfigFromUI({ fields: ['render_markdown'], showToast: true });
    }
  });
  dom.settingSdkTheme?.addEventListener('change', () => {
    if (state.settings.sdkConfigSyncTheme) {
      updateSDKConfigFromUI({ fields: ['theme'], showToast: true });
    }
  });
  dom.settingSdkBanner?.addEventListener('change', () => {
    if (state.settings.sdkConfigSyncBanner) {
      updateSDKConfigFromUI({ fields: ['banner'], showToast: true });
    }
  });
  dom.settingSdkReasoningEffort?.addEventListener('change', () => {
    if (state.settings.sdkConfigSyncReasoningEffort) {
      updateSDKConfigFromUI({ fields: ['reasoning_effort'], showToast: true });
    }
  });
  dom.sdkModelSelect?.addEventListener('change', () => {
    const value = dom.sdkModelSelect?.value || '';
    if (value) {
      localStorage.setItem(STORAGE_KEY_SDK_MODEL, value);
    } else {
      localStorage.removeItem(STORAGE_KEY_SDK_MODEL);
    }
    syncSDKConfigModel(value);
    chrome.runtime.sendMessage({ action: 'sdkResetSession' });
  });

  // Settings Tab
  dom.saveSettingsBtn?.addEventListener('click', () => {
    saveSettings().catch((err) => {
      console.error('[SidePilot] Failed to save settings:', err);
      updateSettingsStatus('儲存失敗', 'error');
      showToast('設定儲存失敗', 'error');
    });
  });
  dom.settingCaptureButtonWidth?.addEventListener('input', (e) => {
    const width = clampCaptureButtonWidth(e.target.value);
    updateCaptureWidthLabel(width);
    applyCaptureButtonWidth(width);
    markSettingsDirty();
  });
  dom.settingAutoSdkLogin?.addEventListener('change', markSettingsDirty);
  dom.settingPlayIntroEveryOpen?.addEventListener('change', markSettingsDirty);
  dom.settingShowWarningOverlay?.addEventListener('change', markSettingsDirty);
  dom.settingLinkAllowlist?.addEventListener('input', markSettingsDirty);
  dom.settingLinkGuardMode?.addEventListener('change', () => {
    state.settings.linkGuardMode = dom.settingLinkGuardMode?.value === 'deny' ? 'deny' : 'allow';
    updateLinkGuardLabels(state.settings.linkGuardMode);
    markSettingsDirty();
  });
  dom.settingSdkTagAssistant?.addEventListener('change', markSettingsDirty);
  dom.settingSdkTagPacket?.addEventListener('change', markSettingsDirty);
  dom.settingSdkTagRaw?.addEventListener('change', markSettingsDirty);
  dom.openSdkLoginGuideBtn?.addEventListener('click', openSDKLoginPage);
  dom.testSdkBridgeBtn?.addEventListener('click', async () => {
    updateSettingsStatus('測試 Bridge 連線中...', 'warning');
    try {
      const ok = await ensureSDKBridgeConnection({ port: SDK_BRIDGE_PORT });
      if (ok) {
        updateSettingsStatus('Bridge 連線成功', 'success');
        showToast('SDK Bridge 已連線');
        loadSDKModelOptions();
        loadSDKConfigAndApplyUI();
      } else {
        updateSettingsStatus('Bridge 未啟動或無法連線', 'error');
        showToast('Bridge 連線失敗，請先啟動本機服務', 'error');
      }
    } catch (err) {
      updateSettingsStatus('Bridge 連線失敗', 'error');
      showToast(`Bridge 測試失敗：${err.message}`, 'error');
    }
  });
  dom.bridgeCheckBtn?.addEventListener('click', () => {
    checkBridgeHealth({ showToast: true });
  });
  dom.bridgeCopyCmdBtn?.addEventListener('click', async () => {
    await copyToClipboard(buildBridgeStartCommands(), '啟動指令已複製');
  });
  dom.bridgeCopyCheckBtn?.addEventListener('click', async () => {
    await copyToClipboard(buildBridgeCheckCommand(), '檢查指令已複製');
  });

  // SDK Login Guide Modal
  dom.closeSdkLoginModal?.addEventListener('click', () => {
    handleSDKLoginModalAction();
  });
  dom.sdkLoginLaterBtn?.addEventListener('click', () => {
    handleSDKLoginModalAction();
  });
  dom.sdkLoginNowBtn?.addEventListener('click', () => {
    handleSDKLoginModalAction({ openLoginPage: true });
  });
  dom.sdkLoginModal?.addEventListener('click', (e) => {
    if (e.target === dom.sdkLoginModal) {
      handleSDKLoginModalAction();
    }
  });
  
  setupMemoryListeners();
  refreshSDKMemorySummary();
  applySDKAssistantOnlyMode();
  
  // SDK Chat
  dom.sdkSendBtn?.addEventListener('click', async () => {
    const content = dom.sdkInput?.value?.trim();
    if (!content) return;
    
    dom.sdkInput.value = '';
    dom.sdkSendBtn.disabled = true;
    
    // Add user message
    addSDKMessage('user', content);
    
    // Add typing indicator
    const typingId = addSDKTypingIndicator();
    
    try {
      let promptToSend = content;
      let sandboxSystemMessage;

      const includeMemory = state.settings.sdkIncludeMemory !== false;
      const includeRules = state.settings.sdkIncludeRules !== false;

      if (includeMemory || includeRules) {
        try {
          const [allMemoryEntries, rulesContent] = await Promise.all([
            includeMemory ? listAllMemoryEntries() : Promise.resolve([]),
            includeRules ? loadRulesContent().catch(() => '') : Promise.resolve('')
          ]);
          const composed = buildMemoryInjectedPrompt(content, allMemoryEntries, rulesContent);
          promptToSend = composed.prompt;
          sandboxSystemMessage = SIDEPILOT_SANDBOX_SYSTEM_MESSAGE;
          updateSDKMemorySummary(
            `Packet v1: ${composed.injectedCount} mem, rules ${composed.rulesInjected ? 'on' : 'off'}`
          );
        } catch (memoryErr) {
          console.warn('[SidePilot] Memory injection failed:', memoryErr);
          updateSDKMemorySummary('Memory injection unavailable');
          showToast('Memory 載入失敗，本次僅送出原始訊息', 'warning');
        }
      }

      const response = await sendSDKMessageViaBackground({
        type: 'chat',
        content: promptToSend,
        systemMessage: sandboxSystemMessage,
        model: getSelectedSDKModel()
      });
      
      removeSDKTypingIndicator(typingId);
      
      if (response.success && response.content) {
        const parsed = parseSDKSandboxResponse(response.content);
        addSDKStructuredAssistantMessage(parsed);

        if (!parsed.hasAssistantBlock) {
          showToast('未偵測到 assistant_response 區塊，已顯示原始輸出', 'warning');
        }

        if (parsed.packetObjects.length > 0) {
          console.debug('[SidePilot] sidepilot_packet:', parsed.packetObjects);
        }
      } else {
        addSDKMessage('assistant', '❌ Failed to get response');
      }
    } catch (err) {
      removeSDKTypingIndicator(typingId);
      console.error('[SDK Chat]', err);
      const lowerError = String(err?.message || '').toLowerCase();
      if (lowerError.includes('bridge server not available')) {
        addSDKMessage('assistant', buildSDKUnavailableHelpMessage(err.message));
        showToast('SDK Bridge 尚未啟動，已提供啟動指引', 'warning');
      } else if (lowerError.includes('http 404')) {
        addSDKMessage('assistant', buildSDK404HelpMessage(err.message));
        showToast('SDK API 回傳 404，請確認 Bridge 啟動來源', 'warning');
      } else {
        addSDKMessage('assistant', `❌ Error: ${err.message}`);
      }
    } finally {
      dom.sdkSendBtn.disabled = false;
      dom.sdkInput?.focus();
    }
  });
  
  dom.sdkInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      dom.sdkSendBtn?.click();
    }
  });
}

// ============================================
// iframe 載入偵測
// ============================================

function setupFrameLoadDetection() {
  // 清除之前的 timeout，避免重複設置
  if (state.loadTimeout) {
    clearTimeout(state.loadTimeout);
    state.loadTimeout = null;
  }

  // 載入成功
  dom.copilotFrame.addEventListener('load', () => {
    if (state.loadTimeout) {
      clearTimeout(state.loadTimeout);
      state.loadTimeout = null;
    }
    state.frameLoaded = true;
    dom.loadingOverlay.classList.add('hidden');
    dom.errorOverlay.classList.add('hidden');
  });

  // 載入超時
  state.loadTimeout = setTimeout(() => {
    if (!state.frameLoaded) {
      showFrameError('載入超時，請檢查網路連線');
    }
    state.loadTimeout = null;
  }, FRAME_LOAD_TIMEOUT);

  // iframe 錯誤偵測
  dom.copilotFrame.addEventListener('error', () => {
    showFrameError('無法載入 GitHub Copilot');
  });
}

function showFrameError(message) {
  dom.loadingOverlay.classList.add('hidden');
  dom.errorOverlay.classList.remove('hidden');
  if (dom.errorMessage) {
    dom.errorMessage.textContent = message;
  }
}

function refreshFrame() {
  if (state.loadTimeout) {
    clearTimeout(state.loadTimeout);
    state.loadTimeout = null;
  }
  
  state.frameLoaded = false;
  dom.loadingOverlay.classList.remove('hidden');
  dom.errorOverlay.classList.add('hidden');
  
  const currentSrc = dom.copilotFrame.src;
  dom.copilotFrame.src = '';
  setTimeout(() => {
    dom.copilotFrame.src = currentSrc;
  }, 0);
   
  state.loadTimeout = setTimeout(() => {
    if (!state.frameLoaded) {
      showFrameError('載入超時，請檢查網路連線');
    }
    state.loadTimeout = null;
  }, FRAME_LOAD_TIMEOUT);
}

function openCopilotWindow() {
  chrome.runtime.sendMessage({ action: 'openCopilotWindow' });
}

// ============================================
// 首次使用者檢查
// ============================================

function checkIntroVideo() {
  // 檢查是否已拒絕過
  const declined = localStorage.getItem(STORAGE_KEY_DECLINED);
  if (declined) {
    showDeclinedState();
    return;
  }

  if (state.settings.playIntroEveryOpen) {
    localStorage.removeItem('intro_played');
  }

  const introPlayed = localStorage.getItem('intro_played');
  
  if (!introPlayed && dom.introContainer && dom.introVideo) {
    // Play video
    dom.introContainer.classList.remove('hidden');
    dom.introVideo.play().catch(err => {
        console.error("Video play failed", err);
        finishIntro();
    });
    
    dom.introVideo.onended = finishIntro;
    dom.skipIntroBtn.onclick = finishIntro;
  } else {
    checkWarningStatus();
  }
}

function finishIntro() {
  if (!dom.introContainer) return;
  
  dom.introContainer.classList.add('fade-out');
  
  // Stop video to save resources
  if (dom.introVideo) {
    dom.introVideo.pause();
  }

  setTimeout(() => {
    dom.introContainer.classList.add('hidden');
    localStorage.setItem('intro_played', 'true');
    checkWarningStatus();
  }, 1000);
}

function checkWarningStatus() {
  if (state.settings.showWarningOverlay === false) {
    return;
  }

  const isSuppressed = localStorage.getItem('copilot_warning_suppressed');
  
  if (!isSuppressed && dom.welcomeOverlay) {
    dom.welcomeOverlay.classList.remove('hidden');
    // 觸發淡入動畫
    requestAnimationFrame(() => {
      dom.welcomeOverlay.classList.add('visible');
    });
  }
}

function showDeclinedState() {
  // 不載入 iframe
  if (dom.copilotFrame) {
    dom.copilotFrame.src = 'about:blank';
  }
  
  dom.loadingOverlay?.classList.add('hidden');
  dom.welcomeOverlay?.classList.remove('visible');
  dom.welcomeOverlay?.classList.add('hidden');
  
  if (dom.errorOverlay) {
    dom.errorOverlay.classList.remove('hidden');
    if (dom.errorMessage) {
      dom.errorMessage.innerHTML = '您已拒絕使用條款。<br><br>如需使用 SidePilot，請重新開啟擴充功能並接受相關風險聲明。<br><br><button id="resetDeclineBtn" class="btn btn-secondary" style="margin-top: 12px;">重新選擇</button>';
    }
    
    // 綁定重置按鈕
    setTimeout(() => {
      const resetBtn = document.getElementById('resetDeclineBtn');
      resetBtn?.addEventListener('click', () => {
        localStorage.removeItem(STORAGE_KEY_DECLINED);
        location.reload();
      });
    }, 0);
  }
}

function closeWelcome() {
  localStorage.setItem(STORAGE_KEY, 'true');
  
  if (dom.welcomeSuppressCheckbox && dom.welcomeSuppressCheckbox.checked) {
    localStorage.setItem('copilot_warning_suppressed', 'true');
  }

  // 先淡出，再隱藏
  dom.welcomeOverlay?.classList.remove('visible');
  setTimeout(() => {
    dom.welcomeOverlay?.classList.add('hidden');
  }, 300);
}

function declineAndClose() {
  // 使用者拒絕條款，記錄拒絕狀態
  localStorage.removeItem(STORAGE_KEY);
  localStorage.setItem(STORAGE_KEY_DECLINED, 'true');
  
  // 顯示拒絕狀態
  showDeclinedState();
  showToast('您已拒絕使用條款。如需使用，請點擊「重新選擇」。', 'warning');
}

// ============================================
// 頁面資訊
// ============================================

function loadCurrentPageInfo() {
  chrome.runtime.sendMessage({ action: 'getPageContent' }, (response) => {
    if (chrome.runtime.lastError) return;

    if (response?.success || response?.pageInfo) {
      updatePageInfo(
        response.title || response.pageInfo?.title,
        response.url || response.pageInfo?.url
      );
    }
  });
}

function updatePageInfo(title, url) {
  if (dom.pageTitle) dom.pageTitle.textContent = title || '無標題';
  if (dom.pageUrl) dom.pageUrl.textContent = url || '';
  dom.pageInfo?.classList.add('visible');
}

// ============================================
// 擷取面板
// ============================================

function toggleCapturePanel() {
  if (!state.isCapturePanelOpen) {
    openCapturePanel();
    return;
  }

  clearCaptureState();
  loadPageContent();
}

async function openCapturePanel() {
  state.isCapturePanelOpen = true;
  dom.capturePanel?.classList.add('visible');

  await loadPageContent();
}

function closeCapturePanel() {
  state.isCapturePanelOpen = false;
  dom.capturePanel?.classList.remove('visible');
}

function syncCapturePanelMode() {
  // Capture panel now available in both modes
}

function clearCaptureState() {
  state.currentPageContent = null;
  state.currentPageScreenshot = null;
  state.currentPartialScreenshot = null;
  state.currentPageError = null;
  renderCaptureLoading();
}

async function loadPageContent() {
  if (!dom.captureContent) return;

  renderCaptureLoading();
  state.currentPageError = null;
  state.currentPartialScreenshot = null;

  const [pageResult, screenshotResult] = await Promise.all([
    requestPageContent(),
    requestVisibleScreenshot()
  ]);

  if (pageResult?.success && pageResult.content) {
    state.currentPageContent = pageResult.content;
    state.currentPageError = null;
    updatePageInfo(pageResult.title, pageResult.url);
  } else {
    state.currentPageContent = null;
    state.currentPageError = pageResult?.error || '無法取得頁面內容';
  }

  if (screenshotResult?.success && screenshotResult.dataUrl) {
    state.currentPageScreenshot = screenshotResult.dataUrl;
  } else {
    state.currentPageScreenshot = null;
  }

  renderCaptureContent();
}

function renderCaptureLoading() {
  if (!dom.captureContent) return;
  dom.captureContent.innerHTML = `
    <div class="capture-grid">
      ${['A', 'B', 'C'].map(() => `
        <div class="capture-card loading">
          <div class="capture-card-header">
            <div class="capture-card-title">載入中</div>
            <div class="capture-card-subtitle">請稍候</div>
          </div>
          <div class="capture-card-body">
            <div class="capture-loading">載入中...</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderCaptureContent() {
  if (!dom.captureContent) return;

  const content = state.currentPageContent;
  const previewText = buildTextPreview(content);
  const statsText = buildTextStats(content);
  const title = content?.title ? escapeHtml(content.title) : '無標題';
  const url = content?.url ? escapeHtml(content.url) : '';
  const descriptionRaw = content?.meta?.description || content?.meta?.['og:description'] || '';
  const description = descriptionRaw ? escapeHtml(descriptionRaw) : '';

  const textBodyHtml = content
    ? `
        <div class="capture-text-meta">
          <div class="capture-meta-row">
            <span class="capture-meta-label">標題</span>
            <span class="capture-meta-value">${title}</span>
          </div>
          ${url ? `
          <div class="capture-meta-row">
            <span class="capture-meta-label">網址</span>
            <span class="capture-meta-value">${url}</span>
          </div>` : ''}
          ${description ? `
          <div class="capture-meta-row">
            <span class="capture-meta-label">描述</span>
            <span class="capture-meta-value">${description}</span>
          </div>` : ''}
        </div>
        <div class="capture-text-preview">${escapeHtml(previewText)}</div>
      `
    : `<div class="capture-error">${escapeHtml(state.currentPageError || '沒有可用的內容')}</div>`;

  const fullShot = state.currentPageScreenshot;
  const partialShot = state.currentPartialScreenshot;

  const fullThumbAction = fullShot ? 'open-full' : 'refresh-full';
  const partialThumbAction = partialShot ? 'open-partial' : 'capture-partial';

  const fullThumbHtml = fullShot
    ? `<img src="${escapeAttr(fullShot)}" alt="頁面截圖">
       <div class="capture-thumb-label">可見範圍</div>
       <div class="capture-thumb-action" data-action="refresh-full">重新擷取</div>`
    : `<div>點擊擷取頁面縮圖</div>`;

  const partialThumbHtml = partialShot
    ? `<img src="${escapeAttr(partialShot)}" alt="部分截圖">
       <div class="capture-thumb-label">選取範圍</div>
       <div class="capture-thumb-action" data-action="capture-partial">重新選取</div>`
    : `<div>點擊選取範圍</div>`;

  dom.captureContent.innerHTML = `
    <div class="capture-grid">
      <div class="capture-card">
        <div class="capture-card-header">
          <div class="capture-card-title">A 文字擷取</div>
          <div class="capture-card-subtitle">${statsText}</div>
        </div>
        <div class="capture-card-body">
          ${textBodyHtml}
        </div>
        <div class="capture-card-actions">
          <button class="btn-soft" data-action="copy-text">複製文字</button>
          <button class="btn-soft" data-action="copy-structured">複製結構化</button>
        </div>
      </div>

      <div class="capture-card">
        <div class="capture-card-header">
          <div class="capture-card-title">B 頁面截圖</div>
          <div class="capture-card-subtitle">自動擷取可見範圍</div>
        </div>
        <div class="capture-card-body">
          <div class="capture-thumb" data-action="${fullThumbAction}">${fullThumbHtml}</div>
        </div>
        <div class="capture-card-actions">
          <button class="btn-soft" data-action="refresh-full">重新擷取</button>
          <button class="btn-soft" data-action="send-full">送出至聊天對話</button>
          <button class="btn-soft" data-action="download-full">下載截圖</button>
        </div>
      </div>

      <div class="capture-card">
        <div class="capture-card-header">
          <div class="capture-card-title">C 部分截圖</div>
          <div class="capture-card-subtitle">拖曳選取區域</div>
        </div>
        <div class="capture-card-body">
          <div class="capture-thumb" data-action="${partialThumbAction}">${partialThumbHtml}</div>
        </div>
        <div class="capture-card-actions">
          <button class="btn-soft" data-action="capture-partial">選取範圍</button>
          <button class="btn-soft" data-action="send-partial">送出至聊天對話</button>
          <button class="btn-soft" data-action="download-partial">下載截圖</button>
        </div>
      </div>
    </div>
  `;
}

function buildTextPreview(content) {
  if (!content) return '';
  const paragraphs = Array.isArray(content.paragraphs) && content.paragraphs.length
    ? content.paragraphs
    : (content.text || '').split(/\n{2,}/g).filter(Boolean);
  const preview = paragraphs.slice(0, 3).join('\n\n').trim();
  return preview || content.text || '';
}

function buildTextStats(content) {
  if (!content) return '尚無文字';
  const parts = [];
  if (content.charCount) {
    parts.push(`${content.charCount} 字`);
  } else if (content.wordCount) {
    parts.push(`${content.wordCount} 字`);
  }
  if (content.paragraphs?.length) parts.push(`${content.paragraphs.length} 段`);
  if (content.headings?.length) parts.push(`${content.headings.length} 標題`);
  if (content.codeBlocks?.length) parts.push(`${content.codeBlocks.length} 程式碼`);
  return parts.length > 0 ? parts.join(' · ') : '尚無文字';
}

function handleCaptureContentClick(event) {
  const target = event.target.closest('[data-action]');
  if (!target) return;

  const action = target.dataset.action;
  switch (action) {
    case 'copy-text':
      copyAllContent();
      break;
    case 'copy-structured':
      copyStructuredContent();
      break;
    case 'refresh-full':
      refreshFullScreenshot();
      break;
    case 'capture-partial':
      refreshPartialScreenshot();
      break;
    case 'download-full':
      downloadScreenshot(state.currentPageScreenshot, 'sidepilot-page.png');
      break;
    case 'download-partial':
      downloadScreenshot(state.currentPartialScreenshot, 'sidepilot-partial.png');
      break;
    case 'send-full':
      sendScreenshotToChat(state.currentPageScreenshot, 'page-screenshot');
      break;
    case 'send-partial':
      sendScreenshotToChat(state.currentPartialScreenshot, 'partial-screenshot');
      break;
    case 'open-full':
      openScreenshotInTab(state.currentPageScreenshot);
      break;
    case 'open-partial':
      openScreenshotInTab(state.currentPartialScreenshot);
      break;
    default:
      break;
  }
}

async function setModeFromUI(mode) {
  if (!['iframe', 'sdk'].includes(mode)) return;
  if (state.detectedMode === mode) return;

  dom.modeSwitchBtns?.forEach(btn => {
    btn.disabled = true;
  });

  try {
    const response = await chrome.runtime.sendMessage({ action: 'setMode', mode });
    if (!response?.success) {
      throw new Error(response?.error || 'Unknown error');
    }

    state.detectedMode = response.mode || mode;
    updateModeBadge();
    showToast(`已切換為 ${state.detectedMode.toUpperCase()} 模式`);

    if (state.detectedMode === 'sdk') {
      const bridgeReady = await ensureSDKBridgeConnection({ port: SDK_BRIDGE_PORT });
      if (!bridgeReady) {
        showToast('SDK Bridge 未連線，請先啟動本機 bridge server', 'warning');
        addSDKMessage('assistant', buildSDKUnavailableHelpMessage('Bridge server not available'));
      } else {
        await loadSDKModelOptions();
      }
      maybeShowSDKLoginGuideOnFirstUse();
    }
  } catch (err) {
    console.error('[SidePilot] Failed to switch mode:', err);
    showToast(`模式切換失敗：${err.message}`, 'error');
  } finally {
    dom.modeSwitchBtns?.forEach(btn => {
      btn.disabled = false;
    });
  }
}

function requestPageContent() {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ action: 'getPageContent' }, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message });
        return;
      }
      resolve(response || { success: false, error: '無法取得頁面內容' });
    });
  });
}

function requestVisibleScreenshot() {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ action: 'captureVisibleScreenshot' }, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message });
        return;
      }
      resolve(response || { success: false, error: '無法擷取截圖' });
    });
  });
}

function requestPartialScreenshot() {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ action: 'capturePartialScreenshot' }, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message });
        return;
      }
      resolve(response || { success: false, error: '無法擷取部分截圖' });
    });
  });
}

async function refreshFullScreenshot() {
  showToast('擷取頁面截圖中...');
  const result = await requestVisibleScreenshot();
  if (result?.success && result.dataUrl) {
    state.currentPageScreenshot = result.dataUrl;
    renderCaptureContent();
    showToast('頁面截圖已更新');
  } else {
    showToast(result?.error || '擷取失敗', 'error');
  }
}

async function refreshPartialScreenshot() {
  showToast('請在頁面上拖曳選取區域...');
  const result = await requestPartialScreenshot();
  if (result?.success && result.dataUrl) {
    state.currentPartialScreenshot = result.dataUrl;
    renderCaptureContent();
    showToast('部分截圖已更新');
  } else if (result?.error) {
    showToast(result.error, 'error');
  }
}

function openScreenshotInTab(dataUrl) {
  if (!dataUrl) {
    showToast('尚無截圖可開啟', 'error');
    return;
  }
  chrome.tabs.create({ url: dataUrl });
}

function sanitizeDownloadPath(path) {
  const raw = String(path || '').trim();
  if (!raw) return '';
  let normalized = raw.replace(/\\/g, '/');
  normalized = normalized.replace(/^[A-Za-z]:\/?/, '');
  normalized = normalized.replace(/^\/+/, '');
  normalized = normalized.replace(/\.\.(\/|\\)/g, '');
  return normalized.replace(/\/+$/, '');
}

function buildDownloadFilename(folder, filename) {
  const safeFolder = sanitizeDownloadPath(folder);
  if (!safeFolder) return filename;
  return `${safeFolder}/${filename}`;
}

function downloadScreenshot(dataUrl, filename) {
  if (!dataUrl) {
    showToast('尚無截圖可下載', 'error');
    return;
  }
  const targetFolder = state.settings.sdkScreenshotSavePath;
  const finalName = buildDownloadFilename(targetFolder, filename);
  const saveAs = !sanitizeDownloadPath(targetFolder);
  chrome.downloads.download({ url: dataUrl, filename: finalName, saveAs }, () => {
    if (chrome.runtime.lastError) {
      showToast('下載失敗: ' + chrome.runtime.lastError.message, 'error');
    } else {
      showToast('已開始下載');
    }
  });
}

async function copyImageToClipboard(dataUrl) {
  if (!dataUrl || !navigator.clipboard?.write) return false;
  try {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const item = new ClipboardItem({ [blob.type]: blob });
    await navigator.clipboard.write([item]);
    return true;
  } catch {
    return false;
  }
}

async function sendScreenshotToChat(dataUrl, label) {
  if (!dataUrl) {
    showToast('尚無截圖可送出', 'error');
    return;
  }

  if (state.detectedMode === 'sdk') {
    if (!dom.sdkInput || !dom.sdkSendBtn) {
      showToast('SDK 對話輸入框不可用', 'error');
      return;
    }
    const filename = label === 'partial-screenshot' ? 'sidepilot-partial.png' : 'sidepilot-page.png';
    const targetFolder = state.settings.sdkScreenshotSavePath;
    const relativePath = buildDownloadFilename(targetFolder, filename);
    downloadScreenshot(dataUrl, filename);
    dom.sdkInput.value = `已儲存截圖：${relativePath}`;
    dom.sdkSendBtn.click();
    showToast('SDK 不支援圖片，已送出截圖路徑', 'warning');
    return;
  }

  const copied = await copyImageToClipboard(dataUrl);
  if (copied) {
    showToast('圖片已複製，請貼到 Copilot 對話框', 'success');
    dom.copilotFrame?.focus();
    return;
  }

  openScreenshotInTab(dataUrl);
  showToast('已開啟截圖，請拖曳到 Copilot 對話框', 'warning');
}

// ============================================
// Memory -> Copilot Prompt Injection
// ============================================

function listAllMemoryEntries() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'memory.list', filter: {} }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (!response?.success) {
        reject(new Error(response?.error || 'Failed to load memory entries'));
        return;
      }

      resolve(Array.isArray(response.entries) ? response.entries : []);
    });
  });
}

function loadRulesContent() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'rules.load' }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (!response?.success) {
        reject(new Error(response?.error || 'Failed to load rules'));
        return;
      }

      resolve(typeof response.content === 'string' ? response.content : '');
    });
  });
}

function extractPromptTerms(input) {
  if (!input || typeof input !== 'string') {
    return [];
  }

  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'that', 'this', 'from', 'your', 'have', 'what',
    'please', 'help', 'about', 'into', 'just', 'make', 'show', 'need', 'want',
    'how', 'can', 'could', 'should', 'would', 'where', 'when', 'why', 'who',
    'is', 'are', 'to', 'of', 'in', 'on', 'at', 'it', 'we', 'you', 'a', 'an'
  ]);

  const matches = input.toLowerCase().match(/[\p{Script=Han}]{2,}|[a-z0-9_]{2,}/gu) || [];
  const uniqueTerms = [];
  const seen = new Set();

  for (const token of matches) {
    if (stopWords.has(token)) continue;
    if (seen.has(token)) continue;
    seen.add(token);
    uniqueTerms.push(token);
  }

  return uniqueTerms.slice(0, 20);
}

function normalizeMemoryEntries(entries) {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .filter(entry => entry && typeof entry === 'object')
    .map(entry => ({
      id: entry.id,
      type: entry.type || 'note',
      title: typeof entry.title === 'string' ? entry.title.trim() : '',
      content: typeof entry.content === 'string' ? entry.content.trim() : '',
      status: entry.status,
      updatedAt: Number(entry.updatedAt) || Number(entry.createdAt) || 0
    }))
    .filter(entry => entry.title || entry.content);
}

function scoreMemoryEntry(entry, lowerInput, terms) {
  const haystack = `${entry.title}\n${entry.content}`.toLowerCase();
  let score = MEMORY_TYPE_WEIGHT[entry.type] || 0;

  if (entry.type === 'task') {
    if (entry.status === 'in_progress') score += 2;
    if (entry.status === 'pending') score += 1;
  }

  if (lowerInput && haystack.includes(lowerInput)) {
    score += 4;
  }

  for (const term of terms) {
    if (!haystack.includes(term)) continue;
    const containsHan = /[\p{Script=Han}]/u.test(term);
    score += containsHan ? 3 : (term.length >= 4 ? 3 : 2);
  }

  if (entry.updatedAt > 0) {
    const ageHours = (Date.now() - entry.updatedAt) / 3600000;
    if (ageHours <= 24) score += 2;
    else if (ageHours <= 24 * 7) score += 1;
  }

  return score;
}

function pickMemoryEntriesForPrompt(entries, userInput) {
  const normalized = normalizeMemoryEntries(entries);
  if (!normalized.length) {
    return [];
  }

  const terms = extractPromptTerms(userInput);
  const lowerInput = (userInput || '').trim().toLowerCase();

  const scored = normalized.map(entry => ({
    ...entry,
    _score: scoreMemoryEntry(entry, lowerInput, terms)
  }));

  scored.sort((a, b) => {
    if (b._score !== a._score) return b._score - a._score;
    return b.updatedAt - a.updatedAt;
  });

  let selected = scored.filter(entry => entry._score >= 3);
  if (!selected.length) {
    selected = scored.filter(entry => entry.type === 'context' || entry.type === 'reference');
  }
  if (!selected.length) {
    selected = scored;
  }

  return selected
    .slice(0, MEMORY_PROMPT_MAX_ENTRIES)
    .map(({ _score, ...entry }) => entry);
}

function truncateForPrompt(text, maxLength) {
  if (typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, Math.max(0, maxLength - 3)) + '...';
}

function formatMemoryEntryForPrompt(entry) {
  const title = truncateForPrompt(entry.title || '(Untitled)', 120);
  const compactContent = entry.content.replace(/\s+/g, ' ').trim();
  return {
    id: entry.id,
    type: entry.type,
    status: entry.status || null,
    title,
    content: truncateForPrompt(compactContent, MEMORY_PROMPT_MAX_ENTRY_CONTENT)
  };
}

function buildMemoryInjectedPrompt(userInput, memoryEntries, rulesContent = '') {
  const selectedEntries = pickMemoryEntriesForPrompt(memoryEntries, userInput);

  let usedMemoryLength = 0;
  const memoryPacket = [];

  for (const entry of selectedEntries) {
    const memoryObject = formatMemoryEntryForPrompt(entry);
    const objectLength = JSON.stringify(memoryObject).length;
    if (usedMemoryLength + objectLength > MEMORY_PROMPT_MAX_TOTAL_LENGTH) {
      break;
    }

    memoryPacket.push(memoryObject);
    usedMemoryLength += objectLength;
  }

  const normalizedRules = truncateForPrompt((rulesContent || '').trim(), RULES_PROMPT_MAX_LENGTH);
  const rulesInjected = normalizedRules.length > 0;

  const packet = {
    schema: SIDEPILOT_PACKET_SCHEMA,
    context: {
      rules: rulesInjected ? normalizedRules : null,
      memory: memoryPacket
    },
    user_message: userInput,
    output_contract: {
      schema: SIDEPILOT_SANDBOX_SCHEMA,
      packet_tag: 'sidepilot_packet',
      response_tag: 'assistant_response'
    },
    instructions: [
      'Use memory and rules only when relevant.',
      'If context conflicts with the latest user message, prioritize the latest user message.',
      'In sidepilot_packet.used_memory_ids, include only ids you actually used.',
      'Do not reveal chain-of-thought.'
    ]
  };

  const lines = [
    '[[SIDEPILOT_TURN_PACKET]]',
    JSON.stringify(packet, null, 2),
    '[[END_SIDEPILOT_TURN_PACKET]]'
  ];

  return {
    prompt: lines.join('\n'),
    injectedCount: memoryPacket.length,
    rulesInjected
  };
}

function updateSDKMemorySummary(text) {
  if (!dom.sdkMemorySummary) return;
  dom.sdkMemorySummary.textContent = text;
}

function truncateText(text, maxLength) {
  const value = String(text || '');
  if (value.length <= maxLength) return value;
  return value.slice(0, Math.max(0, maxLength - 1)) + '…';
}

function toFileUrl(path) {
  const normalized = String(path || '').replace(/\\/g, '/');
  return `file:///${encodeURI(normalized)}`;
}

function getConversationStorageLocation() {
  if (state.detectedMode === 'sdk') {
    const path = normalizeSessionStatePath(state.settings?.sdkSessionStatePath);
    return {
      label: '本機對話階段',
      display: path,
      url: toFileUrl(path)
    };
  }

  return {
    label: 'GitHub Copilot',
    display: COPILOT_HOME_URL,
    url: COPILOT_HOME_URL
  };
}

function updateSDKStorageLocationDisplay() {
  if (!dom.sdkStorageLocation || !dom.sdkStorageLink) return;

  const enabled = state.settings.sdkShowStorageLocation === true;
  dom.sdkStorageLocation.classList.toggle('hidden', !enabled);
  if (!enabled) return;

  const location = getConversationStorageLocation();
  const displayText = truncateText(location.display || location.url, 42);
  dom.sdkStorageLink.textContent = displayText;
  dom.sdkStorageLink.href = location.url;
  dom.sdkStorageLink.title = location.url;
}

function refreshSDKMemorySummary() {
  const includeMemory = state.settings.sdkIncludeMemory !== false;
  const includeRules = state.settings.sdkIncludeRules !== false;
  if (!includeMemory && !includeRules) {
    updateSDKMemorySummary('Memory/rules injection: off');
    return;
  }
  const memText = includeMemory ? 'mem on' : 'mem off';
  const rulesText = includeRules ? 'rules on' : 'rules off';
  updateSDKMemorySummary(`Memory/rules injection: ${memText}, ${rulesText}`);
}

function applySDKAssistantOnlyMode() {
  const enabled = isAssistantOnlyTags(state.settings?.sdkDisplayTags);

  if (dom.sdkMessages) {
    dom.sdkMessages.classList.toggle('assistant-only', enabled);
  }
}

// ============================================
// 複製功能
// ============================================

async function copyAllContent() {
  if (!state.currentPageContent) {
    showToast('沒有可複製的內容', 'error');
    return;
  }

  const markdown = formatAsMarkdown(state.currentPageContent);
  await copyToClipboard(markdown, '文字摘要已複製，可貼到 Copilot 對話中');
}

function buildPlainText(content) {
  if (!content) return '';
  if (content.text) return String(content.text).trim();
  if (Array.isArray(content.paragraphs) && content.paragraphs.length) {
    return content.paragraphs.join('\n\n').trim();
  }
  return '';
}

async function outputTextToChat() {
  if (!state.currentPageContent) {
    showToast('沒有可輸出的內容', 'error');
    return;
  }

  const text = buildPlainText(state.currentPageContent);
  if (!text) {
    showToast('沒有可輸出的文字內容', 'error');
    return;
  }

  if (state.detectedMode === 'sdk') {
    if (dom.sdkInput) {
      dom.sdkInput.value = text;
      dom.sdkInput.focus();
      showToast('文字已輸出到 SDK 對話輸入框');
      return;
    }
  }

  const copied = await copyToClipboard(text, '文字已複製，請貼到 Copilot 對話框');
  if (copied) {
    dom.copilotFrame?.focus();
  }
}

async function copyStructuredContent() {
  if (!state.currentPageContent) {
    showToast('沒有可複製的內容', 'error');
    return;
  }

  const structured = formatAsStructured(state.currentPageContent);
  await copyToClipboard(structured, '結構化資料已複製');
}

function formatAsMarkdown(content) {
  const lines = [];

  lines.push('# 頁面內容摘要');
  lines.push('');

  if (content.title) {
    lines.push(`**標題:** ${content.title}`);
  }
  if (content.url) {
    lines.push(`**網址:** ${content.url}`);
  }
  const description = content.meta?.description || content.meta?.['og:description'];
  if (description) {
    lines.push(`**描述:** ${description}`);
  }
  lines.push('');

  if (content.headings?.length > 0) {
    lines.push('## 頁面結構');
    content.headings.forEach(h => {
      const indent = '  '.repeat(parseInt(h.level.charAt(1)) - 1);
      lines.push(`${indent}- ${h.text}`);
    });
    lines.push('');
  }

  if (content.codeBlocks?.length > 0) {
    lines.push('## 程式碼區塊');
    content.codeBlocks.forEach((block, i) => {
      const code = typeof block === 'string' ? block : block.code;
      const lang = typeof block === 'object' ? block.language : '';
      lines.push(`\n### 程式碼 ${i + 1}`);
      lines.push('```' + lang);
      lines.push(code);
      lines.push('```');
    });
    lines.push('');
  }

  if (content.paragraphs?.length > 0) {
    lines.push('## 主要內容');
    lines.push(content.paragraphs.join('\n\n').substring(0, 5000));
  } else if (content.text) {
    lines.push('## 主要內容');
    lines.push(content.text.substring(0, 5000));
  }

  return lines.join('\n');
}

function formatAsStructured(content) {
  const payload = {
    title: content.title || '',
    url: content.url || '',
    meta: content.meta || {},
    headings: content.headings || [],
    paragraphs: content.paragraphs || [],
    codeBlocks: content.codeBlocks || [],
    wordCount: content.wordCount || 0,
    charCount: content.charCount || 0
  };
  return JSON.stringify(payload, null, 2);
}

async function copyToClipboard(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage || '已複製');
    return true;
  } catch (err) {
    showToast('複製失敗: ' + err.message, 'error');
    return false;
  }
}

// ============================================
// 背景訊息處理
// ============================================

function handleBackgroundMessage(message, sender, sendResponse) {
  if (message.action === 'tabUpdated' || message.action === 'tabActivated') {
    updatePageInfo(message.title, message.url);

    // 如果擷取面板開啟中，重新載入內容
    if (state.isCapturePanelOpen) {
      loadPageContent();
    }
    return;
  }

  if (message.action === 'externalLinkRedirected') {
    showToast('連結超出 Sidecar 範圍，已改為新分頁開啟', 'warning');
    return;
  }
}

// ============================================
// Toast 通知
// ============================================

function showToast(message, type = 'success') {
  if (!dom.toast) return;

  dom.toast.textContent = message;
  dom.toast.className = 'toast visible' + (type !== 'success' ? ` ${type}` : '');

  setTimeout(() => {
    dom.toast.classList.remove('visible');
  }, 3000);
}

// ============================================
// 工具函數
// ============================================

function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeAttr(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function detectContentFormat(rawContent) {
  const raw = typeof rawContent === 'string' ? rawContent : '';
  const trimmed = raw.trim();
  if (!trimmed) {
    return { type: 'text', label: 'text', text: '' };
  }

  const jsonCandidate = tryParseJson(trimmed);
  if (jsonCandidate.parsed) {
    return {
      type: 'json',
      label: 'json',
      text: JSON.stringify(jsonCandidate.value, null, 2)
    };
  }

  if (looksLikeYaml(trimmed)) {
    return { type: 'yaml', label: 'yaml', text: raw };
  }

  if (looksLikeMarkdown(trimmed)) {
    return { type: 'markdown', label: 'markdown', html: renderMarkdownToHtml(raw) };
  }

  return { type: 'text', label: 'text', text: raw };
}

function tryParseJson(text) {
  if (!text) return { parsed: false, value: null };
  const starts = text[0];
  if (starts !== '{' && starts !== '[') {
    return { parsed: false, value: null };
  }
  try {
    const value = JSON.parse(text);
    return { parsed: true, value };
  } catch {
    return { parsed: false, value: null };
  }
}

function looksLikeYaml(text) {
  if (!text) return false;
  if (text.startsWith('{') || text.startsWith('[')) return false;
  const yamlKeyValue = /^\s*[A-Za-z0-9_-]+:\s+.+/m;
  const hasIndentList = /^\s*-\s+.+/m.test(text);
  return yamlKeyValue.test(text) || hasIndentList;
}

function looksLikeMarkdown(text) {
  if (!text) return false;
  if (/^#{1,6}\s+/m.test(text)) return true;
  if (/^\s*[-*+]\s+/m.test(text)) return true;
  if (/`{3,}/.test(text)) return true;
  if (/\*\*.+\*\*/.test(text)) return true;
  if (/\[[^\]]+\]\([^)]+\)/.test(text)) return true;
  return false;
}

function renderMarkdownToHtml(input) {
  const source = String(input || '').replace(/\r\n/g, '\n');
  const segments = [];
  let lastIndex = 0;
  const fencePattern = /```([^\n]*)\n([\s\S]*?)```/g;
  let match;

  while ((match = fencePattern.exec(source)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: source.slice(lastIndex, match.index) });
    }
    segments.push({
      type: 'code',
      lang: (match[1] || '').trim(),
      content: match[2] || ''
    });
    lastIndex = fencePattern.lastIndex;
  }

  if (lastIndex < source.length) {
    segments.push({ type: 'text', content: source.slice(lastIndex) });
  }

  const htmlParts = segments.map((segment) => {
    if (segment.type === 'code') {
      const code = escapeHtml(segment.content);
      const langClass = segment.lang ? ` class="language-${escapeAttr(segment.lang)}"` : '';
      return `<pre><code${langClass}>${code}</code></pre>`;
    }
    return renderMarkdownText(segment.content || '');
  });

  return htmlParts.join('');
}

function renderMarkdownText(text) {
  const lines = String(text || '').split('\n');
  const html = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      html.push('</ul>');
      inList = false;
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    const headingMatch = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (headingMatch) {
      closeList();
      const level = headingMatch[1].length;
      const content = renderMarkdownInline(headingMatch[2]);
      html.push(`<h${level}>${content}</h${level}>`);
      return;
    }

    if (/^[-*+]\s+/.test(trimmed)) {
      const itemText = trimmed.replace(/^[-*+]\s+/, '');
      if (!inList) {
        html.push('<ul>');
        inList = true;
      }
      html.push(`<li>${renderMarkdownInline(itemText)}</li>`);
      return;
    }

    if (!trimmed) {
      closeList();
      return;
    }

    closeList();
    html.push(`<p>${renderMarkdownInline(trimmed)}</p>`);
  });

  closeList();
  return html.join('');
}

function renderMarkdownInline(text) {
  let output = escapeHtml(text);
  output = output.replace(/`([^`]+)`/g, (_match, code) => `<code>${code}</code>`);
  output = output.replace(/\*\*([^*]+)\*\*/g, (_match, bold) => `<strong>${bold}</strong>`);
  output = output.replace(/\*([^*]+)\*/g, (_match, italic) => `<em>${italic}</em>`);
  output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });
  return output;
}

function parseSDKSandboxResponse(rawContent) {
  const content = typeof rawContent === 'string' ? rawContent : '';
  const blocks = [];
  const packetObjects = [];
  const tagPattern = /<(sidepilot_packet|assistant_response)>([\s\S]*?)<\/\1>/gi;

  let lastIndex = 0;
  let match;

  while ((match = tagPattern.exec(content)) !== null) {
    const prefix = content.slice(lastIndex, match.index).trim();
    if (prefix) {
      blocks.push({
        type: 'raw',
        label: 'raw_output',
        content: prefix,
        parsed: null
      });
    }

    const tag = match[1].toLowerCase();
    const inner = (match[2] || '').trim();

    if (tag === 'sidepilot_packet') {
      let parsedPacket = null;
      try {
        parsedPacket = JSON.parse(inner);
        packetObjects.push(parsedPacket);
      } catch {
        parsedPacket = null;
      }

      blocks.push({
        type: 'packet',
        label: 'sidepilot_packet',
        content: inner,
        parsed: parsedPacket
      });
    } else {
      blocks.push({
        type: 'assistant',
        label: 'assistant_response',
        content: inner,
        parsed: null
      });
    }

    lastIndex = tagPattern.lastIndex;
  }

  const suffix = content.slice(lastIndex).trim();
  if (suffix) {
    blocks.push({
      type: 'raw',
      label: 'raw_output',
      content: suffix,
      parsed: null
    });
  }

  if (blocks.length === 0) {
    blocks.push({
      type: 'raw',
      label: 'raw_output',
      content,
      parsed: null
    });
  }

  return {
    rawContent: content,
    blocks,
    packetObjects,
    hasAssistantBlock: blocks.some(block => block.type === 'assistant'),
    hasPacketBlock: blocks.some(block => block.type === 'packet')
  };
}

function getSdkDisplayTags() {
  const tags = normalizeSdkDisplayTags(state.settings?.sdkDisplayTags);
  return tags;
}

function addSDKStructuredAssistantMessage(parsedResponse) {
  if (!dom.sdkMessages) return;

  const parsed = parsedResponse?.blocks
    ? parsedResponse
    : parseSDKSandboxResponse(parsedResponse);

  const displayTags = getSdkDisplayTags();
  const visibleBlocks = parsed.blocks.filter((block) => {
    if (block.type === 'assistant') return displayTags.assistant;
    if (block.type === 'packet') return displayTags.packet;
    if (block.type === 'raw') return displayTags.raw;
    return false;
  });

  if (visibleBlocks.length === 0) {
    addSDKMessage('assistant', '（此回覆已被標籤設定隱藏）');
    return;
  }

  const msgEl = document.createElement('div');
  msgEl.className = 'sdk-message assistant';

  const contentEl = document.createElement('div');
  contentEl.className = 'sdk-message-content sdk-structured-content';

  visibleBlocks.forEach((block) => {
    let format = null;
    if (block.type === 'packet') {
      const packetValue = block.parsed && typeof block.parsed === 'object'
        ? JSON.stringify(block.parsed, null, 2)
        : (block.content || '');
      format = { type: 'json', label: 'json', text: packetValue };
    } else {
      format = detectContentFormat(block.content || '');
    }

    const blockEl = document.createElement('section');
    blockEl.className = `sdk-structured-block ${block.type} format-${format.type}`;

    const headerEl = document.createElement('div');
    headerEl.className = 'sdk-structured-block-header';
    headerEl.textContent = format?.label ? `${block.label} · ${format.label}` : block.label;

    const isMarkdown = format.type === 'markdown';
    const bodyEl = document.createElement(isMarkdown ? 'div' : 'pre');
    bodyEl.className = 'sdk-structured-block-body';

    if (isMarkdown) {
      bodyEl.classList.add('markdown');
      bodyEl.innerHTML = format.html || '';
    } else {
      bodyEl.textContent = (format.text || '').trim() || '(empty)';
    }

    blockEl.appendChild(headerEl);
    blockEl.appendChild(bodyEl);
    contentEl.appendChild(blockEl);
  });

  const timeEl = document.createElement('div');
  timeEl.className = 'sdk-message-time';
  const time = new Date();
  timeEl.textContent = time.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });

  msgEl.appendChild(contentEl);
  msgEl.appendChild(timeEl);
  dom.sdkMessages.appendChild(msgEl);
  dom.sdkMessages.scrollTop = dom.sdkMessages.scrollHeight;
}

// ============================================
// SDK Chat Helpers
// ============================================

function addSDKMessage(role, content) {
  if (!dom.sdkMessages) return;
  
  const msgEl = document.createElement('div');
  msgEl.className = `sdk-message ${role}`;
  
  const contentEl = document.createElement('div');
  contentEl.className = 'sdk-message-content';
  contentEl.textContent = content;
  
  const timeEl = document.createElement('div');
  timeEl.className = 'sdk-message-time';
  const time = new Date();
  timeEl.textContent = time.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
  
  msgEl.appendChild(contentEl);
  msgEl.appendChild(timeEl);
  dom.sdkMessages.appendChild(msgEl);
  
  dom.sdkMessages.scrollTop = dom.sdkMessages.scrollHeight;
}

function addSDKTypingIndicator() {
  if (!dom.sdkMessages) return null;
  
  const id = `typing-${Date.now()}`;
  const msgEl = document.createElement('div');
  msgEl.className = 'sdk-message assistant loading';
  msgEl.id = id;
  
  const indicator = document.createElement('div');
  indicator.className = 'sdk-typing-indicator';
  indicator.innerHTML = '<span></span><span></span><span></span>';
  
  const contentEl = document.createElement('div');
  contentEl.className = 'sdk-message-content';
  contentEl.appendChild(indicator);
  
  msgEl.appendChild(contentEl);
  dom.sdkMessages.appendChild(msgEl);
  
  dom.sdkMessages.scrollTop = dom.sdkMessages.scrollHeight;
  return id;
}

function removeSDKTypingIndicator(id) {
  if (!id) return;
  const el = document.getElementById(id);
  if (el) el.remove();
}

// ============================================
// 啟動
// ============================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
