"use strict";

// ============================================
// 常數與狀態
// ============================================

const STORAGE_KEY = "copilot_sidepanel_welcomed";
const STORAGE_KEY_DECLINED = "copilot_sidepanel_declined";
const STORAGE_KEY_SDK_ASSISTANT_ONLY = "sidepilot_sdk_assistant_only";
const STORAGE_KEY_SDK_MODEL = "sidepilot_sdk_model";
const STORAGE_KEY_SDK_LOGIN_GUIDE_SHOWN = "sidepilot_sdk_login_guide_shown";
const STORAGE_KEY_SDK_INPUT_CONTAINER_HEIGHT =
  "sidepilot_sdk_input_container_height";
const FRAME_LOAD_TIMEOUT = 15000;
const MEMORY_PROMPT_MAX_ENTRIES = 5;
const MEMORY_PROMPT_MAX_TOTAL_LENGTH = 3600;
const MEMORY_PROMPT_MAX_ENTRY_CONTENT = 700;
const RULES_PROMPT_MAX_LENGTH = 2200;
const SETTINGS_STORAGE_KEY = "sidepilot.settings.v1";
const SDK_LOGIN_URL =
  "https://github.com/login?return_to=https%3A%2F%2Fgithub.com%2Fcopilot";
const SDK_BRIDGE_PORT = 31031;
const COPILOT_HOME_URL = "https://github.com/copilot";
const DEFAULT_CAPTURE_BUTTON_WIDTH = 42;
const DEFAULT_CAPTURE_BUTTON_TOP_PERCENT = 38;
const DISPLAY_SCALE_MIN_PERCENT = 85;
const DISPLAY_SCALE_MAX_PERCENT = 120;
const DISPLAY_SCALE_STEP_PERCENT = 5;
const DEFAULT_DISPLAY_SCALE_PERCENT = 100;
const ANTIGRAVITY_DEFAULT_BASE_URL = "http://127.0.0.1:47619";
const BRIDGE_WORKDIR_HINT =
  "C:\\Projects\\SidePilot\\scripts\\copilot-bridge";
const BRIDGE_WORKDIR_HINT_WSL =
  "/path/to/SidePilot/scripts/copilot-bridge";
const BRIDGE_WSL_DISTRO_HINT = "Ubuntu";
const SIDEPILOT_PACKET_SCHEMA = "sidepilot.turn-packet.v1";
const SIDEPILOT_SANDBOX_SCHEMA = "sidepilot.sandbox.v1";
const LOG_STORAGE_KEY = "sidepilot.logs.v1";
const LOG_MAX_ENTRIES = 300;
const MANIFEST_SEAL_PATTERN = /^(\d+\.\d+\.\d+)\+([0-9a-f]{8})$/i;
const SDK_INPUT_CONTAINER_MIN_HEIGHT = 120;
const SDK_INPUT_CONTAINER_DEFAULT_SCALE = 1.5;
const SDK_INPUT_CONTAINER_FALLBACK_MAX_HEIGHT = 460;
const UI_LANGUAGE_ZH_TW = "zh-TW";
const UI_LANGUAGE_EN = "en";
const UI_LANGUAGE_FALLBACK = UI_LANGUAGE_ZH_TW;
const BRIDGE_AUTO_START_PROTOCOL_BASE = "sidepilot://start-bridge";
const BRIDGE_AUTO_START_TIMEOUT_MS = 45000;
const BRIDGE_AUTO_START_POLL_INTERVAL_MS = 1000;
const BRIDGE_AUTO_START_DEFAULT_COOLDOWN_MS = 60000;
const BRIDGE_AUTO_START_COOLDOWN_MIN_MS = 5000;
const BRIDGE_AUTO_START_COOLDOWN_MAX_MS = 300000;
const SETTINGS_MAX_OPEN_SECTIONS = 3;
const IFRAME_RISK_DOC_URLS = {
  [UI_LANGUAGE_ZH_TW]:
    "https://github.com/pingqLIN/SidePilot/blob/main/docs/USAGE.zh-TW.md#-iframe-模式",
  [UI_LANGUAGE_EN]:
    "https://github.com/pingqLIN/SidePilot/blob/main/docs/USAGE.md#-iframe-mode",
};
// Settings-page i18n scaffold (phase-1): key-based now, full coverage later.
const SETTINGS_I18N = {
  [UI_LANGUAGE_ZH_TW]: {
    "settings.section.language": "語言",
    "settings.language.title": "介面語言",
    "settings.language.desc": "僅影響設定分頁顯示文字（i18n 後續擴充）",
    "settings.language.option.zh-TW": "繁體中文",
    "settings.language.option.en": "English",
    "settings.displayScale.title": "顯示字級",
    "settings.displayScale.desc":
      "放大或縮小整體顯示比例，會同步影響文字與控制項尺寸",
    "settings.section.install": "Bridge 設定",
    "settings.section.providers": "Provider Probe",
    "settings.bridge.status.title": "Bridge 狀態",
    "settings.bridge.card.title": "SDK Bridge Setup",
    "settings.bridge.card.desc":
      "SDK 模式需要本機 Bridge 服務與 sidepilot:// 啟動器",
    "settings.bridge.autostart.title": "自動啟動 Bridge（MVP）",
    "settings.bridge.autostart.desc":
      "進入 SDK 模式時，若偵測不到 Bridge，會嘗試喚起 sidepilot:// 啟動器",
    "settings.bridge.primary.start": "嘗試自動啟動 Bridge",
    "settings.bridge.primary.retry": "重試自動啟動",
    "settings.bridge.primary.install": "複製 Quick Setup 指令",
    "settings.bridge.primary.ready": "Bridge 已就緒",
    "settings.bridge.primary.starting": "Bridge 啟動中...",
    "settings.bridge.root.title": "SidePilot Repo Root",
    "settings.bridge.advanced.show": "顯示進階選項",
    "settings.bridge.advanced.hide": "隱藏進階選項",
    "settings.bridge.advanced.runtime": "手動指令 Runtime",
    "settings.bridge.advanced.wslDistro": "WSL Distro（選填）",
    "settings.bridge.advanced.wslDistroDesc":
      "僅供 WSL Quick Setup 與 sidepilot:// 自動啟動使用；留空時使用預設 distro。",
    "settings.bridge.advanced.install": "Quick Setup 指令",
    "settings.bridge.advanced.manual": "手動啟動指令",
    "settings.bridge.advanced.lastError": "上次自動啟動結果",
    "settings.bridge.advanced.diagnostics": "啟動診斷",
    "settings.bridge.advanced.diagnosticsDesc":
      "根據目前 runtime、repo root、WSL 設定與最近一次 probe/launcher 結果推斷。",
    "settings.bridge.runtime.auto": "自動",
    "settings.bridge.runtime.windows": "Windows",
    "settings.bridge.runtime.wsl": "WSL",
    "settings.bridge.actions.check": "重新檢查",
    "settings.bridge.actions.copyInstall": "複製 Quick Setup",
    "settings.bridge.actions.copyStart": "複製啟動指令",
    "settings.bridge.actions.copyHealth": "複製檢查指令",
    "settings.bridge.step.launch": "0. 啟動 Bridge",
    "settings.bridge.step.check": "1. 檢查狀態",
    "settings.bridge.step.copyStart": "2. 複製啟動指令",
    "settings.bridge.step.verify": "3. 驗證連線",
    "settings.antigravity.status.title": "Antigravity Provider Probe",
    "settings.antigravity.baseUrl.title": "Base URL",
    "settings.antigravity.baseUrl.desc":
      "指向 Antigravity Chat Standalone 的本機 bridge，例如 http://127.0.0.1:47619",
    "settings.antigravity.baseUrl.placeholder": "http://127.0.0.1:47619",
    "settings.antigravity.token.title": "Bridge Token",
    "settings.antigravity.token.desc":
      "選填；要讀取 /v1/meta 與 /v1/detect 時需要 Bearer token",
    "settings.antigravity.token.placeholder":
      "貼上 Antigravity bridge token",
    "settings.antigravity.actions.health": "檢查 Health",
    "settings.antigravity.actions.meta": "讀取 Meta",
    "settings.antigravity.actions.detect": "自動偵測",
    "settings.section.startup": "啟動畫面",
    "settings.startup.playIntro.title": "每次開啟都播放動畫",
    "settings.startup.playIntro.desc": "關閉後只在首次開啟播放 Intro 影片",
    "settings.startup.showWarning.title": "顯示風險提示視窗",
    "settings.startup.showWarning.desc": "每次開啟顯示歡迎與風險聲明",
    "settings.section.sdk": "SDK 模式",
    "settings.sdk.autoLogin.title": "首次切換 SDK 自動帶出登入引導",
    "settings.sdk.autoLogin.desc": "第一次點選 SDK 時自動跳出登入提示",
    "settings.selfIteration.title": "啟用自我疊代開發保護",
    "settings.selfIteration.desc":
      "僅在啟用後套用 BASW 啟動檢測；第一次啟用會自動執行一次 SEAL",
    "settings.selfIteration.detail.disabled":
      "功能未啟用；開啟後才會套用啟動鎖與封印檢測",
    "settings.sdk.actions.openLogin": "立即開啟 GitHub 登入頁",
    "settings.sdk.actions.testBridge": "測試 Bridge 連線",
    "settings.sdk.subsection.api": "API 端點",
    "settings.sdk.endpoint.strategy.title": "Chat Endpoint 策略",
    "settings.sdk.endpoint.strategy.desc":
      "優先使用 <code>/api/chat/sync</code>，若回傳 404 則自動 fallback 到 <code>/api/chat</code>（SSE 串流，向後相容）",
    "settings.sdk.subsection.conversation": "對話格式",
    "settings.sdk.subsection.prompt": "Prompt 策略",
    "settings.sdk.prompt.concise.title": "輸出精簡模式",
    "settings.sdk.prompt.concise.desc": "控制 AI 回覆的詳細程度",
    "settings.section.iframe": "iframe 模式",
    "settings.iframe.enabled.title": "啟用 iframe 模式",
    "settings.iframe.enabled.desc":
      "iframe 模式會移除 GitHub 的安全標頭（X-Frame-Options / CSP）以嵌入頁面，屬 ToS 灰色地帶，需手動開啟。",
    "settings.iframe.enabled.helpLabel": "顯示 iframe 模式高風險說明",
    "settings.iframe.enabled.learnMore": "開啟說明",
    "settings.iframe.enabled.tooltipTitle": "為什麼這是高風險功能？",
    "settings.iframe.enabled.tooltipBody":
      "iframe 模式會主動移除 GitHub 的 X-Frame-Options 與 CSP 回應標頭，讓 github.com/copilot 可以嵌入側邊欄。這不是 GitHub 官方支援的整合方式，屬於 ToS 灰色地帶；若你需要穩定、低風險的工作流，建議改用 SDK 模式。",
    "settings.iframe.mode.title": "Link Guard 模式",
    "settings.iframe.mode.desc":
      "allow = 僅匹配 URL 留在 Sidecar；deny = 匹配 URL 改在新分頁開啟",
    "settings.iframe.mode.allow": "Allowlist（白名單）",
    "settings.iframe.mode.deny": "Denylist（黑名單）",
    "settings.iframe.allowlist.title": "允許留在 Sidecar 的連結前綴",
    "settings.iframe.allowlist.desc": "每行一個 URL 前綴，支援結尾萬用字元 `*`",
    "settings.iframe.allowlist.placeholder":
      "https://github.com/copilot/*\nhttps://github.com/settings/copilot*",
    "settings.section.capture": "擷取按鍵",
    "settings.capture.width.title": "按鍵寬度",
    "settings.capture.position.title": "上下位置",
    "settings.section.history": "對話紀錄",
    "settings.history.sdk": "SDK 模式",
    "settings.history.sdk.path.title": "聊天紀錄儲存路徑",
    "settings.history.sdk.path.desc": "Bridge 將對話記錄存放於此資料夾",
    "settings.history.iframe": "iframe 模式",
    "settings.history.iframe.url.title": "顯示網頁位置",
    "settings.history.iframe.url.desc": "iframe 模式下預設頁面 URL",
    "settings.section.identity": "📌 擴充自述 (System Identity)",
    "settings.identity.modules.desc":
      "點擊模塊標籤快速插入系統變數，儲存時自動替換為實際值",
    "settings.identity.save": "💾 儲存",
    "settings.identity.reset": "↩️ 還原預設",
    "settings.identity.preview": "<strong>已解析預覽：</strong>",
    "settings.seal.badge.unsealed": "未封印",
    "settings.seal.badge.sealed": "已封印",
    "settings.seal.detail.disabled":
      "功能未啟用；開啟後才會套用啟動鎖與封印檢測",
    "settings.seal.detail.enabledNotSealed": "啟用中，但尚未完成有效封印",
    "settings.seal.detail.valid": "封印格式有效",
    "settings.seal.label.digest": "Digest",
    "settings.seal.label.time": "時間",
    "settings.seal.lastError.enabled": "上次失敗原因：",
    "settings.seal.lastError.disabled": "目前未啟用；上次失敗原因：",
    "settings.seal.manifest.withVersion": "manifest.version_name = {version}",
    "settings.seal.manifest.withoutVersion": "manifest.version_name 未設定",
  },
  [UI_LANGUAGE_EN]: {
    "settings.section.language": "Language",
    "settings.language.title": "UI Language",
    "settings.language.desc":
      "Currently affects text in Settings tab only (i18n expansion planned).",
    "settings.language.option.zh-TW": "Chinese (Traditional)",
    "settings.language.option.en": "English",
    "settings.displayScale.title": "Display Scale",
    "settings.displayScale.desc":
      "Zoom the overall interface so text and controls scale together.",
    "settings.section.install": "Bridge Setup",
    "settings.section.providers": "Provider Probe",
    "settings.bridge.status.title": "Bridge Status",
    "settings.bridge.card.title": "SDK Bridge Setup",
    "settings.bridge.card.desc":
      "SDK mode requires a local bridge service and the sidepilot:// launcher.",
    "settings.bridge.autostart.title": "Auto-start Bridge (MVP)",
    "settings.bridge.autostart.desc":
      "When entering SDK mode, if Bridge is unavailable, SidePilot will try to invoke sidepilot:// launcher.",
    "settings.bridge.primary.start": "Try Auto-start Bridge",
    "settings.bridge.primary.retry": "Retry Auto-start",
    "settings.bridge.primary.install": "Copy Quick Setup Command",
    "settings.bridge.primary.ready": "Bridge Ready",
    "settings.bridge.primary.starting": "Bridge Starting...",
    "settings.bridge.root.title": "SidePilot Repo Root",
    "settings.bridge.advanced.show": "Show Advanced",
    "settings.bridge.advanced.hide": "Hide Advanced",
    "settings.bridge.advanced.runtime": "Manual Command Runtime",
    "settings.bridge.advanced.wslDistro": "WSL Distro (Optional)",
    "settings.bridge.advanced.wslDistroDesc":
      "Used only by WSL Quick Setup and sidepilot:// auto-start; leave empty to use the default distro.",
    "settings.bridge.advanced.install": "Quick Setup Command",
    "settings.bridge.advanced.manual": "Manual Start Command",
    "settings.bridge.advanced.lastError": "Last Auto-start Result",
    "settings.bridge.advanced.diagnostics": "Startup Diagnostics",
    "settings.bridge.advanced.diagnosticsDesc":
      "Derived from the current runtime, repo root, WSL settings, and the most recent probe/launcher result.",
    "settings.bridge.runtime.auto": "Auto",
    "settings.bridge.runtime.windows": "Windows",
    "settings.bridge.runtime.wsl": "WSL",
    "settings.bridge.actions.check": "Check Again",
    "settings.bridge.actions.copyInstall": "Copy Quick Setup",
    "settings.bridge.actions.copyStart": "Copy Start Command",
    "settings.bridge.actions.copyHealth": "Copy Health Check",
    "settings.bridge.step.launch": "0. Launch Bridge",
    "settings.bridge.step.check": "1. Check Status",
    "settings.bridge.step.copyStart": "2. Copy Start Command",
    "settings.bridge.step.verify": "3. Verify Connection",
    "settings.antigravity.status.title": "Antigravity Provider Probe",
    "settings.antigravity.baseUrl.title": "Base URL",
    "settings.antigravity.baseUrl.desc":
      "Points to the local Antigravity Chat Standalone bridge, for example http://127.0.0.1:47619",
    "settings.antigravity.baseUrl.placeholder": "http://127.0.0.1:47619",
    "settings.antigravity.token.title": "Bridge Token",
    "settings.antigravity.token.desc":
      "Optional; required for /v1/meta and /v1/detect via Bearer token",
    "settings.antigravity.token.placeholder":
      "Paste Antigravity bridge token",
    "settings.antigravity.actions.health": "Check Health",
    "settings.antigravity.actions.meta": "Read Meta",
    "settings.antigravity.actions.detect": "Auto Detect",
    "settings.section.startup": "Startup",
    "settings.startup.playIntro.title": "Play intro every time",
    "settings.startup.playIntro.desc":
      "If disabled, intro plays only on first launch.",
    "settings.startup.showWarning.title": "Show risk warning dialog",
    "settings.startup.showWarning.desc":
      "Show welcome and risk notice on each launch.",
    "settings.section.sdk": "SDK Mode",
    "settings.sdk.autoLogin.title": "Auto-show login guide on first SDK switch",
    "settings.sdk.autoLogin.desc":
      "When entering SDK mode first time, show login prompt automatically.",
    "settings.selfIteration.title": "Enable self-iteration development guard",
    "settings.selfIteration.desc":
      "Apply BASW startup checks only when enabled; first enable triggers one automatic SEAL run.",
    "settings.selfIteration.detail.disabled":
      "Feature is disabled; startup lock and seal checks apply only after enabling.",
    "settings.sdk.actions.openLogin": "Open GitHub Login Page",
    "settings.sdk.actions.testBridge": "Test Bridge Connection",
    "settings.sdk.subsection.api": "API Endpoints",
    "settings.sdk.endpoint.strategy.title": "Chat Endpoint Strategy",
    "settings.sdk.endpoint.strategy.desc":
      "Prefer <code>/api/chat/sync</code>; if 404, fallback to <code>/api/chat</code> (SSE stream, backward compatible).",
    "settings.sdk.subsection.conversation": "Conversation Format",
    "settings.sdk.subsection.prompt": "Prompt Strategy",
    "settings.sdk.prompt.concise.title": "Response Conciseness",
    "settings.sdk.prompt.concise.desc":
      "Controls how detailed AI responses should be.",
    "settings.section.iframe": "iframe Mode",
    "settings.iframe.enabled.title": "Enable iframe Mode",
    "settings.iframe.enabled.desc":
      "iframe mode removes GitHub security headers (X-Frame-Options / CSP) to embed the page. This is a gray area under the ToS and must be enabled manually.",
    "settings.iframe.enabled.helpLabel": "Show iframe mode risk details",
    "settings.iframe.enabled.learnMore": "Open docs",
    "settings.iframe.enabled.tooltipTitle": "Why is this considered high risk?",
    "settings.iframe.enabled.tooltipBody":
      "iframe mode actively strips GitHub's X-Frame-Options and CSP response headers so github.com/copilot can be embedded inside the side panel. This is not an officially supported GitHub integration path and sits in a Terms-of-Service gray area; if you want the lower-risk workflow, use SDK mode instead.",
    "settings.iframe.mode.title": "Link Guard Mode",
    "settings.iframe.mode.desc":
      "allow = only matching URLs stay in the sidecar; deny = matching URLs open in a new tab",
    "settings.iframe.mode.allow": "Allowlist",
    "settings.iframe.mode.deny": "Denylist",
    "settings.iframe.allowlist.title": "Allowed link prefixes inside Sidecar",
    "settings.iframe.allowlist.desc":
      "One URL prefix per line; supports trailing wildcard `*`.",
    "settings.iframe.allowlist.placeholder":
      "https://github.com/copilot/*\nhttps://github.com/settings/copilot*",
    "settings.section.capture": "Capture Button",
    "settings.capture.width.title": "Button Width",
    "settings.capture.position.title": "Vertical Position",
    "settings.section.history": "Conversation History",
    "settings.history.sdk": "SDK Mode",
    "settings.history.sdk.path.title": "Chat history path",
    "settings.history.sdk.path.desc":
      "Bridge stores conversation logs in this folder.",
    "settings.history.iframe": "iframe Mode",
    "settings.history.iframe.url.title": "Displayed page URL",
    "settings.history.iframe.url.desc": "Default page URL in iframe mode.",
    "settings.section.identity":
      "📌 System Identity (Extension Self-Description)",
    "settings.identity.modules.desc":
      "Click a module chip to insert a system variable token; it is resolved when saving.",
    "settings.identity.save": "💾 Save",
    "settings.identity.reset": "↩️ Reset Default",
    "settings.identity.preview": "<strong>Resolved Preview:</strong>",
    "settings.seal.badge.unsealed": "Unsealed",
    "settings.seal.badge.sealed": "Sealed",
    "settings.seal.detail.disabled":
      "Feature is disabled; startup lock and seal checks apply only after enabling.",
    "settings.seal.detail.enabledNotSealed":
      "Enabled, but valid seal has not been completed yet.",
    "settings.seal.detail.valid": "Seal format is valid.",
    "settings.seal.label.digest": "Digest",
    "settings.seal.label.time": "Time",
    "settings.seal.lastError.enabled": "Last failure reason: ",
    "settings.seal.lastError.disabled":
      "Currently disabled; last failure reason: ",
    "settings.seal.manifest.withVersion": "manifest.version_name = {version}",
    "settings.seal.manifest.withoutVersion": "manifest.version_name is not set",
  },
};

// ── SidePilot 自述 (System Identity) ──
const SIDEPILOT_SYSTEM_IDENTITY = {
  id: "__sidepilot_system__",
  type: "system",
  title: "SidePilot — Extension Self-Description",
  content: [
    "[Identity]",
    "SidePilot is a Chrome Extension side-panel AI assistant.",
    "It runs inside the browser Side Panel and communicates with GitHub Copilot CLI via the SDK Bridge (localhost:31031).",
    "",
    "[Objectives]",
    "• Provide real-time AI conversation (SDK mode: direct API / iframe mode: embedded Copilot UI)",
    "• Capture current page content (text, visible screenshot, full-page screenshot, region screenshot)",
    "• Manage Memory Bank: store task / note / context / reference entries",
    "• Manage Rules: inject custom Instructions into conversations",
    "• Structured output: uses sidepilot_packet / assistant_response protocol",
    "",
    "[Environment]",
    "• Chrome Extension Manifest V3, Side Panel API",
    "• Background Service Worker + Content Script (link-guard)",
    "• SDK Bridge: Node.js local service (port 31031), bridging GitHub Copilot CLI",
    "",
    "[Capabilities]",
    "• Page capture: text extraction, visible-area screenshot, full-page scroll-stitch screenshot, region selection screenshot",
    "• Memory system: CRUD, search, relevance scoring, auto-inject into Prompt",
    "• Rules engine: custom rule templates, real-time load and inject",
    "• Conversation format: Context toggles (Memory / Rules / System / Structured Output)",
    "• History log: split by date, grouped by session, tag-based categorization",
    "• Live log: Bridge SSE stream, level filtering, search",
    "",
    "[Permissions]",
    "sidePanel, activeTab, scripting, tabs, storage, downloads,",
    "declarativeNetRequest (CSP bypass for github.com)",
  ].join("\n"),
  status: null,
  updatedAt: Date.now(),
  pinned: true,
};
const IDENTITY_STORAGE_KEY = "sidepilot.identity.template.v1";

// Identity module tokens — auto-resolved at save time
const IDENTITY_MODULES = [
  {
    token: "{{BROWSER}}",
    label: "🌐 瀏覽器",
    resolve: () =>
      `${navigator.userAgent.match(/Chrome\/[\d.]+/)?.[0] || "Chrome"} (${navigator.platform})`,
  },
  {
    token: "{{BRIDGE_PORT}}",
    label: "🔌 Bridge Port",
    resolve: () => String(SDK_BRIDGE_PORT),
  },
  {
    token: "{{BRIDGE_URL}}",
    label: "🔗 Bridge URL",
    resolve: () => `http://localhost:${SDK_BRIDGE_PORT}`,
  },
  {
    token: "{{EXTENSION_ID}}",
    label: "🆔 Extension ID",
    resolve: () => chrome.runtime?.id || "unknown",
  },
  {
    token: "{{EXT_VERSION}}",
    label: "📦 版本",
    resolve: () => chrome.runtime?.getManifest?.()?.version || "1.0.0",
  },
  {
    token: "{{MANIFEST_V}}",
    label: "📋 Manifest",
    resolve: () =>
      `MV${chrome.runtime?.getManifest?.()?.manifest_version || 3}`,
  },
  {
    token: "{{STORAGE_PATH}}",
    label: "💾 儲存位置",
    resolve: () => "chrome.storage.local (Extension sandbox)",
  },
  {
    token: "{{BRIDGE_DIR}}",
    label: "📁 Bridge 路徑",
    resolve: () => BRIDGE_WORKDIR_HINT,
  },
  {
    token: "{{PERMISSIONS}}",
    label: "🔐 權限",
    resolve: () =>
      (chrome.runtime?.getManifest?.()?.permissions || []).join(", "),
  },
  {
    token: "{{LANG}}",
    label: "🌍 語系",
    resolve: () => navigator.language || "zh-TW",
  },
  {
    token: "{{SCREEN}}",
    label: "🖥️ 螢幕",
    resolve: () => `${screen.width}×${screen.height} @${devicePixelRatio}x`,
  },
  {
    token: "{{TIMESTAMP}}",
    label: "🕐 時間戳",
    resolve: () => new Date().toISOString(),
  },
];

function resolveIdentityTokens(template) {
  let result = template;
  for (const mod of IDENTITY_MODULES) {
    if (result.includes(mod.token)) {
      try {
        result = result.replaceAll(mod.token, mod.resolve());
      } catch {
        /* skip */
      }
    }
  }
  return result;
}

function normalizeUiLanguage(value) {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  if (raw === "en" || raw.startsWith("en-")) return UI_LANGUAGE_EN;
  if (raw === "zh" || raw.startsWith("zh-")) return UI_LANGUAGE_ZH_TW;
  return UI_LANGUAGE_FALLBACK;
}

function getCurrentUiLanguage(languageOverride) {
  if (languageOverride) {
    return normalizeUiLanguage(languageOverride);
  }
  const fromState = state?.settings?.uiLanguage;
  if (fromState) {
    return normalizeUiLanguage(fromState);
  }
  return normalizeUiLanguage(navigator.language || UI_LANGUAGE_FALLBACK);
}

function translateSettingsKey(key, languageOverride) {
  const language = getCurrentUiLanguage(languageOverride);
  const localeTable =
    SETTINGS_I18N[language] || SETTINGS_I18N[UI_LANGUAGE_FALLBACK];
  const fallbackTable = SETTINGS_I18N[UI_LANGUAGE_FALLBACK] || {};
  return localeTable?.[key] ?? fallbackTable?.[key] ?? key;
}

function translateSettingsTemplate(key, replacements = {}, languageOverride) {
  let value = translateSettingsKey(key, languageOverride);
  for (const [name, replacement] of Object.entries(replacements)) {
    value = value.replaceAll(`{${name}}`, String(replacement));
  }
  return value;
}

function applySettingsI18n(languageOverride) {
  const settingsRoot =
    dom.settingsTab || document.getElementById("settings-tab");
  if (!settingsRoot) return;

  const language = getCurrentUiLanguage(languageOverride);
  settingsRoot.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.dataset.i18n;
    if (!key) return;
    node.textContent = translateSettingsKey(key, language);
  });
  settingsRoot.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    const key = node.dataset.i18nPlaceholder;
    if (!key) return;
    node.setAttribute("placeholder", translateSettingsKey(key, language));
  });
  settingsRoot.querySelectorAll("[data-i18n-html]").forEach((node) => {
    const key = node.dataset.i18nHtml;
    if (!key) return;
    node.innerHTML = translateSettingsKey(key, language);
  });
  settingsRoot.querySelectorAll("[data-i18n-aria-label]").forEach((node) => {
    const key = node.dataset.i18nAriaLabel;
    if (!key) return;
    node.setAttribute("aria-label", translateSettingsKey(key, language));
  });

  if (dom.settingUiLanguage) {
    const zhOption = dom.settingUiLanguage.querySelector(
      'option[value="zh-TW"]',
    );
    const enOption = dom.settingUiLanguage.querySelector('option[value="en"]');
    if (zhOption) {
      zhOption.textContent = translateSettingsKey(
        "settings.language.option.zh-TW",
        language,
      );
    }
    if (enOption) {
      enOption.textContent = translateSettingsKey(
        "settings.language.option.en",
        language,
      );
    }
  }

  updateIframeRiskDocLink(language);
}

const SIDEPILOT_SANDBOX_SYSTEM_MESSAGE = [
  `You are running inside ${SIDEPILOT_SANDBOX_SCHEMA}.`,
  "For each response, output exactly 2 XML blocks in this order:",
  "1) <sidepilot_packet>{valid JSON object}</sidepilot_packet>",
  "2) <assistant_response>...</assistant_response>",
  "The sidepilot_packet JSON must include:",
  "- schema",
  "- used_memory_ids (array of ids)",
  "- used_rules (boolean)",
  "- decision_summary (short string)",
  "- confidence (number from 0 to 1)",
  "Do not output chain-of-thought or extra sections outside these 2 blocks.",
].join("\n");

const MEMORY_TYPE_WEIGHT = {
  context: 4,
  reference: 3,
  note: 2,
  task: 1,
};

const DEFAULT_SETTINGS = {
  uiLanguage: UI_LANGUAGE_ZH_TW,
  displayScalePercent: DEFAULT_DISPLAY_SCALE_PERCENT,
  autoStartBridgeEnabled: true,
  autoStartBridgeCooldownMs: BRIDGE_AUTO_START_DEFAULT_COOLDOWN_MS,
  autoStartBridgeLastAttemptAt: 0,
  autoStartBridgeLastResult: "idle",
  autoStartBridgeLastError: "",
  bridgeManualRuntime: "auto",
  bridgeProjectRootWindows: "",
  bridgeProjectRootWsl: "",
  bridgeWslDistro: "",
  autoSDKLoginGuide: true,
  selfIterationEnabled: false,
  selfIterationFirstSealDone: false,
  selfIterationLastError: "",
  selfIterationLastSealAt: 0,
  selfIterationLastSealDigest: "",
  playIntroEveryOpen: false,
  showWarningOverlay: true,
  captureButtonWidth: DEFAULT_CAPTURE_BUTTON_WIDTH,
  captureButtonTopPercent: DEFAULT_CAPTURE_BUTTON_TOP_PERCENT,
  antigravityBaseUrl: ANTIGRAVITY_DEFAULT_BASE_URL,
  antigravityToken: "",
  iframeEnabled: false,
  linkGuardMode: "allow",
  linkAllowlist: [
    "https://github.com/copilot/*",
    "https://github.com/settings/copilot*",
    "https://github.com/features/copilot*",
  ],
};

const SELF_ITERATION_BASELINE_MEMORY_ENTRY = {
  type: "context",
  title: "Self-Iteration Baseline",
  content: [
    "自我疊代模式下：",
    "1) 高風險變更前先確認封印/啟動鎖狀態。",
    "2) 未經明確同意不執行不可逆操作。",
    "3) 每次修改後要回報可驗證結果（PASS/FAIL）。",
  ].join("\n"),
  source: "system_baseline",
  tags: ["sidepilot", "baseline", "self-iteration"],
};

const RULES_SOURCE_SYSTEM_BASELINE = "system_baseline";
const RULES_SOURCE_USER = "user";

const state = {
  currentPageContent: null,
  currentPageScreenshot: null,
  currentPartialScreenshot: null,
  currentFullPageScreenshot: null,
  currentPageError: null,
  pendingChatImages: [],
  isCapturePanelOpen: false,
  frameLoaded: false,
  loadTimeout: null,
  detectedMode: null,
  settings: { ...DEFAULT_SETTINGS },
  logs: [],
  logSSE: null,
  bridgeLogSSE: null,
  permissionSSE: null,
  permissionCountdownTimer: null,
  sdkHealthTimer: null,
  bridgeSectionHealthTimer: null,
  antigravitySectionHealthTimer: null,
  bridgeAutoStartInFlight: null,
  bridgeLastProbe: {
    connected: false,
    isBridge: false,
    text: "",
    detail: "",
    type: "info",
    url: "",
    sdkState: "",
    service: "",
    backendType: "",
    checkedAt: 0,
  },
  startupLocked: false,
  sdkInputResizeInitialized: false,
  sdkInputResizeDragging: false,
  sdkInputResizeStartY: 0,
  sdkInputResizeStartHeight: 0,
  identityTemplateLoaded: false,
  identityUiBound: false,
};

// ============================================
// DOM 元素
// ============================================

const dom = {};

// ============================================
// 初始化
// ============================================

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForStartupGuardReady(timeoutMs = 5000, intervalMs = 150) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const response = await chrome.runtime.sendMessage({
      action: "startupGuardStatus",
    });
    if (response?.guard?.ready) return response;
    await sleep(intervalMs);
  }

  return chrome.runtime.sendMessage({ action: "startupGuardStatus" });
}

function lockSidePanelByStartupGuard(guard, errorMessage = "") {
  state.startupLocked = true;
  document.body.classList.add("startup-locked");

  if (state.loadTimeout) {
    clearTimeout(state.loadTimeout);
    state.loadTimeout = null;
  }

  dom.loadingOverlay?.classList.add("hidden");
  dom.copilotFrame?.classList.add("hidden");
  dom.sdkChat?.classList.add("hidden");
  dom.errorOverlay?.classList.remove("hidden");

  const reasons = Array.isArray(guard?.reasons) ? guard.reasons : [];
  const details =
    reasons.length > 0
      ? reasons.join(" | ")
      : errorMessage || "unknown startup guard failure";

  if (dom.errorMessage) {
    dom.errorMessage.textContent = `啟動安全檢測未通過，擴充已鎖定。原因：${details}`;
  }

  if (dom.retryBtn) dom.retryBtn.disabled = true;
  if (dom.openWindowBtn) dom.openWindowBtn.disabled = true;

  console.error("[SidePilot] Startup guard lock:", details);
}

async function ensureStartupGuardPasses() {
  try {
    const response = await waitForStartupGuardReady();
    const guard = response?.guard;

    if (!guard?.ready) {
      lockSidePanelByStartupGuard(guard, "startup guard timeout");
      return false;
    }
    if (guard.locked) {
      lockSidePanelByStartupGuard(guard, response?.error || "");
      return false;
    }
    return true;
  } catch (err) {
    lockSidePanelByStartupGuard(null, err?.message || String(err));
    return false;
  }
}

async function init() {
  // 取得所有 DOM 元素
  dom.copilotFrame = document.getElementById("copilotFrame");
  dom.loadingOverlay = document.getElementById("loadingOverlay");
  dom.errorOverlay = document.getElementById("errorOverlay");
  dom.errorMessage = document.getElementById("errorMessage");
  dom.floatingCaptureBtn = document.getElementById("floatingCaptureBtn");
  dom.pageInfo = document.getElementById("pageInfo");
  dom.pageTitle = document.getElementById("pageTitle");
  dom.pageUrl = document.getElementById("pageUrl");
  dom.capturePanel = document.getElementById("capturePanel");
  dom.captureContent = document.getElementById("captureContent");
  dom.closeCaptureBtn = document.getElementById("closeCaptureBtn");
  dom.retryBtn = document.getElementById("retryBtn");
  dom.openWindowBtn = document.getElementById("openWindowBtn");
  dom.toast = document.getElementById("toast");
  dom.welcomeOverlay = document.getElementById("welcomeOverlay");
  dom.welcomeCloseBtn = document.getElementById("welcomeCloseBtn");
  dom.welcomeDeclineBtn = document.getElementById("welcomeDeclineBtn");
  dom.welcomeSuppressCheckbox = document.getElementById(
    "welcomeSuppressCheckbox",
  );

  // Intro Video
  dom.introContainer = document.getElementById("introContainer");
  dom.introVideo = document.getElementById("introVideo");
  dom.skipIntroBtn = document.getElementById("skipIntroBtn");
  dom.homeBtn = document.getElementById("homeBtn");

  // Tab navigation
  dom.tabBar = document.querySelector(".tab-bar");
  dom.tabs = document.querySelectorAll(".tab");
  dom.tabContents = document.querySelectorAll(".tab-content");
  dom.modeSwitch = document.getElementById("modeSwitch");
  dom.modeSwitchBtns = document.querySelectorAll(".mode-switch-btn");
  dom.sdkModeBtn = document.getElementById("sdkModeBtn");

  // SDK Chat elements
  dom.sdkChat = document.getElementById("sdkChat");
  dom.sdkMessages = document.getElementById("sdkMessages");
  dom.sdkInputContainer = document.getElementById("sdkInputContainer");
  dom.sdkInputResizer = document.getElementById("sdkInputResizer");
  dom.sdkInput = document.getElementById("sdkInput");
  dom.sdkSendBtn = document.getElementById("sdkSendBtn");
  dom.sdkClearBtn = document.getElementById("sdkClearBtn");
  dom.sdkIncludeMemory = document.getElementById("sdkIncludeMemory");
  dom.sdkIncludeIdentity = document.getElementById("sdkIncludeIdentity");
  dom.sdkIncludeMemoryEntries = document.getElementById(
    "sdkIncludeMemoryEntries",
  );
  dom.sdkIncludeRules = document.getElementById("sdkIncludeRules");
  dom.sdkIncludeSystemMsg = document.getElementById("sdkIncludeSystemMsg");
  dom.sdkIncludeSystemMsgItem = document.getElementById(
    "sdkIncludeSystemMsgItem",
  );
  dom.sdkStructuredOutput = document.getElementById("sdkStructuredOutput");
  dom.sdkAssistantOnly = document.getElementById("sdkAssistantOnly");
  dom.sdkMemorySummary = document.getElementById("sdkMemorySummary");
  dom.sdkModelSelect = document.getElementById("sdkModelSelect");
  dom.contextChildToggles = document.getElementById("contextChildToggles");
  dom.settingsIdentityContent = document.getElementById(
    "settingsIdentityContent",
  );
  dom.identityEditor = document.getElementById("identityEditor");
  dom.identitySaveBtn = document.getElementById("identitySaveBtn");
  dom.identityResetBtn = document.getElementById("identityResetBtn");
  dom.identityModuleChips = document.getElementById("identityModuleChips");

  if (dom.sdkAssistantOnly) {
    dom.sdkAssistantOnly.checked =
      localStorage.getItem(STORAGE_KEY_SDK_ASSISTANT_ONLY) === "true";
  }
  // Restore granular toggle states
  [
    "sdkIncludeIdentity",
    "sdkIncludeMemoryEntries",
    "sdkIncludeRules",
    "sdkIncludeSystemMsg",
    "sdkStructuredOutput",
  ].forEach((key) => {
    if (dom[key]) {
      const stored = localStorage.getItem(`sidepilot_${key}`);
      dom[key].checked = stored !== null ? stored === "true" : true;
    }
  });
  syncContextChildToggles();
  if (dom.sdkModelSelect) {
    const selectedModel = localStorage.getItem(STORAGE_KEY_SDK_MODEL) || "";
    dom.sdkModelSelect.value = selectedModel;
  }

  // Rules tab
  dom.rulesEditor = document.getElementById("rulesEditor");
  dom.rulesModuleChips = document.getElementById("rulesModuleChips");
  dom.saveRulesBtn = document.getElementById("saveRulesBtn");
  dom.exportRulesBtn = document.getElementById("exportRulesBtn");
  dom.importRulesBtn = document.getElementById("importRulesBtn");
  dom.rulesFileInput = document.getElementById("rulesFileInput");
  dom.templateSelect = document.getElementById("templateSelect");
  dom.rulesStatus = document.getElementById("rulesStatus");
  dom.rulesOriginBadge = document.getElementById("rulesOriginBadge");
  dom.rulesOriginDetail = document.getElementById("rulesOriginDetail");

  // Memory tab
  dom.memoryList = document.getElementById("memoryList");
  dom.memorySearch = document.getElementById("memorySearch");
  dom.memoryFilter = document.getElementById("memoryFilter");
  dom.addMemoryBtn = document.getElementById("addMemoryBtn");
  dom.memoryModal = document.getElementById("memoryModal");
  dom.closeMemoryModal = document.getElementById("closeMemoryModal");
  dom.saveMemoryBtn = document.getElementById("saveMemoryBtn");
  dom.cancelMemoryBtn = document.getElementById("cancelMemoryBtn");
  dom.entryType = document.getElementById("entryType");
  dom.entryTitle = document.getElementById("entryTitle");
  dom.entryContent = document.getElementById("entryContent");
  dom.memoryModuleChips = document.getElementById("memoryModuleChips");
  dom.entryStatus = document.getElementById("entryStatus");
  dom.memoryModalTitle = document.getElementById("memoryModalTitle");
  dom.sendToVSCodeBtn = document.getElementById("sendToVSCodeBtn");

  // Logs tab
  dom.logList = document.getElementById("logList");
  dom.logSearch = document.getElementById("logSearch");
  dom.logLevelFilter = document.getElementById("logLevelFilter");
  dom.copyLogsBtn = document.getElementById("copyLogsBtn");
  dom.clearLogsBtn = document.getElementById("clearLogsBtn");

  // History Log tab (Bridge)
  dom.logFileList = document.getElementById("logFileList");
  dom.refreshLogBtn = document.getElementById("refreshLogBtn");
  dom.logContainerSdk = document.getElementById("logContainerSdk");
  dom.logContainerIframe = document.getElementById("logContainerIframe");
  dom.logIframeAgentsToggle = document.getElementById("logIframeAgentsToggle");
  dom.logIframeAgentsBody = document.getElementById("logIframeAgentsBody");
  dom.logIframeAgents = document.getElementById("logIframeAgents");

  // Settings tab
  dom.settingsTab = document.getElementById("settings-tab");
  dom.saveSettingsBtn = document.getElementById("saveSettingsBtn");
  dom.settingsStatus = document.getElementById("settingsStatus");
  dom.settingUiLanguage = document.getElementById("settingUiLanguage");
  dom.settingDisplayScale = document.getElementById("settingDisplayScale");
  dom.displayScaleValue = document.getElementById("displayScaleValue");
  dom.iframeRiskHelpBtn = document.getElementById("iframeRiskHelpBtn");
  dom.iframeRiskDocLink = document.getElementById("iframeRiskDocLink");
  dom.settingAutoStartBridge = document.getElementById(
    "settingAutoStartBridge",
  );
  dom.settingAutoSdkLogin = document.getElementById("settingAutoSdkLogin");
  dom.settingSelfIterationEnabled = document.getElementById(
    "settingSelfIterationEnabled",
  );
  dom.selfIterationSealBadge = document.getElementById(
    "selfIterationSealBadge",
  );
  dom.selfIterationSealDetail = document.getElementById(
    "selfIterationSealDetail",
  );
  dom.settingPlayIntroEveryOpen = document.getElementById(
    "settingPlayIntroEveryOpen",
  );
  dom.settingShowWarningOverlay = document.getElementById(
    "settingShowWarningOverlay",
  );
  dom.settingCaptureButtonWidth = document.getElementById(
    "settingCaptureButtonWidth",
  );
  dom.settingCaptureButtonTop = document.getElementById(
    "settingCaptureButtonTop",
  );
  dom.settingIframeEnabled = document.getElementById("settingIframeEnabled");
  dom.settingLinkGuardMode = document.getElementById("settingLinkGuardMode");
  dom.settingLinkAllowlist = document.getElementById("settingLinkAllowlist");
  dom.captureBtnWidthValue = document.getElementById("captureBtnWidthValue");
  dom.captureBtnTopValue = document.getElementById("captureBtnTopValue");
  dom.openSdkLoginGuideBtn = document.getElementById("openSdkLoginGuideBtn");
  dom.testSdkBridgeBtn = document.getElementById("testSdkBridgeBtn");
  dom.bridgeInstallStatus = document.getElementById("bridgeInstallStatus");
  dom.bridgeInstallDetail = document.getElementById("bridgeInstallDetail");
  dom.bridgePrimaryBtn = document.getElementById("bridgePrimaryBtn");
  dom.settingBridgeProjectRoot = document.getElementById(
    "settingBridgeProjectRoot",
  );
  dom.bridgeProjectRootHint = document.getElementById("bridgeProjectRootHint");
  dom.settingBridgeWslDistro = document.getElementById(
    "settingBridgeWslDistro",
  );
  dom.bridgeAdvancedToggleBtn = document.getElementById(
    "bridgeAdvancedToggleBtn",
  );
  dom.bridgeAdvancedPanel = document.getElementById("bridgeAdvancedPanel");
  dom.bridgeInstallCommandPreview = document.getElementById(
    "bridgeInstallCommandPreview",
  );
  dom.bridgeCommandPreview = document.getElementById("bridgeCommandPreview");
  dom.bridgeLastResultDetail = document.getElementById(
    "bridgeLastResultDetail",
  );
  dom.bridgeDiagnosticPreview = document.getElementById(
    "bridgeDiagnosticPreview",
  );
  dom.bridgeLauncherBadge = document.getElementById("bridgeLauncherBadge");
  dom.bridgeBridgeBadge = document.getElementById("bridgeBridgeBadge");
  dom.bridgeRuntimeBadge = document.getElementById("bridgeRuntimeBadge");
  dom.bridgeAdvancedRuntimeHint = document.getElementById(
    "bridgeAdvancedRuntimeHint",
  );
  dom.bridgeCheckBtn = document.getElementById("bridgeCheckBtn");
  dom.bridgeCopyInstallBtn = document.getElementById("bridgeCopyInstallBtn");
  dom.bridgeCopyCmdBtn = document.getElementById("bridgeCopyCmdBtn");
  dom.bridgeCopyCheckBtn = document.getElementById("bridgeCopyCheckBtn");
  dom.bridgeStatusDot = document.getElementById("bridgeStatusDot");
  dom.bridgeRuntimeButtons = Array.from(
    document.querySelectorAll(".bridge-runtime-btn"),
  );
  dom.settingAntigravityBaseUrl = document.getElementById(
    "settingAntigravityBaseUrl",
  );
  dom.settingAntigravityToken = document.getElementById(
    "settingAntigravityToken",
  );
  dom.antigravityInstallStatus = document.getElementById(
    "antigravityInstallStatus",
  );
  dom.antigravityInstallDetail = document.getElementById(
    "antigravityInstallDetail",
  );
  dom.antigravityStatusDot = document.getElementById("antigravityStatusDot");
  dom.antigravityHealthBtn = document.getElementById("antigravityHealthBtn");
  dom.antigravityMetaBtn = document.getElementById("antigravityMetaBtn");
  dom.antigravityDetectBtn = document.getElementById("antigravityDetectBtn");

  // SDK login guide modal
  dom.sdkLoginModal = document.getElementById("sdkLoginModal");
  dom.closeSdkLoginModal = document.getElementById("closeSdkLoginModal");
  dom.sdkLoginLaterBtn = document.getElementById("sdkLoginLaterBtn");
  dom.sdkLoginNowBtn = document.getElementById("sdkLoginNowBtn");
  dom.sdkLoginSuppressCheckbox = document.getElementById(
    "sdkLoginSuppressCheckbox",
  );

  // WP-01: Permission modal
  dom.permissionModal = document.getElementById("permissionModal");
  dom.permissionScope = document.getElementById("permissionScope");
  dom.permissionReason = document.getElementById("permissionReason");
  dom.permissionOptions = document.getElementById("permissionOptions");
  dom.permissionCountdown = document.getElementById("permissionCountdown");
  dom.permissionApproveBtn = document.getElementById("permissionApproveBtn");
  dom.permissionDenyBtn = document.getElementById("permissionDenyBtn");

  // WP-07: Prompt strategy
  dom.promptStrategyBtns = document.getElementById("promptStrategyBtns");

  // 驗證必要元素
  const required = ["copilotFrame", "loadingOverlay", "capturePanel", "toast"];
  for (const key of required) {
    if (!dom[key]) {
      console.error(`Missing required element: ${key}`);
      return;
    }
  }

  const guardPass = await ensureStartupGuardPasses();
  if (!guardPass) {
    return;
  }

  setupEventListeners();
  loadLogs();
  renderLogs();
  addLog("info", "SidePilot 已啟動");
  setBridgeInstallDefaultHint();
  setupFrameLoadDetection();
  loadCurrentPageInfo();

  loadSettings()
    .catch((err) => {
      console.warn(
        "[SidePilot] Failed to load settings, using defaults:",
        err?.message || err,
      );
      applySettingsToUI();
      applyCaptureButtonWidth(state.settings.captureButtonWidth);
      applyCaptureButtonTop(state.settings.captureButtonTopPercent);
      updateSettingsStatus("使用預設設定", "warning");
    })
    .finally(() => {
      checkIntroVideo();
    });

  // Detect mode on startup (non-blocking)
  detectModeOnStartup();

  // Load saved identity template (resolve tokens for prompt injection)
  chrome.storage.local.get(IDENTITY_STORAGE_KEY, (r) => {
    if (r[IDENTITY_STORAGE_KEY]) {
      SIDEPILOT_SYSTEM_IDENTITY.content = resolveIdentityTokens(
        r[IDENTITY_STORAGE_KEY],
      );
      SIDEPILOT_SYSTEM_IDENTITY.updatedAt = Date.now();
    }
  });
}

// ============================================
// Mode Detection
// ============================================

async function detectModeOnStartup() {
  try {
    const stored = await chrome.runtime.sendMessage({ action: "getMode" });
    if (
      stored?.success &&
      (stored.mode === "sdk" || stored.mode === "iframe")
    ) {
      state.detectedMode = stored.mode;
      console.log("[SidePilot] Loaded mode:", stored.mode);
      addLog("info", `模式載入：${stored.mode}`);
    } else {
      const detected = await chrome.runtime.sendMessage({
        action: "detectMode",
      });
      if (detected?.success) {
        state.detectedMode = detected.mode;
        console.log("[SidePilot] Detected mode:", detected.mode);
        addLog("info", `模式偵測：${detected.mode}`);
      } else {
        state.detectedMode = "iframe";
        console.warn("[SidePilot] Mode detection failed, defaulting to iframe");
        addLog("warn", "模式偵測失敗，已切回 iframe");
      }
    }
    updateModeBadge();

    if (state.detectedMode === "sdk") {
      const bridgeResult = await ensureSDKBridgeReadyWithAutoStart({
        source: "startup-sdk-mode",
        showToast: false,
      });
      const bridgeReady = !!bridgeResult?.success;
      if (bridgeReady) {
        await loadSDKModelOptions();
        connectPermissionSSE();
        loadPromptStrategy();
      }
    }
  } catch (err) {
    state.detectedMode = "iframe";
    console.warn(
      "[SidePilot] Mode detection error, defaulting to iframe:",
      err.message,
    );
    addLog("error", "模式偵測發生錯誤，已切回 iframe", err.message);
    updateModeBadge();
  }
}

function updateModeBadge() {
  const mode = state.detectedMode || "iframe";
  document.body.classList.toggle("is-sdk-mode", mode === "sdk");
  document.body.classList.toggle("is-iframe-mode", mode !== "sdk");

  dom.modeSwitchBtns?.forEach((btn) => {
    const isActive = btn.dataset.mode === mode;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  // Switch UI mode
  if (mode === "sdk") {
    dom.copilotFrame?.classList.add("hidden");
    dom.sdkChat?.classList.remove("hidden");
    ensureSDKInputContainerReady();
    startSdkHealthPolling();
  } else {
    stopSDKInputResizeDrag();
    dom.copilotFrame?.classList.remove("hidden");
    dom.sdkChat?.classList.add("hidden");
    stopSdkHealthPolling();
    updateSdkStatusDot("");
    ensureIframeFrameReady({ recoverIfBlank: true });
  }

  syncCapturePanelMode();
}

// ============================================
// Tab Navigation
// ============================================

function switchTab(tabId) {
  // Update tab buttons
  dom.tabs.forEach((tab) => {
    if (tab.dataset.tab === tabId) {
      tab.classList.add("active");
    } else {
      tab.classList.remove("active");
    }
  });

  // Update tab content
  dom.tabContents.forEach((content) => {
    if (content.id === `${tabId}-tab`) {
      content.classList.add("active");
    } else {
      content.classList.remove("active");
    }
  });

  // Keep the iframe document alive while hidden so Copilot can finish rendering
  // replies even if the user briefly switches to Logs/History during a request.
  if (dom.copilotFrame) {
    const isCopilotTab = tabId === "copilot";
    dom.copilotFrame.style.visibility = isCopilotTab ? "visible" : "hidden";
    dom.copilotFrame.style.pointerEvents = isCopilotTab ? "" : "none";
  }
  if (tabId === "copilot" && state.detectedMode === "sdk") {
    requestAnimationFrame(() => {
      ensureSDKInputContainerReady();
    });
  }

  // Load content if needed
  if (tabId === "rules") {
    loadRules();
    loadTemplates();
    setupModuleChips(dom.rulesModuleChips, dom.rulesEditor);
  } else if (tabId === "memory") {
    loadMemoryEntries();
    setupModuleChips(dom.memoryModuleChips, dom.entryContent);
  } else if (tabId === "logs") {
    renderLogs();
    connectBridgeLogSSE();
  } else if (tabId === "log") {
    updateHistoryTabMode();
    loadLogFiles();
  } else if (tabId === "settings") {
    applySettingsToUI();
    // Start section polling if the matching settings sections are open.
    const installSection = document.getElementById("settingsSectionInstall");
    if (installSection && !installSection.classList.contains("collapsed")) {
      startBridgeSectionPolling();
    }
    const providerSection = document.getElementById("settingsSectionProviders");
    if (providerSection && !providerSection.classList.contains("collapsed")) {
      startAntigravitySectionPolling();
    }
  } else {
    // Stop bridge polling when leaving settings tab
    stopBridgeSectionPolling();
    stopAntigravitySectionPolling();
    disconnectBridgeLogSSE();
  }

  addLog("info", `切換分頁：${tabId}`);
}

// ============================================
// Settings Management
// ============================================

function isSDKInputContainerVisible() {
  if (!dom.sdkInputContainer || !dom.sdkChat) return false;
  if (dom.sdkChat.classList.contains("hidden")) return false;
  return dom.sdkInputContainer.offsetParent !== null;
}

function getSDKInputContainerMaxHeight() {
  const chatHeight = Number(dom.sdkChat?.clientHeight || 0);
  if (!Number.isFinite(chatHeight) || chatHeight <= 0) {
    return SDK_INPUT_CONTAINER_FALLBACK_MAX_HEIGHT;
  }
  const ratioCap = Math.floor(chatHeight * 0.72);
  const messageSafetyCap = Math.floor(chatHeight - 180);
  const cap = Math.min(ratioCap, messageSafetyCap);
  return Math.max(SDK_INPUT_CONTAINER_MIN_HEIGHT, cap);
}

function clampSDKInputContainerHeight(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return SDK_INPUT_CONTAINER_MIN_HEIGHT;
  }
  return Math.min(
    getSDKInputContainerMaxHeight(),
    Math.max(SDK_INPUT_CONTAINER_MIN_HEIGHT, Math.round(numeric)),
  );
}

function setSDKInputContainerHeight(height, { persist = false } = {}) {
  if (!dom.sdkInputContainer) return null;
  const clamped = clampSDKInputContainerHeight(height);
  dom.sdkInputContainer.style.height = `${clamped}px`;
  if (persist) {
    localStorage.setItem(
      STORAGE_KEY_SDK_INPUT_CONTAINER_HEIGHT,
      String(clamped),
    );
  }
  return clamped;
}

function restoreOrInitSDKInputContainerHeight() {
  if (!dom.sdkInputContainer) return;

  const storedHeight = Number(
    localStorage.getItem(STORAGE_KEY_SDK_INPUT_CONTAINER_HEIGHT),
  );
  if (Number.isFinite(storedHeight) && storedHeight > 0) {
    setSDKInputContainerHeight(storedHeight, { persist: false });
    state.sdkInputResizeInitialized = true;
    return;
  }

  if (!isSDKInputContainerVisible()) return;

  const measured = Math.round(
    dom.sdkInputContainer.getBoundingClientRect().height,
  );
  if (!Number.isFinite(measured) || measured <= 0) return;

  const defaultHeight = Math.round(
    measured * SDK_INPUT_CONTAINER_DEFAULT_SCALE,
  );
  setSDKInputContainerHeight(defaultHeight, { persist: true });
  state.sdkInputResizeInitialized = true;
}

function ensureSDKInputContainerReady() {
  if (!dom.sdkInputContainer) return;

  if (!state.sdkInputResizeInitialized) {
    restoreOrInitSDKInputContainerHeight();
    return;
  }

  const inlineHeight = Number.parseInt(dom.sdkInputContainer.style.height, 10);
  if (Number.isFinite(inlineHeight) && inlineHeight > 0) {
    setSDKInputContainerHeight(inlineHeight, { persist: false });
    return;
  }

  const storedHeight = Number(
    localStorage.getItem(STORAGE_KEY_SDK_INPUT_CONTAINER_HEIGHT),
  );
  if (Number.isFinite(storedHeight) && storedHeight > 0) {
    setSDKInputContainerHeight(storedHeight, { persist: false });
  }
}

function startSDKInputResizeDrag(event) {
  if (event.button !== 0) return;
  if (!dom.sdkInputContainer) return;

  ensureSDKInputContainerReady();
  const currentHeight = Math.round(
    dom.sdkInputContainer.getBoundingClientRect().height,
  );
  if (!Number.isFinite(currentHeight) || currentHeight <= 0) return;

  state.sdkInputResizeDragging = true;
  state.sdkInputResizeStartY = event.clientY;
  state.sdkInputResizeStartHeight = currentHeight;

  document.body.classList.add("sdk-input-resizing");
  document.addEventListener("mousemove", handleSDKInputResizeDrag);
  document.addEventListener("mouseup", stopSDKInputResizeDrag);
  window.addEventListener("blur", stopSDKInputResizeDrag, { once: true });
  event.preventDefault();
}

function handleSDKInputResizeDrag(event) {
  if (!state.sdkInputResizeDragging) return;
  const delta = state.sdkInputResizeStartY - event.clientY;
  const nextHeight = state.sdkInputResizeStartHeight + delta;
  setSDKInputContainerHeight(nextHeight, { persist: false });
}

function stopSDKInputResizeDrag() {
  document.body.classList.remove("sdk-input-resizing");
  document.removeEventListener("mousemove", handleSDKInputResizeDrag);
  document.removeEventListener("mouseup", stopSDKInputResizeDrag);
  window.removeEventListener("blur", stopSDKInputResizeDrag);
  if (!state.sdkInputResizeDragging) return;

  state.sdkInputResizeDragging = false;

  const currentHeight = Number.parseInt(
    dom.sdkInputContainer?.style?.height || "",
    10,
  );
  if (!Number.isFinite(currentHeight) || currentHeight <= 0) return;
  const persisted = clampSDKInputContainerHeight(currentHeight);
  dom.sdkInputContainer.style.height = `${persisted}px`;
  localStorage.setItem(
    STORAGE_KEY_SDK_INPUT_CONTAINER_HEIGHT,
    String(persisted),
  );
}

function handleSDKInputViewportResize() {
  if (!state.sdkInputResizeInitialized || !dom.sdkInputContainer) return;
  const currentHeight = Number.parseInt(dom.sdkInputContainer.style.height, 10);
  if (!Number.isFinite(currentHeight) || currentHeight <= 0) return;
  setSDKInputContainerHeight(currentHeight, { persist: true });
}

function clampBridgeAutoStartCooldownMs(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return BRIDGE_AUTO_START_DEFAULT_COOLDOWN_MS;
  }
  return Math.min(
    BRIDGE_AUTO_START_COOLDOWN_MAX_MS,
    Math.max(BRIDGE_AUTO_START_COOLDOWN_MIN_MS, Math.round(parsed)),
  );
}

function normalizeSettings(raw = {}) {
  const source = raw && typeof raw === "object" ? raw : {};
  const uiLanguage = normalizeUiLanguage(
    source.uiLanguage || DEFAULT_SETTINGS.uiLanguage,
  );
  const displayScalePercent = clampDisplayScalePercent(
    source.displayScalePercent,
  );
  const bridgeManualRuntime =
    source.bridgeManualRuntime === "windows" ||
    source.bridgeManualRuntime === "wsl"
      ? source.bridgeManualRuntime
      : "auto";
  const bridgeProjectRootWindows =
    typeof source.bridgeProjectRootWindows === "string"
      ? source.bridgeProjectRootWindows.trim().replace(/[\r\n]+/g, " ").slice(0, 260)
      : "";
  const bridgeProjectRootWsl =
    typeof source.bridgeProjectRootWsl === "string"
      ? source.bridgeProjectRootWsl.trim().replace(/[\r\n]+/g, " ").slice(0, 320)
      : "";
  const bridgeWslDistro =
    typeof source.bridgeWslDistro === "string"
      ? source.bridgeWslDistro
          .trim()
          .replace(/[\r\n]+/g, " ")
          .replace(/["`]/g, "")
          .slice(0, 80)
      : "";
  const autoStartBridgeCooldownMs = clampBridgeAutoStartCooldownMs(
    source.autoStartBridgeCooldownMs,
  );
  const autoStartBridgeLastAttemptAt = Number.isFinite(
    Number(source.autoStartBridgeLastAttemptAt),
  )
    ? Number(source.autoStartBridgeLastAttemptAt)
    : 0;
  const autoStartBridgeLastResult =
    typeof source.autoStartBridgeLastResult === "string"
      ? source.autoStartBridgeLastResult
      : "idle";
  const autoStartBridgeLastError =
    typeof source.autoStartBridgeLastError === "string"
      ? source.autoStartBridgeLastError.slice(0, 240)
      : "";
  const captureWidth = clampCaptureButtonWidth(source.captureButtonWidth);
  const captureButtonTopPercent = clampCaptureButtonTopPercent(
    source.captureButtonTopPercent,
  );
  const antigravityBaseUrl = normalizeAntigravityBaseUrl(
    source.antigravityBaseUrl,
  );
  const antigravityToken = normalizeAntigravityToken(source.antigravityToken);
  const iframeEnabled = source.iframeEnabled === true;
  const linkGuardMode = source.linkGuardMode === "deny" ? "deny" : "allow";
  const linkAllowlist = normalizeLinkAllowlist(source.linkAllowlist, {
    allowEmpty: linkGuardMode === "deny",
  });
  const rawLastError =
    typeof source.selfIterationLastError === "string"
      ? source.selfIterationLastError.trim()
      : "";
  const selfIterationLastError = rawLastError.slice(0, 400);
  const selfIterationLastSealAt = Number.isFinite(
    Number(source.selfIterationLastSealAt),
  )
    ? Number(source.selfIterationLastSealAt)
    : 0;
  const digestCandidate =
    typeof source.selfIterationLastSealDigest === "string"
      ? source.selfIterationLastSealDigest.trim().toLowerCase()
      : "";
  const selfIterationLastSealDigest = /^[0-9a-f]{8}$/.test(digestCandidate)
    ? digestCandidate
    : "";

  return {
    uiLanguage,
    displayScalePercent,
    autoStartBridgeEnabled: source.autoStartBridgeEnabled !== false,
    autoStartBridgeCooldownMs,
    autoStartBridgeLastAttemptAt,
    autoStartBridgeLastResult,
    autoStartBridgeLastError,
    bridgeManualRuntime,
    bridgeProjectRootWindows,
    bridgeProjectRootWsl,
    bridgeWslDistro,
    autoSDKLoginGuide: source.autoSDKLoginGuide !== false,
    selfIterationEnabled: source.selfIterationEnabled === true,
    selfIterationFirstSealDone: source.selfIterationFirstSealDone === true,
    selfIterationLastError,
    selfIterationLastSealAt,
    selfIterationLastSealDigest,
    playIntroEveryOpen: source.playIntroEveryOpen === true,
    showWarningOverlay: source.showWarningOverlay !== false,
    captureButtonWidth: captureWidth,
    captureButtonTopPercent,
    antigravityBaseUrl,
    antigravityToken,
    iframeEnabled,
    linkGuardMode,
    linkAllowlist,
    iframeHistoryUrl: source.iframeHistoryUrl || "https://github.com/copilot",
  };
}

function clampDisplayScalePercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return DEFAULT_DISPLAY_SCALE_PERCENT;
  }
  return Math.min(
    DISPLAY_SCALE_MAX_PERCENT,
    Math.max(
      DISPLAY_SCALE_MIN_PERCENT,
      Math.round(number / DISPLAY_SCALE_STEP_PERCENT) * DISPLAY_SCALE_STEP_PERCENT,
    ),
  );
}

function clampCaptureButtonWidth(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return DEFAULT_CAPTURE_BUTTON_WIDTH;
  }
  return Math.min(100, Math.max(2, Math.round(number)));
}

function clampCaptureButtonTopPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return DEFAULT_CAPTURE_BUTTON_TOP_PERCENT;
  }
  return Math.min(92, Math.max(8, Math.round(number)));
}

function normalizeAntigravityBaseUrl(value) {
  try {
    const parsed = new URL(
      String(value || ANTIGRAVITY_DEFAULT_BASE_URL).trim() ||
        ANTIGRAVITY_DEFAULT_BASE_URL,
    );
    const protocol = parsed.protocol === "https:" ? "https:" : "http:";
    const host = String(parsed.hostname || "").toLowerCase();
    if (host !== "127.0.0.1" && host !== "localhost") {
      throw new Error("loopback_only");
    }
    const port = Number.parseInt(parsed.port || "", 10);
    const normalizedPort =
      Number.isInteger(port) && port > 0
        ? port
        : protocol === "https:"
          ? 443
          : 80;
    return `${protocol}//${host}:${normalizedPort}`;
  } catch {
    return ANTIGRAVITY_DEFAULT_BASE_URL;
  }
}

function normalizeAntigravityToken(value) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 240);
}

function normalizeLinkAllowlist(value, options = {}) {
  const allowEmpty = options.allowEmpty === true;
  const sourceList = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split("\n")
      : [];
  const normalized = [];
  const seen = new Set();

  for (const item of sourceList) {
    const trimmed = String(item || "").trim();
    if (!trimmed) continue;
    if (!/^https?:\/\//i.test(trimmed)) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    normalized.push(trimmed);
  }

  return normalized.length > 0
    ? normalized
    : allowEmpty
      ? []
      : [...DEFAULT_SETTINGS.linkAllowlist];
}

function formatAllowlistForTextarea(list, options = {}) {
  const normalized = normalizeLinkAllowlist(list, options);
  return normalized.join("\n");
}

function getManifestSealInfo() {
  try {
    const manifest = chrome.runtime.getManifest();
    const versionName = String(manifest?.version_name || "");
    const matched = versionName.match(MANIFEST_SEAL_PATTERN);
    if (!matched) {
      return {
        valid: false,
        versionName,
        digest: "",
      };
    }
    return {
      valid: true,
      versionName,
      digest: matched[2].toLowerCase(),
    };
  } catch {
    return {
      valid: false,
      versionName: "",
      digest: "",
    };
  }
}

function formatLocalDateTime(timestampMs, languageOverride) {
  if (!Number.isFinite(timestampMs) || timestampMs <= 0) return "";
  const locale =
    getCurrentUiLanguage(languageOverride) === UI_LANGUAGE_EN
      ? "en-US"
      : "zh-TW";
  try {
    return new Date(timestampMs).toLocaleString(locale, { hour12: false });
  } catch {
    return "";
  }
}

function updateSelfIterationSealBadge(languageOverride) {
  if (!dom.selfIterationSealBadge || !dom.selfIterationSealDetail) return;

  const settings = normalizeSettings(state.settings);
  const language = getCurrentUiLanguage(
    languageOverride || settings.uiLanguage,
  );
  const sealInfo = getManifestSealInfo();

  let badgeText = translateSettingsKey(
    "settings.seal.badge.unsealed",
    language,
  );
  let badgeStatus = "off";
  let detailText = translateSettingsKey(
    "settings.seal.detail.disabled",
    language,
  );

  if (settings.selfIterationEnabled) {
    if (sealInfo.valid && settings.selfIterationFirstSealDone) {
      badgeText = translateSettingsKey("settings.seal.badge.sealed", language);
      badgeStatus = "sealed";
      const parts = [];
      if (settings.selfIterationLastSealDigest) {
        parts.push(
          `${translateSettingsKey("settings.seal.label.digest", language)} ${settings.selfIterationLastSealDigest}`,
        );
      } else if (sealInfo.digest) {
        parts.push(
          `${translateSettingsKey("settings.seal.label.digest", language)} ${sealInfo.digest}`,
        );
      }
      const atText = formatLocalDateTime(
        settings.selfIterationLastSealAt,
        language,
      );
      if (atText)
        parts.push(
          `${translateSettingsKey("settings.seal.label.time", language)} ${atText}`,
        );
      detailText =
        parts.length > 0
          ? parts.join(" · ")
          : translateSettingsKey("settings.seal.detail.valid", language);
    } else {
      badgeText = translateSettingsKey(
        "settings.seal.badge.unsealed",
        language,
      );
      badgeStatus = "unsealed";
      detailText = translateSettingsKey(
        "settings.seal.detail.enabledNotSealed",
        language,
      );
    }
  }

  if (settings.selfIterationLastError) {
    const shortError =
      settings.selfIterationLastError.length > 180
        ? `${settings.selfIterationLastError.slice(0, 180)}...`
        : settings.selfIterationLastError;
    badgeText = translateSettingsKey("settings.seal.badge.unsealed", language);
    detailText = settings.selfIterationEnabled
      ? `${translateSettingsKey("settings.seal.lastError.enabled", language)}${shortError}`
      : `${translateSettingsKey("settings.seal.lastError.disabled", language)}${shortError}`;
    if (settings.selfIterationEnabled) {
      badgeStatus = "error";
    }
  }

  dom.selfIterationSealBadge.textContent = badgeText;
  dom.selfIterationSealBadge.dataset.status = badgeStatus;
  dom.selfIterationSealDetail.textContent = detailText;
  dom.selfIterationSealDetail.title = detailText;
  dom.selfIterationSealBadge.title = sealInfo.versionName
    ? translateSettingsTemplate(
        "settings.seal.manifest.withVersion",
        { version: sealInfo.versionName },
        language,
      )
    : translateSettingsKey("settings.seal.manifest.withoutVersion", language);
}

async function loadSettings() {
  const result = await chrome.storage.local.get(SETTINGS_STORAGE_KEY);
  state.settings = normalizeSettings(result?.[SETTINGS_STORAGE_KEY]);
  applySettingsToUI();
  applyCaptureButtonWidth(state.settings.captureButtonWidth);
  applyCaptureButtonTop(state.settings.captureButtonTopPercent);
  updateSettingsStatus("設定已載入", "success");
  return state.settings;
}

async function requestAutoSealFromBridge() {
  const payload = await bridgeJsonRequest("/api/integrity/auto-seal", {
    method: "POST",
    body: { dryRun: false },
    timeoutMs: 12000,
  });

  if (!payload?.success) {
    throw new Error(payload?.error || "auto-seal failed");
  }

  return payload;
}

async function requestVerifyIntegrityFromBridge() {
  const payload = await bridgeJsonRequest("/api/integrity/verify", {
    method: "POST",
    body: { timeoutMs: 12_000 },
    timeoutMs: 12000,
  });

  if (!payload?.success) {
    throw new Error(payload?.error || "verify failed");
  }

  return payload;
}

function createMemoryEntryViaBackground(entry) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: "memory.create", entry },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!response?.success) {
          reject(new Error(response?.error || "memory.create failed"));
          return;
        }
        resolve(response.entry || null);
      },
    );
  });
}

async function ensureSelfIterationBaselineMemory() {
  const entries = await listAllMemoryEntries();
  if (Array.isArray(entries) && entries.length > 0) {
    return false;
  }

  await createMemoryEntryViaBackground({
    ...SELF_ITERATION_BASELINE_MEMORY_ENTRY,
  });
  return true;
}

async function refreshStartupGuardInBackground() {
  try {
    await chrome.runtime.sendMessage({ action: "startupGuardRefresh" });
  } catch (err) {
    console.warn(
      "[SidePilot] Failed to refresh startup guard:",
      err?.message || err,
    );
  }
}

async function persistSettings(settings, options = {}) {
  const previous = normalizeSettings(state.settings);
  let normalized = normalizeSettings(settings);
  let statusText = options.statusText || "設定已儲存";
  let statusType = "success";
  let shouldReloadForSeal = false;
  let selfIterationToggled = false;

  const enablingSelfIterationFirstTime =
    !previous.selfIterationEnabled &&
    normalized.selfIterationEnabled &&
    previous.selfIterationFirstSealDone !== true;

  if (enablingSelfIterationFirstTime) {
    updateSettingsStatus("自我疊代啟用中，正在首次自動執行 SEAL...", "warning");
    try {
      const sealResult = await requestAutoSealFromBridge();
      const digestMatch = String(sealResult?.stdout || "").match(
        /Digest:\s*([0-9a-f]{8,64})/i,
      );
      const sealDigest = digestMatch
        ? digestMatch[1].slice(0, 8).toLowerCase()
        : "";
      if (!sealDigest) {
        throw new Error("auto-seal completed but digest not found in output");
      }
      await requestVerifyIntegrityFromBridge();
      try {
        const seeded = await ensureSelfIterationBaselineMemory();
        if (seeded) {
          addLog("info", "[BASW] 已建立自我疊代 baseline 記憶條目");
        }
      } catch (seedErr) {
        addLog(
          "warning",
          `[BASW] baseline 記憶補植失敗：${seedErr?.message || seedErr}`,
        );
      }
      normalized = normalizeSettings({
        ...normalized,
        selfIterationFirstSealDone: true,
        selfIterationLastError: "",
        selfIterationLastSealAt: Date.now(),
        selfIterationLastSealDigest: sealDigest,
      });
      addLog(
        "info",
        `[BASW] 首次自動 SEAL 完成 (${sealResult?.durationMs ?? "-"}ms)`,
      );
      showToast("首次 SEAL 完成，自我疊代保護已啟用", "success");
      shouldReloadForSeal = true;
    } catch (err) {
      const errorMessage = (err?.message || String(err)).slice(0, 380);
      normalized = normalizeSettings({
        ...normalized,
        selfIterationEnabled: false,
        selfIterationFirstSealDone: false,
        selfIterationLastError: errorMessage,
        selfIterationLastSealAt: 0,
        selfIterationLastSealDigest: "",
      });
      if (dom.settingSelfIterationEnabled) {
        dom.settingSelfIterationEnabled.checked = false;
      }
      statusText = "首次 SEAL 失敗，已取消啟用自我疊代";
      statusType = "error";
      addLog("error", `[BASW] 首次自動 SEAL 失敗: ${errorMessage}`);
      showToast(`首次 SEAL 失敗：${errorMessage}`, "error");
    }
  }

  await chrome.storage.local.set({ [SETTINGS_STORAGE_KEY]: normalized });
  state.settings = normalized;
  selfIterationToggled =
    previous.selfIterationEnabled !== normalized.selfIterationEnabled;

  if (normalized.playIntroEveryOpen) {
    localStorage.removeItem("intro_played");
  }

  if (normalized.showWarningOverlay) {
    localStorage.removeItem("copilot_warning_suppressed");
  } else {
    localStorage.setItem("copilot_warning_suppressed", "true");
  }

  applySettingsToUI();
  applyCaptureButtonWidth(state.settings.captureButtonWidth);
  applyCaptureButtonTop(state.settings.captureButtonTopPercent);

  if (options.showToast) {
    showToast("設定已儲存");
  }

  if (shouldReloadForSeal) {
    statusText = "首次 SEAL 已完成，正在重新載入擴充套件";
    statusType = "warning";
    updateSettingsStatus(statusText, statusType);
    setTimeout(() => {
      chrome.runtime.reload();
    }, 1200);
    return normalized;
  }

  if (selfIterationToggled) {
    await refreshStartupGuardInBackground();
  }

  updateSettingsStatus(statusText, statusType);
  return normalized;
}

function applySettingsToUI() {
  const settings = normalizeSettings(state.settings);
  state.settings = settings;

  if (dom.settingUiLanguage) {
    dom.settingUiLanguage.value = settings.uiLanguage;
  }
  if (dom.settingDisplayScale) {
    dom.settingDisplayScale.value = String(settings.displayScalePercent);
  }
  if (dom.settingAutoStartBridge) {
    dom.settingAutoStartBridge.checked =
      settings.autoStartBridgeEnabled !== false;
  }
  if (dom.settingBridgeWslDistro) {
    dom.settingBridgeWslDistro.value = settings.bridgeWslDistro || "";
    dom.settingBridgeWslDistro.placeholder = BRIDGE_WSL_DISTRO_HINT;
  }
  dom.bridgeRuntimeButtons?.forEach((button) => {
    button.dataset.active =
      button.dataset.runtime === settings.bridgeManualRuntime ? "true" : "false";
  });
  if (dom.settingAutoSdkLogin) {
    dom.settingAutoSdkLogin.checked = settings.autoSDKLoginGuide;
  }
  if (dom.settingSelfIterationEnabled) {
    dom.settingSelfIterationEnabled.checked =
      settings.selfIterationEnabled === true;
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
  if (dom.settingCaptureButtonTop) {
    dom.settingCaptureButtonTop.value = String(settings.captureButtonTopPercent);
  }
  if (dom.settingAntigravityBaseUrl) {
    dom.settingAntigravityBaseUrl.value = settings.antigravityBaseUrl;
  }
  if (dom.settingAntigravityToken) {
    dom.settingAntigravityToken.value = settings.antigravityToken;
  }
  if (dom.settingIframeEnabled) {
    dom.settingIframeEnabled.checked = settings.iframeEnabled === true;
  }
  updateIframeModeBtnState(settings.iframeEnabled === true);
  if (dom.settingLinkGuardMode) {
    dom.settingLinkGuardMode.value = settings.linkGuardMode || "allow";
  }
  if (dom.settingLinkAllowlist) {
    dom.settingLinkAllowlist.value = formatAllowlistForTextarea(
      settings.linkAllowlist,
      { allowEmpty: settings.linkGuardMode === "deny" },
    );
  }
  applySettingsI18n(settings.uiLanguage);
  applyDisplayScale(settings.displayScalePercent);
  updateDisplayScaleLabel(settings.displayScalePercent);
  updateCaptureWidthLabel(settings.captureButtonWidth);
  updateCaptureTopLabel(settings.captureButtonTopPercent);
  updateSelfIterationSealBadge(settings.uiLanguage);
  setAntigravityInstallDefaultHint(settings.antigravityBaseUrl);
  setBridgeInstallDefaultHint();
  refreshBridgeSetupUi();

  // Conversation records
  const sdkHistoryPath = document.getElementById("settingSdkHistoryPath");
  if (sdkHistoryPath) {
    sdkHistoryPath.value = "~/copilot/history";
  }
  const iframeHistoryUrl = document.getElementById("settingIframeHistoryUrl");
  if (iframeHistoryUrl) {
    iframeHistoryUrl.value =
      settings.iframeHistoryUrl || "https://github.com/copilot";
  }

  // Populate system identity editor and preview
  if (dom.settingsIdentityContent) {
    loadIdentityTemplate();
  }
}

function collectSettingsFromUI() {
  return normalizeSettings({
    uiLanguage: normalizeUiLanguage(
      dom.settingUiLanguage?.value || state.settings?.uiLanguage,
    ),
    displayScalePercent:
      dom.settingDisplayScale?.value || state.settings?.displayScalePercent,
    autoStartBridgeEnabled: !!dom.settingAutoStartBridge?.checked,
    autoStartBridgeCooldownMs:
      state.settings?.autoStartBridgeCooldownMs ||
      BRIDGE_AUTO_START_DEFAULT_COOLDOWN_MS,
    autoStartBridgeLastAttemptAt:
      state.settings?.autoStartBridgeLastAttemptAt || 0,
    autoStartBridgeLastResult:
      state.settings?.autoStartBridgeLastResult || "idle",
    autoStartBridgeLastError: state.settings?.autoStartBridgeLastError || "",
    bridgeManualRuntime: state.settings?.bridgeManualRuntime || "auto",
    bridgeProjectRootWindows: state.settings?.bridgeProjectRootWindows || "",
    bridgeProjectRootWsl: state.settings?.bridgeProjectRootWsl || "",
    bridgeWslDistro: dom.settingBridgeWslDistro?.value || "",
    autoSDKLoginGuide: !!dom.settingAutoSdkLogin?.checked,
    selfIterationEnabled: !!dom.settingSelfIterationEnabled?.checked,
    selfIterationFirstSealDone:
      state.settings?.selfIterationFirstSealDone === true,
    selfIterationLastError: state.settings?.selfIterationLastError || "",
    selfIterationLastSealAt: state.settings?.selfIterationLastSealAt || 0,
    selfIterationLastSealDigest:
      state.settings?.selfIterationLastSealDigest || "",
    playIntroEveryOpen: !!dom.settingPlayIntroEveryOpen?.checked,
    showWarningOverlay: !!dom.settingShowWarningOverlay?.checked,
    captureButtonWidth: dom.settingCaptureButtonWidth?.value,
    captureButtonTopPercent: dom.settingCaptureButtonTop?.value,
    antigravityBaseUrl: dom.settingAntigravityBaseUrl?.value,
    antigravityToken: dom.settingAntigravityToken?.value,
    iframeEnabled: !!dom.settingIframeEnabled?.checked,
    linkGuardMode: dom.settingLinkGuardMode?.value,
    linkAllowlist: dom.settingLinkAllowlist?.value,
    iframeHistoryUrl: document.getElementById("settingIframeHistoryUrl")?.value,
  });
}

// ── Identity Template Management ──

function getDefaultIdentityTemplate() {
  return SIDEPILOT_SYSTEM_IDENTITY.content;
}

async function loadIdentityTemplate() {
  if (state.identityTemplateLoaded) {
    updateIdentityPreview();
    return;
  }

  // Render module chips
  if (dom.identityModuleChips) {
    dom.identityModuleChips.innerHTML = IDENTITY_MODULES.map(
      (m) =>
        `<button class="identity-chip" data-token="${escapeAttr(m.token)}" title="${escapeAttr(m.token + " → " + m.resolve())}">${m.label}</button>`,
    ).join("");
    dom.identityModuleChips
      .querySelectorAll(".identity-chip")
      .forEach((chip) => {
        chip.addEventListener("click", () => {
          if (!dom.identityEditor) return;
          const token = chip.dataset.token;
          const ta = dom.identityEditor;
          const start = ta.selectionStart;
          const end = ta.selectionEnd;
          ta.value =
            ta.value.substring(0, start) + token + ta.value.substring(end);
          ta.selectionStart = ta.selectionEnd = start + token.length;
          ta.focus();
          updateIdentityPreview();
        });
      });
  }

  // Load saved template or use default
  const stored = await new Promise((resolve) => {
    chrome.storage.local.get(IDENTITY_STORAGE_KEY, (r) =>
      resolve(r[IDENTITY_STORAGE_KEY]),
    );
  });
  const template = stored || getDefaultIdentityTemplate();
  if (dom.identityEditor) dom.identityEditor.value = template;
  state.identityTemplateLoaded = true;
  updateIdentityPreview();

  // Wire events
  if (!state.identityUiBound) {
    dom.identityEditor?.addEventListener("input", updateIdentityPreview);
    dom.identitySaveBtn?.addEventListener("click", saveIdentityTemplate);
    dom.identityResetBtn?.addEventListener("click", resetIdentityTemplate);
    state.identityUiBound = true;
  }
}

function updateIdentityPreview() {
  if (!dom.settingsIdentityContent || !dom.identityEditor) return;
  const resolved = resolveIdentityTokens(dom.identityEditor.value);
  dom.settingsIdentityContent.textContent = resolved;
}

async function saveIdentityTemplate() {
  if (!dom.identityEditor) return;
  const template = dom.identityEditor.value;
  await new Promise((resolve) => {
    chrome.storage.local.set({ [IDENTITY_STORAGE_KEY]: template }, resolve);
  });
  // Update the runtime identity content with resolved values
  const resolved = resolveIdentityTokens(template);
  SIDEPILOT_SYSTEM_IDENTITY.content = resolved;
  SIDEPILOT_SYSTEM_IDENTITY.updatedAt = Date.now();
  updateIdentityPreview();
  showToast("擴充自述已儲存");
}

async function resetIdentityTemplate() {
  const defaultTemplate = getDefaultIdentityTemplate();
  if (dom.identityEditor) dom.identityEditor.value = defaultTemplate;
  await new Promise((resolve) => {
    chrome.storage.local.remove(IDENTITY_STORAGE_KEY, resolve);
  });
  SIDEPILOT_SYSTEM_IDENTITY.content = defaultTemplate;
  SIDEPILOT_SYSTEM_IDENTITY.updatedAt = Date.now();
  updateIdentityPreview();
  showToast("已還原為預設自述");
}

// Populate identity module chips for a given container + textarea pair
function setupModuleChips(container, textarea) {
  if (!container || !textarea) return;
  container.innerHTML = IDENTITY_MODULES.map(
    (m) =>
      `<button class="identity-chip" data-token="${escapeAttr(m.token)}" title="${escapeAttr(m.token + " → " + m.resolve())}">${m.label}</button>`,
  ).join("");
  container.querySelectorAll(".identity-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const token = chip.dataset.token;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.value =
        textarea.value.substring(0, start) +
        token +
        textarea.value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + token.length;
      textarea.focus();
    });
  });
}

function updateCaptureWidthLabel(width) {
  if (!dom.captureBtnWidthValue) return;
  const normalized = clampCaptureButtonWidth(width);
  dom.captureBtnWidthValue.textContent =
    normalized < 20 ? `${normalized}px (僅色塊)` : `${normalized}px`;
}

function updateDisplayScaleLabel(value) {
  if (!dom.displayScaleValue) return;
  const normalized = clampDisplayScalePercent(value);
  const isEnglish = getCurrentUiLanguage() === UI_LANGUAGE_EN;
  dom.displayScaleValue.textContent = isEnglish
    ? `Current: ${normalized}%`
    : `目前：${normalized}%`;
}

function updateIframeRiskDocLink(languageOverride) {
  if (!dom.iframeRiskDocLink) return;
  const language = getCurrentUiLanguage(languageOverride);
  const href =
    IFRAME_RISK_DOC_URLS[language] ||
    IFRAME_RISK_DOC_URLS[UI_LANGUAGE_FALLBACK] ||
    IFRAME_RISK_DOC_URLS[UI_LANGUAGE_EN];
  dom.iframeRiskDocLink.href = href;
}

function updateCaptureTopLabel(value) {
  if (!dom.captureBtnTopValue) return;
  const normalized = clampCaptureButtonTopPercent(value);
  const isEnglish = getCurrentUiLanguage() === UI_LANGUAGE_EN;
  dom.captureBtnTopValue.textContent = isEnglish
    ? `Current: ${normalized}%`
    : `目前：${normalized}%`;
}

function applyCaptureButtonWidth(width) {
  const normalized = clampCaptureButtonWidth(width);
  document.documentElement.style.setProperty(
    "--capture-button-width",
    `${normalized}px`,
  );

  // Hide text/icons when narrow
  dom.floatingCaptureBtn?.classList.toggle("capture-compact", normalized < 20);

  // Compute resting opacity based on width
  let opacity;
  if (normalized <= 20) {
    // 2-20px → 1.0 to 0.5
    opacity = 1.0 - ((normalized - 2) / 18) * 0.5;
  } else {
    // 21-100px → 0.5 to 0.8
    opacity = 0.5 + ((normalized - 21) / 79) * 0.3;
  }
  document.documentElement.style.setProperty(
    "--capture-btn-opacity",
    opacity.toFixed(3),
  );
}

function applyCaptureButtonTop(value) {
  const normalized = clampCaptureButtonTopPercent(value);
  document.documentElement.style.setProperty(
    "--capture-button-top",
    `${normalized}%`,
  );
}

function applyDisplayScale(value) {
  const normalized = clampDisplayScalePercent(value);
  document.documentElement.style.setProperty(
    "--display-scale",
    (normalized / 100).toFixed(2),
  );
}

async function saveSettings() {
  const nextSettings = collectSettingsFromUI();
  await persistSettings(nextSettings, { showToast: true });
}

function updateSettingsStatus(text, type = "info") {
  if (!dom.settingsStatus) return;
  dom.settingsStatus.textContent = text;
  dom.settingsStatus.className = `settings-status ${type}`;
}

async function persistSettingsPatch(partial = {}) {
  const next = normalizeSettings({
    ...state.settings,
    ...partial,
  });
  await chrome.storage.local.set({ [SETTINGS_STORAGE_KEY]: next });
  state.settings = next;
  refreshBridgeSetupUi();
  return next;
}

function getBridgeHealthUrl(port = SDK_BRIDGE_PORT) {
  return `http://localhost:${port}/health`;
}

function getBridgeAutoStartProtocolUrl() {
  const params = new URLSearchParams({
    source: "sidepilot-extension",
    v: "1",
  });
  if (chrome?.runtime?.id) {
    params.set("ext", chrome.runtime.id);
  }
  return `${BRIDGE_AUTO_START_PROTOCOL_BASE}?${params.toString()}`;
}

async function sendBridgeRuntimeMessage(payload) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(payload, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response || null);
    });
  });
}

async function bridgeJsonRequest(path, options = {}) {
  const response = await sendBridgeRuntimeMessage({
    action: "bridgeRequest",
    port: Number(options.port) || SDK_BRIDGE_PORT,
    path,
    method: options.method || "GET",
    body: options.body,
    timeoutMs: options.timeoutMs || 5000,
    requireAuth: options.requireAuth !== false,
  });

  if (!response?.success) {
    throw new Error(response?.error || `Bridge request failed: ${path}`);
  }

  return response.data;
}

async function getBridgeAuthToken(options = {}) {
  const response = await sendBridgeRuntimeMessage({
    action: "bridgeAuthBootstrap",
    port: Number(options.port) || SDK_BRIDGE_PORT,
    timeoutMs: options.timeoutMs || 2500,
    forceRefresh: options.forceRefresh === true,
  });

  if (!response?.success || !response?.token) {
    throw new Error(response?.error || "Bridge auth bootstrap failed");
  }

  return response.token;
}

async function createAuthorizedBridgeEventSource(path, options = {}) {
  const token = await getBridgeAuthToken({
    port: options.port,
    timeoutMs: options.timeoutMs,
    forceRefresh: options.forceRefresh,
  });
  const url = new URL(`http://localhost:${Number(options.port) || SDK_BRIDGE_PORT}${path}`);
  url.searchParams.set("token", token);
  return new EventSource(url.toString());
}

function normalizeBridgeManualRuntime(value) {
  return value === "windows" || value === "wsl" ? value : "auto";
}

function inferBridgeManualRuntime() {
  const settings = normalizeSettings(state.settings);
  if (settings.bridgeProjectRootWindows && !settings.bridgeProjectRootWsl) {
    return "windows";
  }
  if (settings.bridgeProjectRootWsl && !settings.bridgeProjectRootWindows) {
    return "wsl";
  }
  if (/runtime=wsl|\/mnt\//i.test(settings.autoStartBridgeLastError || "")) {
    return "wsl";
  }
  return "windows";
}

function getEffectiveBridgeRuntime(value = state.settings?.bridgeManualRuntime) {
  const normalized = normalizeBridgeManualRuntime(value);
  return normalized === "auto" ? inferBridgeManualRuntime() : normalized;
}

function getBridgeProjectRootHintWsl() {
  return BRIDGE_WORKDIR_HINT_WSL.replace(/\/scripts\/copilot-bridge$/i, "");
}

function convertWslPathToWindowsPath(value = "") {
  const matched = String(value).match(/^\/mnt\/([a-zA-Z])\/(.+)$/);
  if (!matched) return "";
  return `${matched[1].toUpperCase()}:\\${matched[2].replace(/\//g, "\\")}`;
}

function getBridgeWindowsWorkdirHint() {
  return convertWslPathToWindowsPath(BRIDGE_WORKDIR_HINT_WSL) || BRIDGE_WORKDIR_HINT;
}

function getBridgeProjectRootHintWindows() {
  return getBridgeWindowsWorkdirHint().replace(/[\\/]scripts[\\/]copilot-bridge$/i, "");
}

function getBridgeInstallScriptHintWindows(runtime = getEffectiveBridgeRuntime()) {
  if (runtime === "wsl") {
    const convertedRoot = convertWslPathToWindowsPath(getBridgeProjectRootHintWsl());
    if (convertedRoot) {
      return `${convertedRoot}\\scripts\\bridge-launcher\\windows\\install-launcher.ps1`;
    }
  }
  return `${getBridgeProjectRootHintWindows()}\\scripts\\bridge-launcher\\windows\\install-launcher.ps1`;
}

function getBridgeProjectRootPlaceholderWindows() {
  return "C:\\path\\to\\SidePilot";
}

function getBridgeProjectRootPlaceholderWsl() {
  return "/path/to/SidePilot";
}

function getConfiguredBridgeProjectRoot(runtime = getEffectiveBridgeRuntime()) {
  const settings = normalizeSettings(state.settings);
  return runtime === "wsl"
    ? settings.bridgeProjectRootWsl || ""
    : settings.bridgeProjectRootWindows || "";
}

function getBridgeProjectRootTemplateValue(runtime = getEffectiveBridgeRuntime()) {
  const configured = getConfiguredBridgeProjectRoot(runtime);
  if (configured) return configured;
  return runtime === "wsl"
    ? getBridgeProjectRootPlaceholderWsl()
    : getBridgeProjectRootPlaceholderWindows();
}

function getBridgeProjectRootSettingsPatch(runtime, value) {
  const cleaned = String(value || "").trim().replace(/[\r\n]+/g, " ");
  if (runtime === "wsl") {
    return { bridgeProjectRootWsl: cleaned.slice(0, 320) };
  }
  return { bridgeProjectRootWindows: cleaned.slice(0, 260) };
}

function getConfiguredBridgeWslDistro() {
  const settings = normalizeSettings(state.settings);
  return settings.bridgeWslDistro || "";
}

function buildBridgeWslDistroArg() {
  const distro = getConfiguredBridgeWslDistro();
  return distro ? ` -WslDistro "${distro}"` : "";
}

function getBridgeProjectRootHintText(runtime = getEffectiveBridgeRuntime(), language = getCurrentUiLanguage()) {
  const isEnglish = language === UI_LANGUAGE_EN;
  if (runtime === "wsl") {
    return isEnglish
      ? "Enter the Linux repo root. Quick Setup and manual start commands will reuse this path in bash."
      : "填入 Linux 內的 SidePilot repo 根目錄；Quick Setup 與手動啟動指令會以 bash 重用這個路徑。";
  }
  return isEnglish
    ? "Enter the Windows repo root. Quick Setup and manual start commands will reuse this path in PowerShell."
    : "填入 Windows 內的 SidePilot repo 根目錄；Quick Setup 與手動啟動指令會以 PowerShell 重用這個路徑。";
}

function getBridgeCommandShellLabel(runtime, language = getCurrentUiLanguage()) {
  const isEnglish = language === UI_LANGUAGE_EN;
  if (runtime === "wsl") {
    return isEnglish ? "bash" : "bash";
  }
  return isEnglish ? "PowerShell" : "PowerShell";
}

function buildBridgeInstallCommand(runtime = getEffectiveBridgeRuntime()) {
  if (runtime === "wsl") {
    return [
      "# Replace SIDEPILOT_ROOT with your local SidePilot repo path once",
      "# Quick Setup will install user-local nvm + Node 24 in the selected/default WSL distro if needed",
      `export SIDEPILOT_ROOT="${getBridgeProjectRootTemplateValue("wsl")}"`,
      'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$(wslpath -w "${SIDEPILOT_ROOT}/scripts/bridge-launcher/windows/bootstrap-bridge.ps1")" -ProjectRoot "${SIDEPILOT_ROOT}" -Runtime wsl -WslBridgeDir "${SIDEPILOT_ROOT}/scripts/copilot-bridge"' +
        buildBridgeWslDistroArg(),
    ].join("\n");
  }

  return [
    "# Replace SIDEPILOT_ROOT with your local SidePilot repo path once",
    `$env:SIDEPILOT_ROOT = "${getBridgeProjectRootTemplateValue("windows")}"`,
    '& powershell -NoProfile -ExecutionPolicy Bypass -File "$env:SIDEPILOT_ROOT\\scripts\\bridge-launcher\\windows\\bootstrap-bridge.ps1" -ProjectRoot "$env:SIDEPILOT_ROOT" -Runtime windows',
  ].join("\n");
}

function buildBridgeStartCommands(runtime = getEffectiveBridgeRuntime()) {
  const extensionId = chrome?.runtime?.id || "";
  if (runtime === "windows") {
    return [
      "# Paste into PowerShell",
      "# Replace SIDEPILOT_ROOT with your local SidePilot repo path once",
      `$env:SIDEPILOT_ROOT = "${getBridgeProjectRootTemplateValue("windows")}"`,
      'Set-Location "$env:SIDEPILOT_ROOT\\scripts\\copilot-bridge"',
      '$node24Dir = $null',
      'if (Test-Path "$env:LOCALAPPDATA\\Programs\\nodejs\\node.exe") { $node24Dir = "$env:LOCALAPPDATA\\Programs\\nodejs" }',
      'if (-not $node24Dir -and (Test-Path "$env:ProgramFiles\\nodejs\\node.exe")) { $node24Dir = "$env:ProgramFiles\\nodejs" }',
      'if (-not $node24Dir) {',
      "  $programFilesX86 = [Environment]::GetEnvironmentVariable('ProgramFiles(x86)')",
      '  if ($programFilesX86 -and (Test-Path (Join-Path $programFilesX86 "nodejs\\node.exe"))) {',
      '    $node24Dir = (Join-Path $programFilesX86 "nodejs")',
      "  }",
      "}",
      'if ($node24Dir) { $env:PATH = "$node24Dir;$env:PATH" }',
      extensionId
        ? `$env:SIDEPILOT_EXTENSION_ID = "${extensionId}"`
        : "# SIDEPILOT_EXTENSION_ID is unavailable in this context",
      "node -v",
      `node -e "const v=parseInt(process.versions.node.split('.')[0],10); if (!Number.isFinite(v) || v < 24) { console.error('Node.js 24+ required. Install Node 24+ and reopen PowerShell.'); process.exit(1); }"`,
      "npm install",
      "npm run start",
    ].join("\n");
  }

  return [
    "# Replace SIDEPILOT_ROOT with your local SidePilot repo path once",
    `export SIDEPILOT_ROOT="${getBridgeProjectRootTemplateValue("wsl")}"`,
    'cd "${SIDEPILOT_ROOT}/scripts/copilot-bridge"',
    extensionId
      ? `export SIDEPILOT_EXTENSION_ID=${extensionId}`
      : "# SIDEPILOT_EXTENSION_ID is unavailable in this context",
    "node -v",
    `node -e "const v=parseInt(process.versions.node.split('.')[0],10); if (!Number.isFinite(v) || v < 24) { console.error('Node.js 24+ required. Run Quick Setup first, or run: nvm install 24 && nvm use 24'); process.exit(1); }"`,
    "npm install",
    "npm run start",
  ].join("\n");
}

function buildBridgeCheckCommand(port = SDK_BRIDGE_PORT) {
  const url = getBridgeHealthUrl(port);
  return `powershell -Command "Invoke-RestMethod ${url}"`;
}

function getBridgeRuntimeLabel(runtime = getEffectiveBridgeRuntime(), language = getCurrentUiLanguage()) {
  const effective = runtime === "auto" ? getEffectiveBridgeRuntime(runtime) : runtime;
  const isEnglish = language === UI_LANGUAGE_EN;
  if (effective === "windows") {
    return isEnglish ? "Windows" : "Windows";
  }
  if (effective === "wsl") {
    return "WSL";
  }
  return isEnglish ? "Auto" : "自動";
}

function getBridgeLauncherConfigHint(language = getCurrentUiLanguage()) {
  const isEnglish = language === UI_LANGUAGE_EN;
  return isEnglish
    ? "Changing repo root, runtime, or WSL distro updates the copied commands only. Re-run Quick Setup so sidepilot:// auto-start uses the same settings."
    : "變更 repo root、runtime 或 WSL distro 只會更新複製出的指令；若要讓 sidepilot:// 自動啟動跟著更新，請重新執行 Quick Setup。";
}

function buildBridgeDiagnostics(runtime = getEffectiveBridgeRuntime(), language = getCurrentUiLanguage()) {
  const isEnglish = language === UI_LANGUAGE_EN;
  const settings = normalizeSettings(state.settings);
  const probe = state.bridgeLastProbe || {};
  const root = getConfiguredBridgeProjectRoot(runtime);
  const distro = getConfiguredBridgeWslDistro();
  const lastError = String(settings.autoStartBridgeLastError || "");
  const lines = [];

  lines.push(
    isEnglish
      ? `Runtime: ${getBridgeRuntimeLabel(runtime, language)} | Shell: ${getBridgeCommandShellLabel(runtime, language)}`
      : `Runtime: ${getBridgeRuntimeLabel(runtime, language)} | Shell: ${getBridgeCommandShellLabel(runtime, language)}`,
  );
  lines.push(
    isEnglish
      ? `Repo root: ${root || "(not set; commands still use placeholder path)"}`
      : `Repo root: ${root || "（尚未設定，複製指令仍會使用 placeholder 路徑）"}`,
  );
  if (runtime === "wsl") {
    lines.push(
      isEnglish
        ? `WSL distro: ${distro || "(default distro)"}`
        : `WSL distro: ${distro || "（預設 distro）"}`,
    );
  }

  if (probe.connected) {
    lines.push(
      isEnglish
        ? `Bridge probe: healthy${probe.backendType ? ` | backend=${probe.backendType}` : ""}${probe.sdkState ? ` | sdk=${probe.sdkState}` : ""}`
        : `Bridge probe: healthy${probe.backendType ? ` | backend=${probe.backendType}` : ""}${probe.sdkState ? ` | sdk=${probe.sdkState}` : ""}`,
    );
    lines.push(
      isEnglish
        ? "Diagnosis: current launch path is working."
        : "診斷：目前啟動鏈路可正常工作。",
    );
    return lines.join("\n");
  }

  if (!root) {
    lines.push(
      isEnglish
        ? "Likely blocker: repo root is empty, so copied commands still contain a placeholder path."
        : "可能阻塞點：repo root 尚未填入，複製出的指令仍包含 placeholder 路徑。",
    );
  }

  if (probe.text) {
    lines.push(
      isEnglish
        ? `Latest probe: ${probe.text}${probe.detail ? ` | ${probe.detail}` : ""}`
        : `最近 probe：${probe.text}${probe.detail ? ` | ${probe.detail}` : ""}`,
    );
  }

  if (/BRG-AUTO-001/i.test(lastError)) {
    lines.push(
      isEnglish
        ? "Likely blocker: sidepilot:// launcher is unavailable or the browser/OS blocked the protocol handoff. Re-run Quick Setup and confirm the protocol prompt."
        : "可能阻塞點：sidepilot:// 啟動器不可用，或被瀏覽器 / 系統擋下。請重新執行 Quick Setup，並確認協定喚起提示有放行。",
    );
  }
  if (/LCH-003|Bridge directory not found|WSL bridge directory not found/i.test(lastError)) {
    lines.push(
      isEnglish
        ? "Likely blocker: launcher is still pointing at an old repo path/runtime. Re-run Quick Setup after updating repo root/runtime/WSL distro."
        : "可能阻塞點：launcher 還指向舊的 repo 路徑或 runtime。更新 repo root/runtime/WSL distro 後，請重新執行 Quick Setup。",
    );
  }
  if (/LCH-004|Node\.js v?24\+|Install Node\.js 24/i.test(lastError)) {
    lines.push(
      isEnglish
        ? "Likely blocker: Node.js 24+ is missing in the selected runtime."
        : "可能阻塞點：所選 runtime 缺少 Node.js 24+。",
    );
  }
  if (/BRG-AUTO-002|LCH-005|timeout/i.test(lastError)) {
    lines.push(
      isEnglish
        ? "Likely blocker: the launcher ran, but the bridge never became healthy. Check npm install/build output, Copilot CLI login, and whether another process is holding port 31031."
        : "可能阻塞點：launcher 已執行，但 bridge 沒有進入 healthy。請檢查 npm install/build 輸出、Copilot CLI 登入狀態，以及是否有其他程序佔用 31031。",
    );
  }
  if (probe.text === "不是 SidePilot Bridge") {
    lines.push(
      isEnglish
        ? "Likely blocker: another service is already listening on port 31031."
        : "可能阻塞點：目前有其他服務佔用了 31031。",
    );
  }
  if (probe.text === "Bridge 未啟動或版本不符") {
    lines.push(
      isEnglish
        ? "Likely blocker: the process on port 31031 is not exposing the current SidePilot Bridge endpoints."
        : "可能阻塞點：31031 上的程序不是目前版本的 SidePilot Bridge，或端點不相容。",
    );
  }
  if (runtime === "windows") {
    lines.push(
      isEnglish
        ? "Windows note: copied commands are now PowerShell commands. Pasting them into cmd.exe will not work as-is."
        : "Windows 提醒：目前複製出的指令是 PowerShell 版本，直接貼進 cmd.exe 不會正常執行。",
    );
  }
  if (runtime === "wsl" && !distro) {
    lines.push(
      isEnglish
        ? "WSL note: Quick Setup uses the default distro when WSL distro is left empty. If that is not the right distro, fill in the exact distro name first."
        : "WSL 提醒：若 WSL distro 留空，Quick Setup 會使用預設 distro。若預設不是你要的環境，請先填入正確的 distro 名稱。",
    );
  }
  if (runtime === "wsl" && distro) {
    lines.push(
      isEnglish
        ? `WSL note: Quick Setup and sidepilot:// launcher will target distro "${distro}" after Quick Setup is re-run.`
        : `WSL 提醒：重新執行 Quick Setup 後，Quick Setup 與 sidepilot:// launcher 會改用 distro "${distro}"。`,
    );
  }

  if (!lastError && !probe.text) {
    lines.push(
      isEnglish
        ? "Diagnosis: no recent launcher/probe error yet. Run Quick Setup or click Check Again to collect a concrete failure."
        : "診斷：目前還沒有最近一次 launcher/probe 失敗資訊。請先執行 Quick Setup，或按一次「重新檢查」收集具體錯誤。",
    );
  }

  return lines.join("\n");
}

function getBridgeBadgeModel(kind, language = getCurrentUiLanguage()) {
  const isEnglish = language === UI_LANGUAGE_EN;
  switch (kind) {
    case "ready":
      return { text: isEnglish ? "Ready" : "就緒", type: "success" };
    case "starting":
      return { text: isEnglish ? "Starting" : "啟動中", type: "warning" };
    case "warning":
      return { text: isEnglish ? "Check" : "需檢查", type: "warning" };
    case "offline":
      return { text: isEnglish ? "Offline" : "離線", type: "error" };
    case "install":
      return { text: isEnglish ? "Not Installed" : "未安裝", type: "warning" };
    case "manual":
      return { text: isEnglish ? "Manual" : "手動", type: "info" };
    default:
      return { text: isEnglish ? "Unknown" : "未知", type: "info" };
  }
}

function extractBridgeStatusCode(value = "") {
  const matched = String(value).match(/(BRG-AUTO-\d{3}|LCH-\d{3})/);
  return matched ? matched[1] : "";
}

function formatBridgeAutoStartSummary(language = getCurrentUiLanguage()) {
  const isEnglish = language === UI_LANGUAGE_EN;
  const settings = normalizeSettings(state.settings);
  const code = extractBridgeStatusCode(settings.autoStartBridgeLastError);
  if (state.bridgeAutoStartInFlight || settings.autoStartBridgeLastResult === "launching") {
    return {
      label: isEnglish ? "Launcher is starting the bridge." : "啟動器正在喚起 Bridge。",
      detail: isEnglish
        ? `Auto-start in progress via ${getBridgeRuntimeLabel(settings.bridgeManualRuntime, language)}`
        : `目前使用 ${getBridgeRuntimeLabel(settings.bridgeManualRuntime, language)} 路徑自動啟動`,
      launcherKind: "starting",
    };
  }
  if (settings.autoStartBridgeLastResult === "ready") {
    return {
      label: isEnglish ? "Launcher succeeded last time." : "上次自動啟動成功。",
      detail: isEnglish ? "sidepilot:// launcher responded and the bridge became healthy." : "sidepilot:// 啟動器已成功帶起 Bridge。",
      launcherKind: "ready",
    };
  }
  if (code === "BRG-AUTO-001") {
    return {
      label: isEnglish ? "Launcher unavailable or blocked." : "啟動器不可用或被瀏覽器阻擋。",
      detail: settings.autoStartBridgeLastError || "-",
      launcherKind: "install",
    };
  }
  if (code === "BRG-AUTO-002") {
    return {
      label: isEnglish ? "Launcher responded, but bridge startup timed out." : "啟動器已觸發，但 Bridge 啟動逾時。",
      detail: settings.autoStartBridgeLastError || "-",
      launcherKind: "warning",
    };
  }
  if (code === "BRG-AUTO-003") {
    return {
      label: isEnglish ? "Auto-start cooldown is active." : "自動啟動冷卻中。",
      detail: settings.autoStartBridgeLastError || "-",
      launcherKind: "warning",
    };
  }
  return {
    label: isEnglish ? "Launcher state is unknown." : "尚未確認啟動器狀態。",
    detail: isEnglish
      ? "Use the primary action to try auto-start or copy the Quick Setup command."
      : "可先嘗試自動啟動，或複製 Quick Setup 指令。",
    launcherKind: "unknown",
  };
}

function refreshBridgeSetupUi() {
  const language = getCurrentUiLanguage();
  const isEnglish = language === UI_LANGUAGE_EN;
  const settings = normalizeSettings(state.settings);
  const runtime = getEffectiveBridgeRuntime(settings.bridgeManualRuntime);
  const summary = formatBridgeAutoStartSummary(language);
  const bridgeProbe = state.bridgeLastProbe || {};

  let bridgeKind = "offline";
  if (bridgeProbe.connected) {
    bridgeKind = "ready";
  } else if (state.bridgeAutoStartInFlight || settings.autoStartBridgeLastResult === "launching") {
    bridgeKind = "starting";
  }

  const launcherBadge = getBridgeBadgeModel(summary.launcherKind, language);
  const bridgeBadge = getBridgeBadgeModel(bridgeKind, language);

  if (dom.bridgeLauncherBadge) {
    dom.bridgeLauncherBadge.textContent = `${isEnglish ? "Launcher" : "Launcher"}: ${launcherBadge.text}`;
    dom.bridgeLauncherBadge.dataset.status = launcherBadge.type;
  }
  if (dom.bridgeBridgeBadge) {
    dom.bridgeBridgeBadge.textContent = `${isEnglish ? "Bridge" : "Bridge"}: ${bridgeBadge.text}`;
    dom.bridgeBridgeBadge.dataset.status = bridgeBadge.type;
  }
  if (dom.bridgeRuntimeBadge) {
    dom.bridgeRuntimeBadge.textContent = `${isEnglish ? "Runtime" : "Runtime"}: ${getBridgeRuntimeLabel(runtime, language)}`;
    dom.bridgeRuntimeBadge.dataset.status = runtime === "wsl" ? "warning" : "info";
  }

  if (dom.bridgeAdvancedRuntimeHint) {
    dom.bridgeAdvancedRuntimeHint.textContent = isEnglish
      ? `Showing ${getBridgeCommandShellLabel(runtime, language)} commands for ${getBridgeRuntimeLabel(runtime, language)}. ${getBridgeLauncherConfigHint(language)}`
      : `目前顯示 ${getBridgeRuntimeLabel(runtime, language)} 路徑的 ${getBridgeCommandShellLabel(runtime, language)} 安裝與手動啟動指令。${getBridgeLauncherConfigHint(language)}`;
  }
  if (dom.bridgeProjectRootHint) {
    dom.bridgeProjectRootHint.textContent = getBridgeProjectRootHintText(
      runtime,
      language,
    );
  }
  if (dom.settingBridgeProjectRoot) {
    const configuredRoot = getConfiguredBridgeProjectRoot(runtime);
    if (document.activeElement !== dom.settingBridgeProjectRoot) {
      dom.settingBridgeProjectRoot.value = configuredRoot;
    }
    dom.settingBridgeProjectRoot.placeholder =
      runtime === "wsl"
        ? getBridgeProjectRootPlaceholderWsl()
        : getBridgeProjectRootPlaceholderWindows();
  }
  if (dom.bridgeInstallCommandPreview) {
    dom.bridgeInstallCommandPreview.value = buildBridgeInstallCommand(runtime);
  }
  if (dom.bridgeCommandPreview) {
    dom.bridgeCommandPreview.value = buildBridgeStartCommands(runtime);
  }
  if (dom.bridgeLastResultDetail) {
    dom.bridgeLastResultDetail.textContent = `${summary.label}\n${summary.detail || "-"}`;
  }
  if (dom.bridgeDiagnosticPreview) {
    dom.bridgeDiagnosticPreview.value = buildBridgeDiagnostics(runtime, language);
  }

  const advancedOpen = dom.bridgeAdvancedPanel && !dom.bridgeAdvancedPanel.classList.contains("hidden");
  if (dom.bridgeAdvancedToggleBtn) {
    dom.bridgeAdvancedToggleBtn.textContent = advancedOpen
      ? translateSettingsKey("settings.bridge.advanced.hide", language)
      : translateSettingsKey("settings.bridge.advanced.show", language);
    dom.bridgeAdvancedToggleBtn.setAttribute(
      "aria-expanded",
      advancedOpen ? "true" : "false",
    );
  }

  let primaryKey = "settings.bridge.primary.start";
  let primaryDisabled = false;
  if (state.bridgeAutoStartInFlight || settings.autoStartBridgeLastResult === "launching") {
    primaryKey = "settings.bridge.primary.starting";
    primaryDisabled = true;
  } else if (bridgeProbe.connected) {
    primaryKey = "settings.bridge.primary.ready";
  } else if (summary.launcherKind === "install") {
    primaryKey = "settings.bridge.primary.install";
  } else if (
    settings.autoStartBridgeLastResult === "failed" &&
    settings.autoStartBridgeLastError
  ) {
    primaryKey = "settings.bridge.primary.retry";
  }

  if (dom.bridgePrimaryBtn) {
    dom.bridgePrimaryBtn.textContent = translateSettingsKey(primaryKey, language);
    dom.bridgePrimaryBtn.disabled = primaryDisabled;
    dom.bridgePrimaryBtn.dataset.action =
      primaryKey === "settings.bridge.primary.install"
        ? "copy-install"
        : bridgeProbe.connected
          ? "check"
          : "start";
  }

  dom.bridgeRuntimeButtons?.forEach((button) => {
    button.dataset.active =
      button.dataset.runtime === settings.bridgeManualRuntime ? "true" : "false";
    const runtimeLabel =
      button.dataset.runtime === "windows"
        ? translateSettingsKey("settings.bridge.runtime.windows", language)
        : button.dataset.runtime === "wsl"
          ? translateSettingsKey("settings.bridge.runtime.wsl", language)
          : translateSettingsKey("settings.bridge.runtime.auto", language);
    button.textContent = runtimeLabel;
  });
}

function isBridgeAutoStartCoolingDown(settings = state.settings) {
  const normalized = normalizeSettings(settings);
  const lastAttemptAt = Number(normalized.autoStartBridgeLastAttemptAt) || 0;
  if (lastAttemptAt <= 0) {
    return { coolingDown: false, remainingMs: 0 };
  }
  const elapsed = Date.now() - lastAttemptAt;
  const remainingMs = normalized.autoStartBridgeCooldownMs - elapsed;
  if (remainingMs > 0) {
    return { coolingDown: true, remainingMs };
  }
  return { coolingDown: false, remainingMs: 0 };
}

async function triggerBridgeLauncherProtocol(options = {}) {
  try {
    const response = await chrome.runtime.sendMessage({
      action: "openExternalLink",
      url: getBridgeAutoStartProtocolUrl(),
    });
    if (!response?.success) {
      throw new Error(response?.error || "openExternalLink failed");
    }
    if (options.showToast) {
      showToast("已嘗試喚起 Bridge 啟動器", "success", 1800);
    }
    return { success: true, code: "" };
  } catch (err) {
    const error = err?.message || String(err);
    return { success: false, code: "BRG-AUTO-001", error };
  }
}

async function waitBridgeReadyAfterLaunch(
  timeoutMs = BRIDGE_AUTO_START_TIMEOUT_MS,
) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "bridgeHealth",
        port: SDK_BRIDGE_PORT,
        timeoutMs: 2500,
      });
      const sdkState = response?.data?.sdk || "";
      const okStates = ["ready", "idle", "connected", ""];
      if (
        response?.success &&
        response?.isBridge &&
        okStates.includes(sdkState)
      ) {
        return true;
      }
    } catch {
      // keep polling
    }
    await sleep(BRIDGE_AUTO_START_POLL_INTERVAL_MS);
  }
  return false;
}

async function runBridgeAutoStartAttempt(options = {}) {
  const toastEnabled = options.showToast === true;
  const bypassCooldown = options.bypassCooldown === true;
  const source = options.source || "auto";
  const normalized = normalizeSettings(state.settings);
  if (normalized.autoStartBridgeEnabled !== true && !options.force) {
    return { success: false, code: "BRG-AUTO-DISABLED" };
  }

  if (!bypassCooldown) {
    const cool = isBridgeAutoStartCoolingDown(normalized);
    if (cool.coolingDown) {
      const remainSec = Math.max(1, Math.ceil(cool.remainingMs / 1000));
      const detail = `BRG-AUTO-003 | cooldown ${remainSec}s`;
      setBridgeInstallStatus("自動啟動冷卻中", detail, "warning");
      if (toastEnabled) {
        showToast(`自動啟動冷卻中（${remainSec}s）`, "warning");
      }
      return { success: false, code: "BRG-AUTO-003", detail };
    }
  }

  const attemptAt = Date.now();
  await persistSettingsPatch({
    autoStartBridgeLastAttemptAt: attemptAt,
    autoStartBridgeLastResult: "launching",
    autoStartBridgeLastError: "",
  });

  setBridgeInstallStatus(
    "嘗試喚起 Bridge 啟動器...",
    `source: ${source}`,
    "warning",
  );

  const launchResult = await triggerBridgeLauncherProtocol({
    showToast: false,
  });
  if (!launchResult.success) {
    const detail = `${launchResult.code} | ${launchResult.error || "launcher blocked"}`;
    await persistSettingsPatch({
      autoStartBridgeLastResult: "failed",
      autoStartBridgeLastError: detail,
    });
    setBridgeInstallStatus("自動啟動失敗", detail, "error");
    if (toastEnabled) {
      showToast("自動啟動 Bridge 失敗，請手動點擊「啟動 Bridge」", "error");
    }
    return { success: false, code: launchResult.code, detail };
  }

  const ready = await waitBridgeReadyAfterLaunch();
  if (!ready) {
    const detail = `BRG-AUTO-002 | timeout ${Math.round(BRIDGE_AUTO_START_TIMEOUT_MS / 1000)}s`;
    await persistSettingsPatch({
      autoStartBridgeLastResult: "failed",
      autoStartBridgeLastError: detail,
    });
    setBridgeInstallStatus("Bridge 啟動逾時", detail, "error");
    if (toastEnabled) {
      showToast("Bridge 啟動逾時，請改用手動啟動", "warning");
    }
    return { success: false, code: "BRG-AUTO-002", detail };
  }

  await persistSettingsPatch({
    autoStartBridgeLastResult: "ready",
    autoStartBridgeLastError: "",
  });
  setBridgeInstallStatus(
    "Bridge 已自動啟動",
    getBridgeHealthUrl(SDK_BRIDGE_PORT),
    "success",
  );
  checkBridgeHealth({ showToast: false }).catch(() => {});
  if (toastEnabled) {
    showToast("Bridge 已就緒", "success", 1800);
  }
  return { success: true, code: "" };
}

async function ensureSDKBridgeReadyWithAutoStart(options = {}) {
  const directReady = await ensureSDKBridgeConnection({
    port: SDK_BRIDGE_PORT,
  });
  if (directReady) {
    return { success: true, autoStarted: false };
  }

  if (state.bridgeAutoStartInFlight) {
    return state.bridgeAutoStartInFlight;
  }

  const task = runBridgeAutoStartAttempt(options).finally(() => {
    state.bridgeAutoStartInFlight = null;
  });
  state.bridgeAutoStartInFlight = task;
  return task;
}

// Cache last bridge status to avoid unnecessary DOM updates
let _lastBridgeStatus = { text: "", detail: "", type: "" };

function setBridgeInstallStatus(statusText, detailText, type = "info") {
  if (!dom.bridgeInstallStatus) return;

  // Skip DOM update if nothing changed
  if (
    _lastBridgeStatus.text === statusText &&
    _lastBridgeStatus.detail === detailText &&
    _lastBridgeStatus.type === type
  ) {
    return;
  }
  _lastBridgeStatus = { text: statusText, detail: detailText, type };

  dom.bridgeInstallStatus.textContent = statusText;
  dom.bridgeInstallStatus.dataset.status = type;
  if (dom.bridgeStatusDot) {
    dom.bridgeStatusDot.dataset.status = type;
  }
  updateSdkStatusDot(type);

  if (dom.bridgeInstallDetail) {
    dom.bridgeInstallDetail.textContent = detailText || "-";
  }
  refreshBridgeSetupUi();
}

function setBridgeInstallDefaultHint() {
  if (!dom.bridgeInstallStatus || !dom.bridgeInstallDetail) return;
  const runtime = getEffectiveBridgeRuntime();
  const installHint = formatBridgeAutoStartSummary().label;
  if (
    !dom.bridgeInstallStatus.textContent ||
    dom.bridgeInstallStatus.textContent === "尚未檢查"
  ) {
    dom.bridgeInstallDetail.textContent =
      `${installHint} | runtime: ${getBridgeRuntimeLabel(runtime)} | localhost:${SDK_BRIDGE_PORT}`;
  }
  refreshBridgeSetupUi();
}

let _lastAntigravityStatus = { text: "", detail: "", type: "" };

function getAntigravityProbeConfig() {
  return {
    baseUrl: normalizeAntigravityBaseUrl(
      dom.settingAntigravityBaseUrl?.value || state.settings?.antigravityBaseUrl,
    ),
    token: normalizeAntigravityToken(
      dom.settingAntigravityToken?.value || state.settings?.antigravityToken,
    ),
  };
}

function setAntigravityInstallStatus(statusText, detailText, type = "info") {
  if (!dom.antigravityInstallStatus) return;

  if (
    _lastAntigravityStatus.text === statusText &&
    _lastAntigravityStatus.detail === detailText &&
    _lastAntigravityStatus.type === type
  ) {
    return;
  }
  _lastAntigravityStatus = { text: statusText, detail: detailText, type };

  dom.antigravityInstallStatus.textContent = statusText;
  dom.antigravityInstallStatus.dataset.status = type;
  if (dom.antigravityStatusDot) {
    dom.antigravityStatusDot.dataset.status = type;
  }
  if (dom.antigravityInstallDetail) {
    dom.antigravityInstallDetail.textContent = detailText || "-";
  }
}

function setAntigravityInstallDefaultHint(baseUrl = state.settings?.antigravityBaseUrl) {
  if (!dom.antigravityInstallStatus || !dom.antigravityInstallDetail) return;
  if (
    !dom.antigravityInstallStatus.textContent ||
    dom.antigravityInstallStatus.textContent === "尚未檢查"
  ) {
    const normalizedBaseUrl = normalizeAntigravityBaseUrl(baseUrl);
    dom.antigravityInstallDetail.textContent =
      `預設探測：${normalizedBaseUrl}/health`;
  }
}

function formatAntigravityProbeDetail(payload, fallbackBaseUrl) {
  const bridge = payload?.bridge || {};
  const config = payload?.config || {};
  const parts = [bridge.url || fallbackBaseUrl];

  if (bridge.status) parts.push(`bridge: ${bridge.status}`);
  if (bridge.port) parts.push(`port: ${bridge.port}`);
  if (bridge.serviceLabel) parts.push(`service: ${bridge.serviceLabel}`);
  if (typeof bridge.chatReady === "boolean") {
    parts.push(bridge.chatReady ? "chatReady: yes" : "chatReady: no");
  }
  if (config.serviceUrl) parts.push(`runtime: ${config.serviceUrl}`);
  if (config.languageServerUrl) parts.push("ls: ready");

  return parts.filter(Boolean).join(" | ");
}

async function runAntigravityProviderProbe(probe = "health", options = {}) {
  const { baseUrl, token } = getAntigravityProbeConfig();
  const toastEnabled = options.showToast === true;
  const normalizedProbe = String(probe || "health").toLowerCase();

  if (
    normalizedProbe !== "health" &&
    !token &&
    toastEnabled
  ) {
    const detail = `${baseUrl} | 需要 Bearer token`;
    setAntigravityInstallStatus("請先輸入 Bridge Token", detail, "warning");
    showToast("Antigravity 進階探測需要 Bridge Token", "warning");
    return { success: false, requiresAuth: true, baseUrl };
  }

  if (toastEnabled) {
    setAntigravityInstallStatus(
      "探測中...",
      `${baseUrl} | ${normalizedProbe}`,
      "warning",
    );
  }

  try {
    const response = await chrome.runtime.sendMessage({
      action: "antigravityProbe",
      probe: normalizedProbe,
      baseUrl,
      token,
      timeoutMs: 3500,
    });

    if (response?.success && response?.isAntigravity) {
      const detail = formatAntigravityProbeDetail(response.data, baseUrl);
      const chatReady = response?.data?.bridge?.chatReady === true;
      const statusText =
        normalizedProbe === "health"
          ? chatReady
            ? "Antigravity bridge 已偵測"
            : "Antigravity bridge 已偵測，但 chat 未就緒"
          : normalizedProbe === "meta"
            ? "Antigravity meta 讀取成功"
            : normalizedProbe === "detect"
              ? "Antigravity 設定偵測成功"
              : "Antigravity 已連線";
      const statusType =
        normalizedProbe === "health" && !chatReady ? "warning" : "success";
      setAntigravityInstallStatus(statusText, detail, statusType);
      if (toastEnabled) {
        showToast(statusText, statusType, 1800);
      }
      return response;
    }

    if (response?.requiresAuth) {
      const detail = `${baseUrl} | ${response?.error || "unauthorized"}`;
      setAntigravityInstallStatus("需要 Bridge Token", detail, "warning");
      if (toastEnabled) {
        showToast("Antigravity 需要 Bridge Token", "warning");
      }
      return response;
    }

    if (response?.status === 404) {
      const detail = `${baseUrl} | endpoint not found`;
      setAntigravityInstallStatus("不是支援的 Antigravity bridge", detail, "warning");
      if (toastEnabled) {
        showToast("Antigravity probe 回應 404", "warning");
      }
      return response;
    }

    const detail = `${baseUrl} | ${response?.error || "probe failed"}`;
    setAntigravityInstallStatus("Antigravity 探測失敗", detail, "error");
    if (toastEnabled) {
      showToast("Antigravity 探測失敗", "error");
    }
    return response;
  } catch (err) {
    const detail = `${baseUrl} | ${err?.message || err}`;
    setAntigravityInstallStatus("Antigravity 探測失敗", detail, "error");
    if (toastEnabled) {
      showToast("Antigravity 探測失敗", "error");
    }
    return { success: false, error: err?.message || String(err), baseUrl };
  }
}

async function checkBridgeHealth(options = {}) {
  const port = SDK_BRIDGE_PORT;
  const url = getBridgeHealthUrl(port);
  const toastEnabled = options.showToast !== false;
  const isQuietPoll = !toastEnabled;

  // Only show "檢查中..." on manual/first check, not on silent 1-sec polling
  if (!isQuietPoll) {
    setBridgeInstallStatus("檢查中...", url, "warning");
  }

  try {
    const response = await chrome.runtime.sendMessage({
      action: "bridgeHealth",
      port,
      timeoutMs: 3000,
    });

    if (response?.success) {
      if (response?.isBridge) {
        const sdkStateValue = response?.data?.sdk || "";
        const sdkState = sdkStateValue ? `sdk: ${sdkStateValue}` : "";
        const backendType = response?.data?.backend?.type
          ? `backend: ${response.data.backend.type}`
          : "";
        const detail = [url, sdkState, backendType].filter(Boolean).join(" | ");
        const okStates = ["ready", "idle", "connected", ""];
        const statusType = okStates.includes(sdkStateValue)
          ? "success"
          : "warning";
        state.bridgeLastProbe = {
          connected: statusType === "success",
          isBridge: true,
          text: "Bridge 已連線",
          detail,
          type: statusType,
          url,
          sdkState: sdkStateValue,
          service: response?.data?.service || "",
          backendType: response?.data?.backend?.type || "",
          checkedAt: Date.now(),
        };
        setBridgeInstallStatus("Bridge 已連線", detail, statusType);
        if (toastEnabled) {
          showToast(
            statusType === "success"
              ? "Bridge 已連線"
              : "Bridge 已連線但狀態異常",
            statusType === "success" ? "success" : "warning",
          );
        }

        // Only load models on first connection or manual check, not every 1-sec tick
        if (!isQuietPoll || !state.bridgeModelsLoaded) {
          const connected = await ensureSDKBridgeConnection({ port });
          if (connected) {
            await loadSDKModelOptions();
            state.bridgeModelsLoaded = true;
          }
        }
        return;
      }

      const serviceName = response?.data?.service || "unknown";
      state.bridgeLastProbe = {
        connected: false,
        isBridge: false,
        text: "不是 SidePilot Bridge",
        detail: `service: ${serviceName}`,
        type: "warning",
        url,
        sdkState: "",
        service: serviceName,
        backendType: "",
        checkedAt: Date.now(),
      };
      setBridgeInstallStatus(
        "不是 SidePilot Bridge",
        `service: ${serviceName}`,
        "warning",
      );
      if (toastEnabled) showToast("埠口不是 SidePilot Bridge", "warning");
      state.bridgeModelsLoaded = false;
      return;
    }

    const statusCode = response?.status;
    if (statusCode === 404) {
      const runtime = getEffectiveBridgeRuntime();
      const detail =
        `HTTP 404 | runtime: ${getBridgeRuntimeLabel(runtime)} | localhost:${SDK_BRIDGE_PORT}`;
      state.bridgeLastProbe = {
        connected: false,
        isBridge: false,
        text: "Bridge 未啟動或版本不符",
        detail,
        type: "warning",
        url,
        sdkState: "",
        service: "",
        backendType: "",
        checkedAt: Date.now(),
      };
      setBridgeInstallStatus(
        "Bridge 未啟動或版本不符",
        detail,
        "warning",
      );
      if (toastEnabled) showToast("Bridge 回應 404，請確認安裝或啟動流程", "warning");
      state.bridgeModelsLoaded = false;
      return;
    }

    const errMessage = response?.error || "連線失敗";
    const runtime = getEffectiveBridgeRuntime();
    const failureDetail =
      `${errMessage} | runtime: ${getBridgeRuntimeLabel(runtime)} | localhost:${SDK_BRIDGE_PORT}`;
    state.bridgeLastProbe = {
      connected: false,
      isBridge: false,
      text: "無法連線",
      detail: failureDetail,
      type: "error",
      url,
      sdkState: "",
      service: "",
      backendType: "",
      checkedAt: Date.now(),
    };
    setBridgeInstallStatus(
      "無法連線",
      failureDetail,
      "error",
    );
    if (toastEnabled) showToast("Bridge 無法連線", "error");
    state.bridgeModelsLoaded = false;
  } catch (err) {
    const runtime = getEffectiveBridgeRuntime();
    const failureDetail =
      `${err?.message || "unknown error"} | runtime: ${getBridgeRuntimeLabel(runtime)} | localhost:${SDK_BRIDGE_PORT}`;
    state.bridgeLastProbe = {
      connected: false,
      isBridge: false,
      text: "檢查失敗",
      detail: failureDetail,
      type: "error",
      url,
      sdkState: "",
      service: "",
      backendType: "",
      checkedAt: Date.now(),
    };
    setBridgeInstallStatus(
      "檢查失敗",
      failureDetail,
      "error",
    );
    if (toastEnabled) showToast("Bridge 檢查失敗", "error");
    state.bridgeModelsLoaded = false;
  }
}

// Lightweight bridge health check for SDK status dot (no toast, no side-effects)
async function pollBridgeHealthQuiet() {
  const port = SDK_BRIDGE_PORT;
  const url = getBridgeHealthUrl(port);
  try {
    const response = await chrome.runtime.sendMessage({
      action: "bridgeHealth",
      port,
      timeoutMs: 3000,
    });
    if (response?.success && response?.isBridge) {
      const sdkState = response?.data?.sdk || "";
      // idle = service running, ready = session ready, connected = actively chatting
      const okStates = ["ready", "idle", "connected", ""];
      return okStates.includes(sdkState) ? "success" : "warning";
    }
    return "error";
  } catch {
    return "error";
  }
}

function updateSdkStatusDot(status) {
  if (dom.sdkModeBtn) {
    if (status) {
      dom.sdkModeBtn.dataset.status = status;
    } else {
      delete dom.sdkModeBtn.dataset.status;
    }
  }
}

function startSdkHealthPolling() {
  stopSdkHealthPolling();
  // Immediate check then every 3s
  pollBridgeHealthQuiet().then(updateSdkStatusDot);
  state.sdkHealthTimer = setInterval(() => {
    pollBridgeHealthQuiet().then(updateSdkStatusDot);
  }, 3000);
}

function stopSdkHealthPolling() {
  if (state.sdkHealthTimer) {
    clearInterval(state.sdkHealthTimer);
    state.sdkHealthTimer = null;
  }
}

function startBridgeSectionPolling() {
  stopBridgeSectionPolling();
  checkBridgeHealth({ showToast: false });
  state.bridgeSectionHealthTimer = setInterval(() => {
    checkBridgeHealth({ showToast: false });
  }, 1000);
}

function stopBridgeSectionPolling() {
  if (state.bridgeSectionHealthTimer) {
    clearInterval(state.bridgeSectionHealthTimer);
    state.bridgeSectionHealthTimer = null;
  }
}

function startAntigravitySectionPolling() {
  stopAntigravitySectionPolling();
  runAntigravityProviderProbe("health", { showToast: false });
  state.antigravitySectionHealthTimer = setInterval(() => {
    runAntigravityProviderProbe("health", { showToast: false });
  }, 3000);
}

function stopAntigravitySectionPolling() {
  if (state.antigravitySectionHealthTimer) {
    clearInterval(state.antigravitySectionHealthTimer);
    state.antigravitySectionHealthTimer = null;
  }
}

let _autoSaveTimer = null;
function markSettingsDirty() {
  if (_autoSaveTimer) clearTimeout(_autoSaveTimer);
  _autoSaveTimer = setTimeout(async () => {
    _autoSaveTimer = null;
    try {
      const requestedSettings = collectSettingsFromUI();
      const savedSettings = await persistSettings(requestedSettings, {
        showToast: false,
      });
      const currentStatus = dom.settingsStatus?.textContent || "";
      if (currentStatus.includes("重新載入擴充套件")) {
        return;
      }
      if (
        requestedSettings.selfIterationEnabled &&
        !savedSettings.selfIterationEnabled
      ) {
        showToast("首次 SEAL 失敗，設定已回退", "warning", 1800);
      } else {
        showToast("設定已自動儲存", "success", 1200);
      }
    } catch (err) {
      console.error("[SidePilot] Auto-save failed:", err);
      showToast("自動儲存失敗", "error");
    }
  }, 600);
}

async function goCopilotHome() {
  if (state.detectedMode !== "iframe") {
    await setModeFromUI("iframe");
  }

  if (dom.copilotFrame) {
    if (state.loadTimeout) {
      clearTimeout(state.loadTimeout);
      state.loadTimeout = null;
    }
    state.frameLoaded = false;
    dom.loadingOverlay?.classList.remove("hidden");
    dom.errorOverlay?.classList.add("hidden");
    dom.copilotFrame.src = COPILOT_HOME_URL;
    showToast("已回到 Copilot 首頁");
  }
}

function showSDKLoginGuide() {
  if (!dom.sdkLoginModal) return;
  if (dom.sdkLoginSuppressCheckbox) {
    dom.sdkLoginSuppressCheckbox.checked = !state.settings.autoSDKLoginGuide;
  }
  dom.sdkLoginModal.classList.remove("hidden");
}

function closeSDKLoginGuide() {
  dom.sdkLoginModal?.classList.add("hidden");
}

async function syncSDKGuideSettingFromModal() {
  const shouldSuppress = !!dom.sdkLoginSuppressCheckbox?.checked;
  const nextAutoGuide = !shouldSuppress;
  if (nextAutoGuide === state.settings.autoSDKLoginGuide) return;

  const nextSettings = {
    ...state.settings,
    autoSDKLoginGuide: nextAutoGuide,
  };
  await persistSettings(nextSettings, {
    statusText: "SDK 登入引導設定已更新",
  });
}

function maybeShowSDKLoginGuideOnFirstUse() {
  const enabled = state.settings.autoSDKLoginGuide !== false;
  if (!enabled) return;

  const alreadyShown =
    localStorage.getItem(STORAGE_KEY_SDK_LOGIN_GUIDE_SHOWN) === "true";
  if (alreadyShown) return;

  localStorage.setItem(STORAGE_KEY_SDK_LOGIN_GUIDE_SHOWN, "true");
  showSDKLoginGuide();
}

function openSDKLoginPage() {
  chrome.tabs.create({ url: SDK_LOGIN_URL });
  showToast("已開啟 GitHub 登入頁");
}

async function handleSDKLoginModalAction(options = {}) {
  try {
    await syncSDKGuideSettingFromModal();
  } catch (err) {
    console.error("[SidePilot] Failed to update SDK guide setting:", err);
    showToast("SDK 引導設定更新失敗", "error");
  } finally {
    closeSDKLoginGuide();
  }

  if (options.openLoginPage) {
    openSDKLoginPage();
  }
}

function sendSDKMessageViaBackground(data) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: "sdkSend", data }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (!response?.success) {
        reject(new Error(response?.error || "SDK send failed"));
        return;
      }

      resolve(response.data || {});
    });
  });
}

async function loadSDKModelOptions() {
  if (!dom.sdkModelSelect) return;

  try {
    const response = await chrome.runtime.sendMessage({ action: "sdkModels" });
    if (!response?.success || !Array.isArray(response.models)) {
      throw new Error(response?.error || "Failed to load model list");
    }

    const current = localStorage.getItem(STORAGE_KEY_SDK_MODEL) || "";
    dom.sdkModelSelect.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "default";
    dom.sdkModelSelect.appendChild(defaultOption);

    response.models.forEach((model) => {
      const option = document.createElement("option");
      option.value = model;
      option.textContent = model;
      dom.sdkModelSelect.appendChild(option);
    });

    if (current && response.models.includes(current)) {
      dom.sdkModelSelect.value = current;
    } else {
      dom.sdkModelSelect.value = "";
      localStorage.removeItem(STORAGE_KEY_SDK_MODEL);
    }
  } catch (err) {
    console.warn("[SidePilot] Failed to load SDK models:", err?.message || err);
  }
}

function getSelectedSDKModel() {
  const model = dom.sdkModelSelect?.value?.trim();
  return model || undefined;
}

async function ensureSDKBridgeConnection(options = {}) {
  const port = Number(options.port) || SDK_BRIDGE_PORT;
  const response = await chrome.runtime.sendMessage({
    action: "sdkConnect",
    port,
  });
  return !!response?.success;
}

function buildSDKUnavailableHelpMessage(errorMessage = "") {
  const lines = [
    "❌ SDK 連線失敗：Bridge server not available",
    "",
    "可先到「設定 > 安裝助手」點擊「0. 啟動 Bridge」。",
    "",
    "請先在本機啟動 Bridge：",
    "1. cd scripts/copilot-bridge",
    "2. npm install",
    "3. npm run start",
    "",
    "再完成 GitHub 登入：",
    `- 開啟 ${SDK_LOGIN_URL}`,
    "",
    `原始錯誤：${errorMessage || "unknown"}`,
  ];
  return lines.join("\n");
}

function buildSDK404HelpMessage(errorMessage = "") {
  const lines = [
    "❌ SDK API 找不到 (HTTP 404)",
    "",
    "常見原因：",
    `1. ${SDK_BRIDGE_PORT} 埠口不是 SidePilot Bridge`,
    "2. Bridge 版本不完整或未啟動正確專案",
    "",
    "請確認你是在此目錄啟動：",
    "1. cd scripts/copilot-bridge",
    "2. npm install",
    "3. npm run start",
    "",
    `原始錯誤：${errorMessage || "HTTP 404"}`,
  ];
  return lines.join("\n");
}

// ============================================
// Rules Management
// ============================================

function updateRulesOriginBadge(meta = {}) {
  if (!dom.rulesOriginBadge || !dom.rulesOriginDetail) return;

  const source =
    meta?.source === RULES_SOURCE_SYSTEM_BASELINE
      ? RULES_SOURCE_SYSTEM_BASELINE
      : RULES_SOURCE_USER;
  const templateId =
    typeof meta?.templateId === "string" ? meta.templateId.trim() : "";
  const version = Number(meta?.version) || 0;

  if (source === RULES_SOURCE_SYSTEM_BASELINE) {
    dom.rulesOriginBadge.textContent = "System baseline";
    dom.rulesOriginBadge.dataset.origin = "baseline";
    dom.rulesOriginDetail.textContent = `Source: default template${templateId ? ` (${templateId})` : ""} · version ${version || "-"}`;
    return;
  }

  dom.rulesOriginBadge.textContent = "User-defined";
  dom.rulesOriginBadge.dataset.origin = "user";
  if (templateId && templateId !== "custom") {
    dom.rulesOriginDetail.textContent = `Source: applied template (${templateId}) · version ${version || "-"}`;
  } else {
    dom.rulesOriginDetail.textContent = `Source: user edit / import · version ${version || "-"}`;
  }
}

async function loadRules(options = {}) {
  const silentStatus = options?.silentStatus === true;

  chrome.runtime.sendMessage({ action: "rules.load" }, (response) => {
    if (response?.success && dom.rulesEditor) {
      dom.rulesEditor.value = response.content || "";
      updateRulesOriginBadge(response);
      if (!silentStatus) {
        updateRulesStatus("已載入", "success");
      }
    } else {
      if (!silentStatus) {
        updateRulesStatus("載入失敗", "error");
      }
      updateRulesOriginBadge({
        source: RULES_SOURCE_USER,
        templateId: "custom",
      });
    }
  });
}

async function saveRules() {
  if (!dom.rulesEditor) return;

  updateRulesStatus("儲存中...", "pending");
  const content = dom.rulesEditor.value;

  chrome.runtime.sendMessage({ action: "rules.save", content }, (response) => {
    if (response?.success) {
      updateRulesStatus("已儲存", "success");
      loadRules({ silentStatus: true });
      showToast("規則已儲存");
    } else {
      updateRulesStatus("儲存失敗", "error");
      showToast("規則儲存失敗", "error");
    }
  });
}

function exportRules() {
  chrome.runtime.sendMessage({ action: "rules.export" }, (response) => {
    if (response?.success) {
      showToast("Rules exported");
    } else {
      showToast("Export failed", "error");
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
      showToast("Rules imported");
    }
  };
  reader.readAsText(file);

  // Reset input
  e.target.value = "";
}

function loadTemplates() {
  chrome.runtime.sendMessage({ action: "rules.getTemplates" }, (response) => {
    if (response?.success && dom.templateSelect) {
      // Keep first option
      const firstOption = dom.templateSelect.options[0];
      dom.templateSelect.innerHTML = "";
      dom.templateSelect.appendChild(firstOption);

      response.templates.forEach((tpl) => {
        const option = document.createElement("option");
        option.value = tpl.id;
        option.textContent = tpl.name;
        dom.templateSelect.appendChild(option);
      });
    }
  });
}

function applyTemplate(templateId) {
  if (!confirm("This will overwrite current rules. Continue?")) {
    if (dom.templateSelect) dom.templateSelect.value = "";
    return;
  }

  chrome.runtime.sendMessage(
    { action: "rules.applyTemplate", templateId },
    (response) => {
      if (response?.success && dom.rulesEditor) {
        dom.rulesEditor.value = response.content || "";
        updateRulesStatus("已套用樣板", "success");
        loadRules({ silentStatus: true });
        showToast("樣板已套用");
      } else {
        showToast("套用樣板失敗", "error");
      }
      if (dom.templateSelect) dom.templateSelect.value = "";
    },
  );
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
    if (["task", "note", "context", "reference"].includes(val)) {
      filter.type = val;
    }
  }

  chrome.runtime.sendMessage({ action: "memory.list", filter }, (response) => {
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

  chrome.runtime.sendMessage({ action: "memory.search", query }, (response) => {
    if (response?.success) {
      renderMemoryList(response.entries);
    }
  });
}

function normalizeEntrySource(entry) {
  if (entry?.source === "system_baseline") return "system_baseline";
  return "user";
}

function getMemoryOriginLabel(entry) {
  return normalizeEntrySource(entry) === "system_baseline"
    ? "系統 baseline"
    : "使用者自建";
}

function getMemoryOriginClass(entry) {
  return normalizeEntrySource(entry) === "system_baseline"
    ? "baseline"
    : "user";
}

// Render memory entries list with proper event delegation
function renderMemoryList(entries) {
  if (!dom.memoryList) return;

  // Build pinned system identity card
  const identityCard = `
    <div class="memory-entry memory-entry-pinned" data-id="${SIDEPILOT_SYSTEM_IDENTITY.id}">
      <div class="memory-entry-header">
        <span class="memory-entry-title">📌 ${escapeHtml(SIDEPILOT_SYSTEM_IDENTITY.title)}</span>
        <span class="memory-entry-type">system</span>
      </div>
      <div class="memory-entry-content">${escapeHtml(SIDEPILOT_SYSTEM_IDENTITY.content)}</div>
      <div class="memory-entry-footer">
        <a href="#" class="memory-edit-link" data-action="edit-identity">⚙️ 前往設定修改</a>
      </div>
    </div>
  `;

  if (!entries || entries.length === 0) {
    dom.memoryList.innerHTML =
      identityCard + '<div class="memory-empty">No entries found.</div>';
    return;
  }

  dom.memoryList.innerHTML =
    identityCard +
    entries
      .map(
        (entry) => `
    <div class="memory-entry" data-id="${entry.id}">
      <div class="memory-entry-header">
        <span class="memory-entry-title">${escapeHtml(entry.title)}</span>
        <div class="memory-entry-meta">
          <span class="memory-entry-type">${entry.type}</span>
          <span class="memory-entry-origin memory-entry-origin-${getMemoryOriginClass(entry)}">${getMemoryOriginLabel(entry)}</span>
        </div>
      </div>
      <div class="memory-entry-content">${escapeHtml(entry.content)}</div>
      <div class="memory-entry-footer">
        <span>${new Date(entry.updatedAt).toLocaleDateString()}</span>
        ${entry.type === "task" ? `<span class="memory-entry-status ${entry.status}">${entry.status.replace("_", " ")}</span>` : ""}
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
  `,
      )
      .join("");

  dom.memoryList.querySelectorAll(".btn-send-vscode").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      sendMemoryToVSCode(id);
    });
  });
}

function setupMemoryListeners() {
  if (dom.memoryList) {
    dom.memoryList.addEventListener("click", (e) => {
      // Identity card → jump to settings tab
      const editLink = e.target.closest('[data-action="edit-identity"]');
      if (editLink) {
        e.preventDefault();
        switchTab("settings");
        return;
      }
      const entryDiv = e.target.closest(".memory-entry");
      if (entryDiv) {
        editMemoryEntry(entryDiv.dataset.id);
      }
    });
  }
}

const ENTRY_TYPE_HINTS = {
  task: "為此對話標記一個待辦事項或行動項目",
  note: "記錄觀察到的現象、想法或學習心得",
  context: "保存專案架構、技術決策等背景資訊，供 AI 參考",
  reference: "保存外部連結、文件路徑或參考資料",
};

function updateEntryTypeHint(type) {
  const hint = document.getElementById("entryTypeHint");
  if (hint) hint.textContent = ENTRY_TYPE_HINTS[type] || "";
}

function openMemoryModal(entry = null) {
  currentEditingId = entry ? entry.id : null;

  if (dom.memoryModalTitle)
    dom.memoryModalTitle.textContent = entry ? "編輯條目" : "新增條目";
  if (dom.entryType) dom.entryType.value = entry ? entry.type : "task";
  updateEntryTypeHint(entry ? entry.type : "task");
  if (dom.entryTitle) dom.entryTitle.value = entry ? entry.title : "";
  if (dom.entryContent) dom.entryContent.value = entry ? entry.content : "";
  if (dom.entryStatus) {
    dom.entryStatus.value = entry && entry.status ? entry.status : "pending";
    dom.entryStatus.style.display =
      (entry ? entry.type : "task") === "task" ? "block" : "none";
  }

  // Add delete button if editing
  const footer = dom.memoryModal.querySelector(".modal-footer");
  const existingDelete = footer.querySelector(".btn-delete");
  if (existingDelete) existingDelete.remove();

  if (entry) {
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-icon btn-delete";
    deleteBtn.innerHTML =
      '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M6.5 1.75a.25.25 0 0 1 .25-.25h2.5a.25.25 0 0 1 .25.25V3h-3V1.75Zm4.5 0V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.75 1.75 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 6.5a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 0 1.5 0v-4.5a.75.75 0 0 0-.75-.75Zm3 0a.75.75 0 0 0-.75.75v4.5a.75.75 0 0 0 1.5 0v-4.5a.75.75 0 0 0-.75-.75Z"/></svg>';
    deleteBtn.style.marginRight = "auto";
    deleteBtn.onclick = () => deleteMemoryEntry(entry.id);
    footer.insertBefore(deleteBtn, footer.firstChild);
  }

  dom.memoryModal.classList.remove("hidden");
}

function closeMemoryModal() {
  dom.memoryModal.classList.add("hidden");
  currentEditingId = null;
}

function editMemoryEntry(id) {
  chrome.runtime.sendMessage({ action: "memory.get", id }, (response) => {
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
    status: dom.entryStatus.value,
  };

  if (!entry.title) {
    showToast("Title is required", "error");
    return;
  }

  if (currentEditingId) {
    chrome.runtime.sendMessage(
      { action: "memory.update", id: currentEditingId, data: entry },
      (response) => {
        if (response?.success) {
          closeMemoryModal();
          loadMemoryEntries();
          showToast("條目已更新");
        } else {
          showToast("更新失敗: " + response.error, "error");
        }
      },
    );
  } else {
    chrome.runtime.sendMessage(
      { action: "memory.create", entry },
      (response) => {
        if (response?.success) {
          closeMemoryModal();
          loadMemoryEntries();
          showToast("條目已建立");
        } else {
          showToast("建立失敗: " + response.error, "error");
        }
      },
    );
  }
}

function deleteMemoryEntry(id) {
  if (!confirm("確定要刪除此條目嗎？")) return;

  chrome.runtime.sendMessage({ action: "memory.delete", id }, (response) => {
    if (response?.success) {
      closeMemoryModal();
      loadMemoryEntries();
      showToast("條目已刪除");
    } else {
      showToast("刪除失敗", "error");
    }
  });
}

// 傳送目前編輯中的條目到 VS Code
function sendEntryToVSCode() {
  if (!currentEditingId) {
    showToast("請先選取一個條目", "error");
    return;
  }
  chrome.runtime.sendMessage(
    { action: "vscode.send", id: currentEditingId },
    (response) => {
      if (response?.success) {
        showToast("已傳送到 VS Code");
      } else {
        showToast("傳送失敗: " + (response?.error || "未知錯誤"), "error");
      }
    },
  );
}

// ============================================
// 事件監聽器設置
// ============================================

let _captureHoverTimer = null;

function setupEventListeners() {
  // 底部浮動擷取按鈕
  dom.floatingCaptureBtn?.addEventListener("click", toggleCapturePanel);

  // Hover: expand narrow button to 20px, restore after 1s on leave
  dom.floatingCaptureBtn?.addEventListener("mouseenter", () => {
    if (_captureHoverTimer) {
      clearTimeout(_captureHoverTimer);
      _captureHoverTimer = null;
    }
    const saved = clampCaptureButtonWidth(state.settings?.captureButtonWidth);
    if (saved < 20) {
      document.documentElement.style.setProperty(
        "--capture-button-width",
        "20px",
      );
      dom.floatingCaptureBtn?.classList.remove("capture-compact");
    }
  });
  dom.floatingCaptureBtn?.addEventListener("mouseleave", () => {
    const saved = clampCaptureButtonWidth(state.settings?.captureButtonWidth);
    if (saved < 20) {
      _captureHoverTimer = setTimeout(() => {
        applyCaptureButtonWidth(saved);
        _captureHoverTimer = null;
      }, 1000);
    }
  });

  // 擷取面板
  dom.closeCaptureBtn?.addEventListener("click", closeCapturePanel);
  dom.captureContent?.addEventListener("click", handleCaptureContentClick);

  // 錯誤處理
  dom.retryBtn?.addEventListener("click", refreshFrame);
  dom.openWindowBtn?.addEventListener("click", openCopilotWindow);

  // 歡迎畫面
  dom.welcomeCloseBtn?.addEventListener("click", closeWelcome);
  dom.welcomeDeclineBtn?.addEventListener("click", declineAndClose);

  // 監聽來自 background 的訊息
  chrome.runtime.onMessage.addListener(handleBackgroundMessage);
  dom.homeBtn?.addEventListener("click", () => {
    goCopilotHome().catch((err) => {
      showToast(`回首頁失敗：${err.message}`, "error");
    });
  });

  // Tab Navigation
  dom.tabs.forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });
  dom.modeSwitchBtns?.forEach((btn) => {
    btn.addEventListener("click", () => setModeFromUI(btn.dataset.mode));
  });

  // Rules Tab
  dom.saveRulesBtn?.addEventListener("click", saveRules);
  dom.exportRulesBtn?.addEventListener("click", exportRules);
  dom.importRulesBtn?.addEventListener("click", () =>
    dom.rulesFileInput?.click(),
  );
  dom.rulesFileInput?.addEventListener("change", importRules);
  dom.templateSelect?.addEventListener("change", (e) => {
    if (e.target.value) applyTemplate(e.target.value);
  });

  // Memory Tab
  dom.addMemoryBtn?.addEventListener("click", () => openMemoryModal());
  dom.closeMemoryModal?.addEventListener("click", closeMemoryModal);
  dom.cancelMemoryBtn?.addEventListener("click", closeMemoryModal);
  dom.saveMemoryBtn?.addEventListener("click", saveMemoryEntry);
  dom.memorySearch?.addEventListener("input", (e) =>
    searchMemory(e.target.value),
  );
  dom.memoryFilter?.addEventListener("change", () => loadMemoryEntries());
  dom.entryType?.addEventListener("change", (e) => {
    // Show/hide status based on type
    if (dom.entryStatus) {
      dom.entryStatus.style.display =
        e.target.value === "task" ? "block" : "none";
    }
    updateEntryTypeHint(e.target.value);
  });
  dom.sendToVSCodeBtn?.addEventListener("click", sendEntryToVSCode);
  dom.sdkIncludeMemory?.addEventListener("change", () => {
    syncContextChildToggles();
    refreshSDKMemorySummary();
  });
  // Granular context toggles — save state
  [
    "sdkIncludeIdentity",
    "sdkIncludeMemoryEntries",
    "sdkIncludeRules",
    "sdkIncludeSystemMsg",
    "sdkStructuredOutput",
  ].forEach((key) => {
    dom[key]?.addEventListener("change", () => {
      localStorage.setItem(`sidepilot_${key}`, String(dom[key].checked));
      syncStructuredOutputDependency();
      refreshSDKMemorySummary();
    });
  });
  dom.sdkAssistantOnly?.addEventListener("change", applySDKAssistantOnlyMode);
  dom.sdkModelSelect?.addEventListener("change", () => {
    const value = dom.sdkModelSelect?.value || "";
    if (value) {
      localStorage.setItem(STORAGE_KEY_SDK_MODEL, value);
    } else {
      localStorage.removeItem(STORAGE_KEY_SDK_MODEL);
    }
  });

  // Logs Tab
  dom.logSearch?.addEventListener("input", () => renderLogs());
  dom.logLevelFilter?.addEventListener("change", () => renderLogs());
  dom.clearLogsBtn?.addEventListener("click", clearLogs);
  dom.copyLogsBtn?.addEventListener("click", copyLogsToClipboard);

  // History Log Tab (Bridge)
  dom.refreshLogBtn?.addEventListener("click", () => loadLogFiles());
  dom.logIframeAgentsToggle?.addEventListener("click", () => {
    const shouldExpand = dom.logContainerIframe?.classList.contains("collapsed");
    setIframeAgentsExpanded(!!shouldExpand);
  });

  // Settings Tab (auto-save — no manual save button)

  // Collapsible settings sections + bridge section polling
  document
    .querySelectorAll('.settings-section-title[data-toggle="section"]')
    .forEach((title) => {
      const section = title.closest(".settings-section");
      title.setAttribute(
        "aria-expanded",
        String(section && !section.classList.contains("collapsed")),
      );
      title.addEventListener("click", () => {
        toggleSettingsSection(title.closest(".settings-section"));
      });
    });

  dom.settingCaptureButtonWidth?.addEventListener("input", (e) => {
    const width = clampCaptureButtonWidth(e.target.value);
    updateCaptureWidthLabel(width);
    applyCaptureButtonWidth(width);
    markSettingsDirty();
  });
  dom.settingDisplayScale?.addEventListener("input", (e) => {
    const scalePercent = clampDisplayScalePercent(e.target.value);
    state.settings = normalizeSettings({
      ...state.settings,
      displayScalePercent: scalePercent,
    });
    updateDisplayScaleLabel(scalePercent);
    applyDisplayScale(scalePercent);
    markSettingsDirty();
  });
  dom.settingCaptureButtonTop?.addEventListener("input", (e) => {
    const topPercent = clampCaptureButtonTopPercent(e.target.value);
    updateCaptureTopLabel(topPercent);
    applyCaptureButtonTop(topPercent);
    markSettingsDirty();
  });
  dom.settingUiLanguage?.addEventListener("change", (e) => {
    const nextLanguage = normalizeUiLanguage(e.target.value);
    state.settings = normalizeSettings({
      ...state.settings,
      uiLanguage: nextLanguage,
    });
    applySettingsI18n(nextLanguage);
    updateSelfIterationSealBadge(nextLanguage);
    updateDisplayScaleLabel(state.settings.displayScalePercent);
    updateCaptureTopLabel(state.settings.captureButtonTopPercent);
    markSettingsDirty();
  });
  [dom.iframeRiskHelpBtn, dom.iframeRiskDocLink].forEach((control) => {
    control?.addEventListener("click", (event) => {
      event.stopPropagation();
    });
    control?.addEventListener("mousedown", (event) => {
      event.stopPropagation();
    });
  });
  dom.settingAutoStartBridge?.addEventListener("change", markSettingsDirty);
  dom.settingAutoSdkLogin?.addEventListener("change", markSettingsDirty);
  dom.settingBridgeProjectRoot?.addEventListener("input", (event) => {
    const runtime = getEffectiveBridgeRuntime();
    state.settings = normalizeSettings({
      ...state.settings,
      ...getBridgeProjectRootSettingsPatch(runtime, event.target?.value || ""),
    });
    refreshBridgeSetupUi();
    markSettingsDirty();
  });
  dom.settingBridgeWslDistro?.addEventListener("input", (event) => {
    state.settings = normalizeSettings({
      ...state.settings,
      bridgeWslDistro: event.target?.value || "",
    });
    refreshBridgeSetupUi();
    markSettingsDirty();
  });
  dom.settingSelfIterationEnabled?.addEventListener(
    "change",
    markSettingsDirty,
  );
  dom.settingPlayIntroEveryOpen?.addEventListener("change", markSettingsDirty);
  dom.settingShowWarningOverlay?.addEventListener("change", markSettingsDirty);
  dom.settingAntigravityBaseUrl?.addEventListener("input", markSettingsDirty);
  dom.settingAntigravityToken?.addEventListener("input", markSettingsDirty);
  dom.settingIframeEnabled?.addEventListener("change", () => {
    updateIframeModeBtnState(!!dom.settingIframeEnabled.checked);
    markSettingsDirty();
  });
  dom.settingLinkGuardMode?.addEventListener("change", markSettingsDirty);
  dom.settingLinkAllowlist?.addEventListener("input", markSettingsDirty);
  document
    .getElementById("settingIframeHistoryUrl")
    ?.addEventListener("input", markSettingsDirty);
  dom.openSdkLoginGuideBtn?.addEventListener("click", openSDKLoginPage);
  dom.testSdkBridgeBtn?.addEventListener("click", async () => {
    updateSettingsStatus("測試 Bridge 連線中...", "warning");
    try {
      const ok = await ensureSDKBridgeConnection({ port: SDK_BRIDGE_PORT });
      if (ok) {
        updateSettingsStatus("Bridge 連線成功", "success");
        showToast("SDK Bridge 已連線");
        loadSDKModelOptions();
      } else {
        updateSettingsStatus("Bridge 未啟動或無法連線", "error");
        showToast("Bridge 連線失敗，請先啟動本機服務", "error");
      }
    } catch (err) {
      updateSettingsStatus("Bridge 連線失敗", "error");
      showToast(`Bridge 測試失敗：${err.message}`, "error");
    }
  });
  dom.bridgePrimaryBtn?.addEventListener("click", async () => {
    const action = dom.bridgePrimaryBtn?.dataset.action || "start";
    if (action === "copy-install") {
      await copyToClipboard(
        buildBridgeInstallCommand(getEffectiveBridgeRuntime()),
        "Quick Setup 指令已複製",
      );
      return;
    }
    if (action === "check") {
      checkBridgeHealth({ showToast: true });
      return;
    }

    const result = await ensureSDKBridgeReadyWithAutoStart({
      source: "manual-button",
      bypassCooldown: true,
      force: true,
      showToast: true,
    });
    if (result?.success) {
      const connected = await ensureSDKBridgeConnection({
        port: SDK_BRIDGE_PORT,
      });
      if (connected) {
        await loadSDKModelOptions();
      }
      return;
    }
    const detail = result?.detail || result?.code || "BRG-AUTO-001";
    updateSettingsStatus(`Bridge 啟動失敗：${detail}`, "error");
    refreshBridgeSetupUi();
  });
  dom.bridgeAdvancedToggleBtn?.addEventListener("click", () => {
    const shouldOpen = dom.bridgeAdvancedPanel?.classList.contains("hidden");
    dom.bridgeAdvancedPanel?.classList.toggle("hidden", !shouldOpen);
    refreshBridgeSetupUi();
  });
  dom.bridgeCheckBtn?.addEventListener("click", () => {
    checkBridgeHealth({ showToast: true });
  });
  dom.bridgeCopyInstallBtn?.addEventListener("click", async () => {
    await copyToClipboard(
      buildBridgeInstallCommand(getEffectiveBridgeRuntime()),
      "Quick Setup 指令已複製",
    );
  });
  dom.bridgeCopyCmdBtn?.addEventListener("click", async () => {
    await copyToClipboard(
      buildBridgeStartCommands(getEffectiveBridgeRuntime()),
      "啟動指令已複製",
    );
  });
  dom.bridgeCopyCheckBtn?.addEventListener("click", async () => {
    await copyToClipboard(buildBridgeCheckCommand(), "檢查指令已複製");
  });
  dom.bridgeRuntimeButtons?.forEach((button) => {
    button.addEventListener("click", async () => {
      const runtime = normalizeBridgeManualRuntime(button.dataset.runtime);
      await persistSettingsPatch({ bridgeManualRuntime: runtime });
      refreshBridgeSetupUi();
    });
  });
  dom.antigravityHealthBtn?.addEventListener("click", async () => {
    await runAntigravityProviderProbe("health", { showToast: true });
  });
  dom.antigravityMetaBtn?.addEventListener("click", async () => {
    await runAntigravityProviderProbe("meta", { showToast: true });
  });
  dom.antigravityDetectBtn?.addEventListener("click", async () => {
    await runAntigravityProviderProbe("detect", { showToast: true });
  });

  // SDK Login Guide Modal
  dom.closeSdkLoginModal?.addEventListener("click", () => {
    handleSDKLoginModalAction();
  });
  dom.sdkLoginLaterBtn?.addEventListener("click", () => {
    handleSDKLoginModalAction();
  });
  dom.sdkLoginNowBtn?.addEventListener("click", () => {
    handleSDKLoginModalAction({ openLoginPage: true });
  });
  dom.sdkLoginModal?.addEventListener("click", (e) => {
    if (e.target === dom.sdkLoginModal) {
      handleSDKLoginModalAction();
    }
  });

  // WP-01: Permission modal buttons
  dom.permissionApproveBtn?.addEventListener("click", () =>
    resolvePermission("allow"),
  );
  dom.permissionDenyBtn?.addEventListener("click", () =>
    resolvePermission("deny"),
  );
  dom.permissionModal?.addEventListener("click", (e) => {
    if (e.target === dom.permissionModal) resolvePermission("deny");
  });

  // WP-07: Prompt strategy buttons
  dom.promptStrategyBtns?.addEventListener("click", (e) => {
    const btn = e.target.closest(".strategy-btn");
    if (!btn) return;
    const strategy = btn.dataset.strategy;
    if (strategy) setPromptStrategy(strategy);
  });

  setupMemoryListeners();
  refreshSDKMemorySummary();
  applySDKAssistantOnlyMode();

  // SDK Chat
  dom.sdkSendBtn?.addEventListener("click", async () => {
    const content = dom.sdkInput?.value?.trim();
    if (!content) return;

    dom.sdkSendBtn.disabled = true;

    const bridgeReady = await ensureSDKBridgeReadyWithAutoStart({
      source: "sdk-send",
      showToast: true,
    });
    if (!bridgeReady?.success) {
      const detail =
        bridgeReady?.detail || bridgeReady?.code || "bridge unavailable";
      addSDKMessage("assistant", buildSDKUnavailableHelpMessage(detail));
      dom.sdkSendBtn.disabled = false;
      dom.sdkInput?.focus();
      return;
    }

    dom.sdkInput.value = "";
    dom.sdkInput.style.height = "auto"; // Reset height after send

    // Add user message with image indicator
    const imgCount = state.pendingChatImages.length;
    const displayContent =
      imgCount > 0 ? `${content}\n📎 ${imgCount} 張圖片附加` : content;
    addSDKMessage("user", displayContent);

    // Add typing indicator
    const typingId = addSDKTypingIndicator();
    const expectedStructuredResponse =
      !!dom.sdkIncludeMemory?.checked && !!dom.sdkStructuredOutput?.checked;

    try {
      let promptToSend = content;
      let sandboxSystemMessage;

      if (dom.sdkIncludeMemory?.checked) {
        try {
          const includeIdentity = !!dom.sdkIncludeIdentity?.checked;
          const includeMemEntries = !!dom.sdkIncludeMemoryEntries?.checked;
          const includeRules = !!dom.sdkIncludeRules?.checked;
          const includeSystemMsg = !!dom.sdkIncludeSystemMsg?.checked;
          const useStructuredOutput = !!dom.sdkStructuredOutput?.checked;

          const [allMemoryEntries, rulesContent] = await Promise.all([
            includeMemEntries ? listAllMemoryEntries() : Promise.resolve([]),
            includeRules
              ? loadRulesContent().catch(() => "")
              : Promise.resolve(""),
          ]);
          const identityText = includeIdentity
            ? SIDEPILOT_SYSTEM_IDENTITY.content
            : "";
          const composed = buildMemoryInjectedPrompt(
            content,
            allMemoryEntries,
            rulesContent,
            { useStructuredOutput, identityText },
          );
          promptToSend = composed.prompt;
          if (includeSystemMsg && useStructuredOutput) {
            sandboxSystemMessage = SIDEPILOT_SANDBOX_SYSTEM_MESSAGE;
          }
          const parts = [];
          if (includeIdentity) parts.push("id");
          if (includeMemEntries) parts.push(`${composed.injectedCount} mem`);
          if (includeRules)
            parts.push(`rules ${composed.rulesInjected ? "on" : "off"}`);
          if (includeSystemMsg && useStructuredOutput) parts.push("sys");
          if (useStructuredOutput) parts.push("struct");
          updateSDKMemorySummary(`Packet: ${parts.join(", ")}`);
        } catch (memoryErr) {
          console.warn("[SidePilot] Context injection failed:", memoryErr);
          updateSDKMemorySummary("Context injection unavailable");
          showToast("Context 載入失敗，本次僅送出原始訊息", "warning");
        }
      }

      const sendPayload = {
        type: "chat",
        content: promptToSend,
        systemMessage: sandboxSystemMessage,
        model: getSelectedSDKModel(),
      };
      // Attach pending screenshots
      if (state.pendingChatImages.length > 0) {
        sendPayload.images = [...state.pendingChatImages];
        state.pendingChatImages = [];
        updatePendingImagesBadge();
      }

      const response = await sendSDKMessageViaBackground(sendPayload);

      removeSDKTypingIndicator(typingId);

      if (response.success && response.content) {
        const parsed = parseSDKSandboxResponse(response.content);
        const hasStructuredBlocks =
          parsed.hasAssistantBlock || parsed.hasPacketBlock;
        if (hasStructuredBlocks) {
          addSDKStructuredAssistantMessage(parsed);
        } else {
          addSDKMessage("assistant", parsed.rawContent || response.content);
        }

        if (expectedStructuredResponse && !parsed.hasAssistantBlock) {
          showToast(
            "未偵測到 assistant_response 區塊，已顯示原始輸出",
            "warning",
          );
        }

        if (parsed.packetObjects.length > 0) {
          console.debug("[SidePilot] sidepilot_packet:", parsed.packetObjects);
        }
      } else {
        addSDKMessage("assistant", "❌ Failed to get response");
      }
    } catch (err) {
      removeSDKTypingIndicator(typingId);
      console.error("[SDK Chat]", err);
      const lowerError = String(err?.message || "").toLowerCase();
      if (lowerError.includes("bridge server not available")) {
        addSDKMessage("assistant", buildSDKUnavailableHelpMessage(err.message));
        showToast("SDK Bridge 尚未啟動，已提供啟動指引", "warning");
      } else if (lowerError.includes("http 404")) {
        addSDKMessage("assistant", buildSDK404HelpMessage(err.message));
        showToast("SDK API 回傳 404，請確認 Bridge 啟動來源", "warning");
      } else {
        addSDKMessage("assistant", `❌ Error: ${err.message}`);
      }
    } finally {
      dom.sdkSendBtn.disabled = false;
      dom.sdkInput?.focus();
    }
  });

  dom.sdkInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Slash command interception
      const rawInput = dom.sdkInput?.value?.trim() || "";
      if (rawInput === "/clear") {
        dom.sdkInput.value = "";
        dom.sdkInput.style.height = "auto";
        clearSDKChatMessages();
        return;
      }
      if (rawInput === "/help") {
        dom.sdkInput.value = "";
        dom.sdkInput.style.height = "auto";
        showSDKHelpMessage();
        return;
      }
      dom.sdkSendBtn?.click();
    }
  });

  dom.sdkInputResizer?.addEventListener("mousedown", startSDKInputResizeDrag);
  window.addEventListener("resize", handleSDKInputViewportResize);

  // Clear chat button
  dom.sdkClearBtn?.addEventListener("click", () => {
    clearSDKChatMessages();
  });

  // Auto-resize for SDK Input
  dom.sdkInput?.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = this.scrollHeight + "px";
  });

  // Code block copy buttons — event delegation on message list
  dom.sdkMessages?.addEventListener("click", (e) => {
    const copyBtn = e.target.closest(".sdk-code-copy-btn");
    if (!copyBtn) return;
    const code = copyBtn.dataset.code || "";
    navigator.clipboard.writeText(code).then(() => {
      const original = copyBtn.textContent;
      copyBtn.textContent = "✓ Copied";
      setTimeout(() => {
        copyBtn.textContent = original;
      }, 1500);
    });
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
  dom.copilotFrame.addEventListener("load", () => {
    if (state.loadTimeout) {
      clearTimeout(state.loadTimeout);
      state.loadTimeout = null;
    }
    state.frameLoaded = true;
    dom.loadingOverlay.classList.add("hidden");
    dom.errorOverlay.classList.add("hidden");
  });

  // 載入超時
  state.loadTimeout = setTimeout(() => {
    if (!state.frameLoaded) {
      showFrameError("載入超時，請檢查網路連線");
    }
    state.loadTimeout = null;
  }, FRAME_LOAD_TIMEOUT);

  // iframe 錯誤偵測
  dom.copilotFrame.addEventListener("error", () => {
    showFrameError("無法載入 GitHub Copilot");
  });
}

function showFrameError(message) {
  dom.loadingOverlay.classList.add("hidden");
  dom.errorOverlay.classList.remove("hidden");
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
  dom.loadingOverlay.classList.remove("hidden");
  dom.errorOverlay.classList.add("hidden");

  const currentSrc = dom.copilotFrame.src;
  dom.copilotFrame.src = "";
  setTimeout(() => {
    dom.copilotFrame.src = currentSrc;
  }, 0);

  state.loadTimeout = setTimeout(() => {
    if (!state.frameLoaded) {
      showFrameError("載入超時，請檢查網路連線");
    }
    state.loadTimeout = null;
  }, FRAME_LOAD_TIMEOUT);
}

function ensureIframeFrameReady(options = {}) {
  if (!dom.copilotFrame) return false;

  const { recoverIfBlank = false, recoverIfError = false } = options;
  const rawSrc = String(dom.copilotFrame.getAttribute("src") || "").trim();
  const isBlankSrc = rawSrc === "" || rawSrc === "about:blank";
  const hasVisibleError =
    !!dom.errorOverlay && !dom.errorOverlay.classList.contains("hidden");

  if (recoverIfBlank && isBlankSrc) {
    if (state.loadTimeout) {
      clearTimeout(state.loadTimeout);
      state.loadTimeout = null;
    }
    state.frameLoaded = false;
    dom.loadingOverlay?.classList.remove("hidden");
    dom.errorOverlay?.classList.add("hidden");
    dom.copilotFrame.src = COPILOT_HOME_URL;
    return true;
  }

  if (recoverIfError && hasVisibleError) {
    refreshFrame();
    return true;
  }

  return false;
}

function openCopilotWindow() {
  chrome.runtime.sendMessage({ action: "openCopilotWindow" });
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
    localStorage.removeItem("intro_played");
  }

  const introPlayed = localStorage.getItem("intro_played");

  if (!introPlayed && dom.introContainer && dom.introVideo) {
    // Play video
    dom.introContainer.classList.remove("fade-out");
    dom.introContainer.classList.remove("hidden");
    dom.introVideo.controls = false;
    dom.introVideo.removeAttribute("controls");
    dom.introVideo.currentTime = 0;
    dom.introVideo.load();
    dom.introVideo.play().catch((err) => {
      console.error("Video play failed", err);
      dom.introContainer.classList.remove("hidden");
      dom.introContainer.classList.remove("fade-out");
      dom.introVideo.controls = true;
      dom.introVideo.setAttribute("controls", "controls");
      showToast("Intro 無法自動播放，請手動播放或直接跳過", "warning");
    });

    dom.introVideo.onended = finishIntro;
    dom.skipIntroBtn.onclick = finishIntro;
  } else {
    checkWarningStatus();
  }
}

function finishIntro() {
  if (!dom.introContainer) return;

  dom.introContainer.classList.add("fade-out");

  // Stop video to save resources
  if (dom.introVideo) {
    dom.introVideo.pause();
    dom.introVideo.controls = false;
    dom.introVideo.removeAttribute("controls");
  }

  setTimeout(() => {
    dom.introContainer.classList.add("hidden");
    localStorage.setItem("intro_played", "true");
    checkWarningStatus();
  }, 1000);
}

function checkWarningStatus() {
  if (state.settings.showWarningOverlay === false) {
    return;
  }

  const isSuppressed = localStorage.getItem("copilot_warning_suppressed");

  if (!isSuppressed && dom.welcomeOverlay) {
    dom.welcomeOverlay.classList.remove("hidden");
    // 觸發淡入動畫
    requestAnimationFrame(() => {
      dom.welcomeOverlay.classList.add("visible");
    });
  }
}

function showDeclinedState() {
  // 不載入 iframe
  if (dom.copilotFrame) {
    dom.copilotFrame.src = "about:blank";
  }

  dom.loadingOverlay?.classList.add("hidden");
  dom.welcomeOverlay?.classList.remove("visible");
  dom.welcomeOverlay?.classList.add("hidden");

  if (dom.errorOverlay) {
    dom.errorOverlay.classList.remove("hidden");
    if (dom.errorMessage) {
      dom.errorMessage.innerHTML =
        '您已拒絕使用條款。<br><br>如需使用 SidePilot，請重新開啟擴充功能並接受相關風險聲明。<br><br><button id="resetDeclineBtn" class="btn btn-secondary" style="margin-top: 12px;">重新選擇</button>';
    }

    // 綁定重置按鈕
    setTimeout(() => {
      const resetBtn = document.getElementById("resetDeclineBtn");
      resetBtn?.addEventListener("click", () => {
        localStorage.removeItem(STORAGE_KEY_DECLINED);
        location.reload();
      });
    }, 0);
  }
}

function closeWelcome() {
  localStorage.setItem(STORAGE_KEY, "true");

  if (dom.welcomeSuppressCheckbox && dom.welcomeSuppressCheckbox.checked) {
    localStorage.setItem("copilot_warning_suppressed", "true");
  }

  // 先淡出，再隱藏
  dom.welcomeOverlay?.classList.remove("visible");
  setTimeout(() => {
    dom.welcomeOverlay?.classList.add("hidden");
  }, 300);
}

function declineAndClose() {
  // 使用者拒絕條款，記錄拒絕狀態
  localStorage.removeItem(STORAGE_KEY);
  localStorage.setItem(STORAGE_KEY_DECLINED, "true");

  // 顯示拒絕狀態
  showDeclinedState();
  showToast("您已拒絕使用條款。如需使用，請點擊「重新選擇」。", "warning");
}

// ============================================
// 頁面資訊
// ============================================

function loadCurrentPageInfo() {
  chrome.runtime.sendMessage({ action: "getPageContent" }, (response) => {
    if (chrome.runtime.lastError) return;

    if (response?.success || response?.pageInfo) {
      updatePageInfo(
        response.title || response.pageInfo?.title,
        response.url || response.pageInfo?.url,
      );
    }
  });
}

function updatePageInfo(title, url) {
  if (dom.pageTitle) dom.pageTitle.textContent = title || "無標題";
  if (dom.pageUrl) dom.pageUrl.textContent = url || "";
  dom.pageInfo?.classList.add("visible");
}

// ============================================
// 擷取面板
// ============================================

function toggleCapturePanel() {
  if (state.isCapturePanelOpen) {
    closeCapturePanel();
  } else {
    openCapturePanel();
  }
}

async function openCapturePanel() {
  state.isCapturePanelOpen = true;
  dom.capturePanel?.classList.add("visible");

  await loadPageContent();
}

function closeCapturePanel() {
  state.isCapturePanelOpen = false;
  dom.capturePanel?.classList.remove("visible");
}

function syncCapturePanelMode() {
  // Capture button works in both modes; only close panel if switching away from capture context
}

async function loadPageContent() {
  if (!dom.captureContent) return;

  renderCaptureLoading();
  state.currentPageError = null;
  state.currentPartialScreenshot = null;

  const [pageResult, screenshotResult] = await Promise.all([
    requestPageContent(),
    requestVisibleScreenshot(),
  ]);

  if (pageResult?.success && pageResult.content) {
    state.currentPageContent = pageResult.content;
    state.currentPageError = null;
    updatePageInfo(pageResult.title, pageResult.url);
  } else {
    state.currentPageContent = null;
    state.currentPageError = pageResult?.error || "無法取得頁面內容";
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
      ${["A", "B", "C"]
        .map(
          () => `
        <div class="capture-card loading">
          <div class="capture-card-header">
            <div class="capture-card-title">載入中</div>
            <div class="capture-card-subtitle">請稍候</div>
          </div>
          <div class="capture-card-body">
            <div class="capture-loading">載入中...</div>
          </div>
        </div>
      `,
        )
        .join("")}
    </div>
  `;
}

function renderCaptureContent() {
  if (!dom.captureContent) return;

  const content = state.currentPageContent;
  const previewText = buildTextPreview(content);
  const statsText = buildTextStats(content);
  const title = content?.title ? escapeHtml(content.title) : "無標題";
  const url = content?.url ? escapeHtml(content.url) : "";
  const descriptionRaw =
    content?.meta?.description || content?.meta?.["og:description"] || "";
  const description = descriptionRaw ? escapeHtml(descriptionRaw) : "";

  const textBodyHtml = content
    ? `
        <div class="capture-text-meta">
          <div class="capture-meta-row">
            <span class="capture-meta-label">標題</span>
            <span class="capture-meta-value">${title}</span>
          </div>
          ${
            url
              ? `
          <div class="capture-meta-row">
            <span class="capture-meta-label">網址</span>
            <span class="capture-meta-value">${url}</span>
          </div>`
              : ""
          }
          ${
            description
              ? `
          <div class="capture-meta-row">
            <span class="capture-meta-label">描述</span>
            <span class="capture-meta-value">${description}</span>
          </div>`
              : ""
          }
        </div>
        <div class="capture-text-preview">${escapeHtml(previewText)}</div>
      `
    : `<div class="capture-error">${escapeHtml(state.currentPageError || "沒有可用的內容")}</div>`;

  const fullShot = state.currentPageScreenshot;
  const partialShot = state.currentPartialScreenshot;
  const isFullPage =
    !!state.currentFullPageScreenshot &&
    state.currentPageScreenshot === state.currentFullPageScreenshot;

  const fullThumbAction = fullShot ? "open-full" : "refresh-full";
  const partialThumbAction = partialShot ? "open-partial" : "capture-partial";
  const fullThumbLabel = isFullPage ? "整頁截圖" : "可見範圍";

  const fullThumbHtml = fullShot
    ? `<img src="${escapeAttr(fullShot)}" alt="頁面截圖">
       <div class="capture-thumb-label">${fullThumbLabel}</div>
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
          <button class="btn-soft" data-action="copy-text">📋 複製到對話視窗</button>
          <button class="btn-soft" data-action="copy-structured">複製結構化</button>
        </div>
      </div>

      <div class="capture-card">
        <div class="capture-card-header">
          <div class="capture-card-title">B 頁面截圖</div>
          <div class="capture-card-subtitle">${isFullPage ? "已擷取整頁" : "自動擷取可見範圍"}</div>
        </div>
        <div class="capture-card-body">
          <div class="capture-thumb" data-action="${fullThumbAction}">${fullThumbHtml}</div>
        </div>
        <div class="capture-card-actions">
          <button class="btn-soft" data-action="fullpage-screenshot">📜 整頁截圖</button>
          <button class="btn-soft" data-action="refresh-full">重新擷取</button>
          <button class="btn-soft" data-action="download-full">下載截圖</button>
          <button class="btn-soft" data-action="send-full-to-chat">💬 傳送到對話</button>
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
          <button class="btn-soft" data-action="download-partial">下載截圖</button>
          <button class="btn-soft" data-action="send-partial-to-chat">💬 傳送到對話</button>
        </div>
      </div>
    </div>
  `;
}

function buildTextPreview(content) {
  if (!content) return "";
  const paragraphs =
    Array.isArray(content.paragraphs) && content.paragraphs.length
      ? content.paragraphs
      : (content.text || "").split(/\n{2,}/g).filter(Boolean);
  const preview = paragraphs.slice(0, 3).join("\n\n").trim();
  return preview || content.text || "";
}

function buildTextStats(content) {
  if (!content) return "尚無文字";
  const parts = [];
  if (content.charCount) {
    parts.push(`${content.charCount} 字`);
  } else if (content.wordCount) {
    parts.push(`${content.wordCount} 字`);
  }
  if (content.paragraphs?.length) parts.push(`${content.paragraphs.length} 段`);
  if (content.headings?.length) parts.push(`${content.headings.length} 標題`);
  if (content.codeBlocks?.length)
    parts.push(`${content.codeBlocks.length} 程式碼`);
  if (content.extractor === "defuddle") parts.push("✨ Defuddle");
  return parts.length > 0 ? parts.join(" · ") : "尚無文字";
}

function handleCaptureContentClick(event) {
  const target = event.target.closest("[data-action]");
  if (!target) return;

  const action = target.dataset.action;
  switch (action) {
    case "copy-text":
      copyAllContent();
      break;
    case "copy-structured":
      copyStructuredContent();
      break;
    case "refresh-full":
      refreshFullScreenshot();
      break;
    case "capture-partial":
      refreshPartialScreenshot();
      break;
    case "download-full":
      downloadScreenshot(state.currentPageScreenshot, "sidepilot-page.png");
      break;
    case "download-partial":
      downloadScreenshot(
        state.currentPartialScreenshot,
        "sidepilot-partial.png",
      );
      break;
    case "fullpage-screenshot":
      refreshFullPageScreenshot();
      break;
    case "open-full":
      openScreenshotInTab(state.currentPageScreenshot);
      break;
    case "open-partial":
      openScreenshotInTab(state.currentPartialScreenshot);
      break;
    case "send-full-to-chat":
      attachScreenshotToChat(state.currentPageScreenshot, "頁面截圖");
      break;
    case "send-partial-to-chat":
      attachScreenshotToChat(state.currentPartialScreenshot, "部分截圖");
      break;
    default:
      break;
  }
}

function attachScreenshotToChat(dataUrl, label) {
  if (!dataUrl) {
    showToast("沒有可用的截圖", "warning");
    return;
  }
  // Strip dataURL prefix to get raw base64
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
  const mimeMatch = dataUrl.match(/^data:(image\/\w+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
  state.pendingChatImages.push({ mimeType, data: base64 });
  showToast(
    `${label} 已附加，將隨下次訊息傳送 (${state.pendingChatImages.length} 張)`,
  );
  updatePendingImagesBadge();
}

function updatePendingImagesBadge() {
  let badge = document.getElementById("pendingImagesBadge");
  const count = state.pendingChatImages.length;
  if (count === 0) {
    if (badge) badge.remove();
    return;
  }
  if (!badge) {
    badge = document.createElement("span");
    badge.id = "pendingImagesBadge";
    badge.className = "pending-images-badge";
    badge.title = "點擊清除附加圖片";
    badge.addEventListener("click", () => {
      state.pendingChatImages = [];
      updatePendingImagesBadge();
      showToast("已清除附加圖片");
    });
    dom.sdkSendBtn?.parentElement?.insertBefore(badge, dom.sdkSendBtn);
  }
  badge.textContent = `📎 ${count}`;
}

function getToggleableSettingsSections() {
  return Array.from(
    document.querySelectorAll('.settings-section[data-toggleable="true"]'),
  );
}

function applySettingsSectionSideEffects(section, expanded) {
  if (!section) return;

  if (section.id === "settingsSectionInstall") {
    if (expanded && state.currentTab === "settings") {
      startBridgeSectionPolling();
    } else {
      stopBridgeSectionPolling();
    }
  }

  if (section.id === "settingsSectionProviders") {
    if (expanded && state.currentTab === "settings") {
      startAntigravitySectionPolling();
    } else {
      stopAntigravitySectionPolling();
    }
  }
}

function setSettingsSectionExpanded(section, expanded, options = {}) {
  if (!section) return;

  const nextCollapsed = !expanded;
  const wasCollapsed = section.classList.contains("collapsed");
  if (wasCollapsed === nextCollapsed) return;

  section.classList.toggle("collapsed", nextCollapsed);
  const title = section.querySelector('.settings-section-title[data-toggle="section"]');
  if (title) {
    title.setAttribute("aria-expanded", String(expanded));
  }

  applySettingsSectionSideEffects(section, expanded);

  if (expanded && options.enforceLimit !== false) {
    const sections = getToggleableSettingsSections();
    const anchorIndex = sections.indexOf(section);
    while (
      sections.filter((item) => !item.classList.contains("collapsed")).length >
      SETTINGS_MAX_OPEN_SECTIONS
    ) {
      const openSections = sections.filter(
        (item) => !item.classList.contains("collapsed") && item !== section,
      );
      if (openSections.length === 0) break;

      let farthestSection = openSections[0];
      let farthestDistance = Math.abs(
        sections.indexOf(farthestSection) - anchorIndex,
      );

      openSections.forEach((item) => {
        const distance = Math.abs(sections.indexOf(item) - anchorIndex);
        if (distance > farthestDistance) {
          farthestSection = item;
          farthestDistance = distance;
        }
      });

      setSettingsSectionExpanded(farthestSection, false, {
        enforceLimit: false,
      });
    }
  }
}

function toggleSettingsSection(section) {
  if (!section) return;
  setSettingsSectionExpanded(section, section.classList.contains("collapsed"));
}

function updateIframeModeBtnState(enabled) {
  dom.modeSwitchBtns?.forEach((btn) => {
    if (btn.dataset.mode === "iframe") {
      btn.classList.toggle("mode-btn-locked", !enabled);
      btn.title = enabled ? "" : "請先至「設定 › iframe 模式」開啟此功能";
    }
  });
}

function navigateToSettingsSection(sectionI18nKey) {
  switchTab("settings");
  requestAnimationFrame(() => {
    const title = document.querySelector(
      `.settings-section-title[data-i18n="settings.section.${sectionI18nKey}"]`,
    );
    if (!title) return;
    const section = title.closest(".settings-section");
    if (!section) return;
    setSettingsSectionExpanded(section, true);
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

async function setModeFromUI(mode) {
  if (!["iframe", "sdk"].includes(mode)) return;
  if (state.detectedMode === mode) {
    if (mode === "iframe") {
      ensureIframeFrameReady({
        recoverIfBlank: true,
        recoverIfError: true,
      });
    }
    return;
  }

  if (mode === "iframe" && !state.settings?.iframeEnabled) {
    showToast("請先至「設定 › iframe 模式」手動開啟 iframe 模式", "warning");
    navigateToSettingsSection("iframe");
    return;
  }

  dom.modeSwitchBtns?.forEach((btn) => {
    btn.disabled = true;
  });

  try {
    const response = await chrome.runtime.sendMessage({
      action: "setMode",
      mode,
    });
    if (!response?.success) {
      throw new Error(response?.error || "Unknown error");
    }

    state.detectedMode = response.mode || mode;
    updateModeBadge();
    showToast(`已切換為 ${state.detectedMode.toUpperCase()} 模式`);

    if (state.detectedMode === "sdk") {
      const bridgeResult = await ensureSDKBridgeReadyWithAutoStart({
        source: "mode-switch",
        showToast: true,
      });
      if (!bridgeResult?.success) {
        const detail =
          bridgeResult?.detail || bridgeResult?.code || "bridge unavailable";
        showToast("SDK Bridge 未連線，請先啟動本機 bridge server", "warning");
        addSDKMessage("assistant", buildSDKUnavailableHelpMessage(detail));
      } else {
        await loadSDKModelOptions();
      }
      maybeShowSDKLoginGuideOnFirstUse();
    }
  } catch (err) {
    console.error("[SidePilot] Failed to switch mode:", err);
    showToast(`模式切換失敗：${err.message}`, "error");
  } finally {
    dom.modeSwitchBtns?.forEach((btn) => {
      btn.disabled = false;
    });
  }
}

function requestPageContent() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: "getPageContent" }, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message });
        return;
      }
      resolve(response || { success: false, error: "無法取得頁面內容" });
    });
  });
}

function requestVisibleScreenshot() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { action: "captureVisibleScreenshot" },
      (response) => {
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: chrome.runtime.lastError.message });
          return;
        }
        resolve(response || { success: false, error: "無法擷取截圖" });
      },
    );
  });
}

function requestPartialScreenshot() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { action: "capturePartialScreenshot" },
      (response) => {
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: chrome.runtime.lastError.message });
          return;
        }
        resolve(response || { success: false, error: "無法擷取部分截圖" });
      },
    );
  });
}

async function refreshFullScreenshot() {
  showToast("擷取頁面截圖中...");
  const result = await requestVisibleScreenshot();
  if (result?.success && result.dataUrl) {
    state.currentPageScreenshot = result.dataUrl;
    renderCaptureContent();
    showToast("頁面截圖已更新");
  } else {
    showToast(result?.error || "擷取失敗", "error");
  }
}

async function refreshPartialScreenshot() {
  showToast("請在頁面上拖曳選取區域...");
  const result = await requestPartialScreenshot();
  if (result?.success && result.dataUrl) {
    state.currentPartialScreenshot = result.dataUrl;
    renderCaptureContent();
    showToast("部分截圖已更新");
  } else if (result?.error) {
    showToast(result.error, "error");
  }
}

function requestFullPageScreenshot() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { action: "captureFullPageScreenshot" },
      (response) => {
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: chrome.runtime.lastError.message });
          return;
        }
        resolve(response || { success: false, error: "無法擷取整頁截圖" });
      },
    );
  });
}

async function refreshFullPageScreenshot() {
  showToast("整頁截圖擷取中，請稍候...");
  const result = await requestFullPageScreenshot();
  if (result?.success && result.dataUrl) {
    state.currentFullPageScreenshot = result.dataUrl;
    state.currentPageScreenshot = result.dataUrl;
    renderCaptureContent();
    showToast("整頁截圖已完成");
  } else {
    showToast(result?.error || "整頁截圖失敗", "error");
  }
}

function openScreenshotInTab(dataUrl) {
  if (!dataUrl) {
    showToast("尚無截圖可開啟", "error");
    return;
  }
  chrome.tabs.create({ url: dataUrl });
}

function downloadScreenshot(dataUrl, filename) {
  if (!dataUrl) {
    showToast("尚無截圖可下載", "error");
    return;
  }
  chrome.downloads.download({ url: dataUrl, filename, saveAs: true }, () => {
    if (chrome.runtime.lastError) {
      showToast("下載失敗: " + chrome.runtime.lastError.message, "error");
    } else {
      showToast("已開始下載");
    }
  });
}

// ============================================
// Memory -> Copilot Prompt Injection
// ============================================

function listAllMemoryEntries() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: "memory.list", filter: {} },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (!response?.success) {
          reject(new Error(response?.error || "Failed to load memory entries"));
          return;
        }

        resolve(Array.isArray(response.entries) ? response.entries : []);
      },
    );
  });
}

function loadRulesContent() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: "rules.load" }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (!response?.success) {
        reject(new Error(response?.error || "Failed to load rules"));
        return;
      }

      resolve(typeof response.content === "string" ? response.content : "");
    });
  });
}

function extractPromptTerms(input) {
  if (!input || typeof input !== "string") {
    return [];
  }

  const stopWords = new Set([
    "the",
    "and",
    "for",
    "with",
    "that",
    "this",
    "from",
    "your",
    "have",
    "what",
    "please",
    "help",
    "about",
    "into",
    "just",
    "make",
    "show",
    "need",
    "want",
    "how",
    "can",
    "could",
    "should",
    "would",
    "where",
    "when",
    "why",
    "who",
    "is",
    "are",
    "to",
    "of",
    "in",
    "on",
    "at",
    "it",
    "we",
    "you",
    "a",
    "an",
  ]);

  const matches =
    input.toLowerCase().match(/[\p{Script=Han}]{2,}|[a-z0-9_]{2,}/gu) || [];
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
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => ({
      id: entry.id,
      type: entry.type || "note",
      title: typeof entry.title === "string" ? entry.title.trim() : "",
      content: typeof entry.content === "string" ? entry.content.trim() : "",
      source: normalizeEntrySource(entry),
      status: entry.status,
      updatedAt: Number(entry.updatedAt) || Number(entry.createdAt) || 0,
    }))
    .filter((entry) => entry.title || entry.content);
}

function scoreMemoryEntry(entry, lowerInput, terms) {
  const haystack = `${entry.title}\n${entry.content}`.toLowerCase();
  let score = MEMORY_TYPE_WEIGHT[entry.type] || 0;

  if (entry.type === "task") {
    if (entry.status === "in_progress") score += 2;
    if (entry.status === "pending") score += 1;
  }

  if (lowerInput && haystack.includes(lowerInput)) {
    score += 4;
  }

  for (const term of terms) {
    if (!haystack.includes(term)) continue;
    const containsHan = /[\p{Script=Han}]/u.test(term);
    score += containsHan ? 3 : term.length >= 4 ? 3 : 2;
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
  const lowerInput = (userInput || "").trim().toLowerCase();

  const scored = normalized.map((entry) => ({
    ...entry,
    _score: scoreMemoryEntry(entry, lowerInput, terms),
  }));

  scored.sort((a, b) => {
    if (b._score !== a._score) return b._score - a._score;
    return b.updatedAt - a.updatedAt;
  });

  let selected = scored.filter((entry) => entry._score >= 3);
  if (!selected.length) {
    selected = scored.filter(
      (entry) => entry.type === "context" || entry.type === "reference",
    );
  }
  if (!selected.length) {
    selected = scored;
  }

  return selected
    .slice(0, MEMORY_PROMPT_MAX_ENTRIES)
    .map(({ _score, ...entry }) => entry);
}

function truncateForPrompt(text, maxLength) {
  if (typeof text !== "string") return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, Math.max(0, maxLength - 3)) + "...";
}

function formatMemoryEntryForPrompt(entry) {
  const title = truncateForPrompt(entry.title || "(Untitled)", 120);
  const compactContent = entry.content.replace(/\s+/g, " ").trim();
  return {
    id: entry.id,
    type: entry.type,
    status: entry.status || null,
    title,
    content: truncateForPrompt(compactContent, MEMORY_PROMPT_MAX_ENTRY_CONTENT),
  };
}

function buildMemoryInjectedPrompt(
  userInput,
  memoryEntries,
  rulesContent = "",
  options = {},
) {
  const { useStructuredOutput = true, identityText = "" } = options;
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

  const normalizedRules = truncateForPrompt(
    (rulesContent || "").trim(),
    RULES_PROMPT_MAX_LENGTH,
  );
  const rulesInjected = normalizedRules.length > 0;

  const packet = {
    schema: SIDEPILOT_PACKET_SCHEMA,
    context: {
      identity: identityText || null,
      rules: rulesInjected ? normalizedRules : null,
      memory: memoryPacket.length > 0 ? memoryPacket : null,
    },
    user_message: userInput,
    instructions: [
      "Use memory and rules only when relevant.",
      "If context conflicts with the latest user message, prioritize the latest user message.",
      "In sidepilot_packet.used_memory_ids, include only ids you actually used.",
      "Do not reveal chain-of-thought.",
    ],
  };

  if (useStructuredOutput) {
    packet.output_contract = {
      schema: SIDEPILOT_SANDBOX_SCHEMA,
      packet_tag: "sidepilot_packet",
      response_tag: "assistant_response",
    };

    const lines = [
      "[[SIDEPILOT_TURN_PACKET]]",
      JSON.stringify(packet, null, 2),
      "[[END_SIDEPILOT_TURN_PACKET]]",
    ];

    return {
      prompt: lines.join("\n"),
      injectedCount: memoryPacket.length,
      rulesInjected,
    };
  }

  const plainSections = [
    "Use memory and rules only when relevant.",
    "If context conflicts with the latest user message, prioritize the latest user message.",
    "Do not reveal chain-of-thought.",
  ];

  if (identityText) {
    plainSections.push("", "[Identity]", identityText.trim());
  }

  if (rulesInjected) {
    plainSections.push("", "[Rules]", normalizedRules);
  }

  if (memoryPacket.length > 0) {
    plainSections.push("", "[Relevant Memory]");
    memoryPacket.forEach((entry, index) => {
      plainSections.push(
        `${index + 1}. [${entry.type}] ${entry.title}`,
        entry.content,
      );
    });
  }

  plainSections.push("", "[User Message]", userInput);

  return {
    prompt: plainSections.join("\n"),
    injectedCount: memoryPacket.length,
    rulesInjected,
  };
}

function updateSDKMemorySummary(text) {
  if (!dom.sdkMemorySummary) return;
  dom.sdkMemorySummary.textContent = text;
}

function syncContextChildToggles() {
  const masterOn = !!dom.sdkIncludeMemory?.checked;
  if (dom.contextChildToggles) {
    dom.contextChildToggles.classList.toggle("disabled", !masterOn);
  }
  syncStructuredOutputDependency();
}

function syncStructuredOutputDependency() {
  const masterOn = !!dom.sdkIncludeMemory?.checked;
  const structOn = !!dom.sdkStructuredOutput?.checked;
  const enabled = masterOn && structOn;

  if (dom.sdkIncludeSystemMsg) {
    dom.sdkIncludeSystemMsg.disabled = !enabled;
  }
  if (dom.sdkIncludeSystemMsgItem) {
    dom.sdkIncludeSystemMsgItem.classList.toggle("disabled", !enabled);
  }
}

function refreshSDKMemorySummary() {
  const masterOn = !!dom.sdkIncludeMemory?.checked;
  if (!masterOn) {
    updateSDKMemorySummary("Context: off");
    return;
  }
  const parts = [];
  if (dom.sdkIncludeIdentity?.checked) parts.push("id");
  if (dom.sdkIncludeMemoryEntries?.checked) parts.push("mem");
  if (dom.sdkIncludeRules?.checked) parts.push("rules");
  if (dom.sdkStructuredOutput?.checked) {
    if (dom.sdkIncludeSystemMsg?.checked) parts.push("sys");
    parts.push("struct");
  }
  updateSDKMemorySummary(
    parts.length > 0
      ? `Context: ${parts.join(", ")}`
      : "Context: on (none selected)",
  );
}

function applySDKAssistantOnlyMode() {
  const enabled = !!dom.sdkAssistantOnly?.checked;

  if (dom.sdkMessages) {
    dom.sdkMessages.classList.toggle("assistant-only", enabled);
  }

  try {
    localStorage.setItem(
      STORAGE_KEY_SDK_ASSISTANT_ONLY,
      enabled ? "true" : "false",
    );
  } catch (err) {
    console.warn(
      "[SidePilot] Failed to persist assistant-only mode:",
      err?.message || err,
    );
  }
}

// ============================================
// 複製功能
// ============================================

async function copyAllContent() {
  if (!state.currentPageContent) {
    showToast("沒有可複製的內容", "error");
    return;
  }

  const markdown = formatAsMarkdown(state.currentPageContent);

  // Paste into the active chat input
  if (state.detectedMode === "sdk" && dom.sdkInput) {
    const existing = dom.sdkInput.value;
    dom.sdkInput.value = existing ? `${existing}\n\n${markdown}` : markdown;
    dom.sdkInput.focus();
    showToast("已貼入對話輸入區");
  } else {
    // iframe mode: copy to clipboard as fallback
    await copyToClipboard(markdown, "已複製，可貼到 Copilot 對話中");
  }
}

async function copyStructuredContent() {
  if (!state.currentPageContent) {
    showToast("沒有可複製的內容", "error");
    return;
  }

  const structured = formatAsStructured(state.currentPageContent);
  await copyToClipboard(structured, "結構化資料已複製");
}

function formatAsMarkdown(content) {
  const lines = [];

  lines.push("# 頁面內容摘要");
  lines.push("");

  if (content.title) {
    lines.push(`**標題:** ${content.title}`);
  }
  if (content.url) {
    lines.push(`**網址:** ${content.url}`);
  }
  const description =
    content.meta?.description || content.meta?.["og:description"];
  if (description) {
    lines.push(`**描述:** ${description}`);
  }
  if (content.extractor) {
    lines.push(`**擷取:** ${content.extractor}`);
  }
  lines.push("");

  // If Defuddle produced markdown, use it directly — it's already clean
  if (content.markdown && content.extractor === "defuddle") {
    lines.push("## 主要內容");
    lines.push(content.markdown.substring(0, 8000));
    return lines.join("\n");
  }

  if (content.headings?.length > 0) {
    lines.push("## 頁面結構");
    content.headings.forEach((h) => {
      const indent = "  ".repeat(parseInt(h.level.charAt(1)) - 1);
      lines.push(`${indent}- ${h.text}`);
    });
    lines.push("");
  }

  if (content.codeBlocks?.length > 0) {
    lines.push("## 程式碼區塊");
    content.codeBlocks.forEach((block, i) => {
      const code = typeof block === "string" ? block : block.code;
      const lang = typeof block === "object" ? block.language : "";
      lines.push(`\n### 程式碼 ${i + 1}`);
      lines.push("```" + lang);
      lines.push(code);
      lines.push("```");
    });
    lines.push("");
  }

  if (content.paragraphs?.length > 0) {
    lines.push("## 主要內容");
    lines.push(content.paragraphs.join("\n\n").substring(0, 5000));
  } else if (content.text) {
    lines.push("## 主要內容");
    lines.push(content.text.substring(0, 5000));
  }

  return lines.join("\n");
}

function formatAsStructured(content) {
  const payload = {
    title: content.title || "",
    url: content.url || "",
    meta: content.meta || {},
    headings: content.headings || [],
    paragraphs: content.paragraphs || [],
    codeBlocks: content.codeBlocks || [],
    wordCount: content.wordCount || 0,
    charCount: content.charCount || 0,
  };
  return JSON.stringify(payload, null, 2);
}

async function copyToClipboard(text, successMessage) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage || "已複製");
    return true;
  } catch (err) {
    showToast("複製失敗: " + err.message, "error");
    return false;
  }
}

// ============================================
// 背景訊息處理
// ============================================

function handleBackgroundMessage(message, sender, sendResponse) {
  if (message.action === "tabUpdated" || message.action === "tabActivated") {
    updatePageInfo(message.title, message.url);

    // 如果擷取面板開啟中，重新載入內容
    if (state.isCapturePanelOpen) {
      loadPageContent();
    }
    return;
  }

  if (message.action === "externalLinkRedirected") {
    showToast("連結超出 Sidecar 範圍，已改為新分頁開啟", "warning");
  }
}

// ============================================
// Logs
// ============================================

function loadLogs() {
  try {
    const raw = localStorage.getItem(LOG_STORAGE_KEY);
    if (!raw) {
      state.logs = [];
      return;
    }
    const parsed = JSON.parse(raw);
    state.logs = Array.isArray(parsed) ? parsed : [];
  } catch {
    state.logs = [];
  }
}

function persistLogs() {
  try {
    localStorage.setItem(
      LOG_STORAGE_KEY,
      JSON.stringify(state.logs.slice(-LOG_MAX_ENTRIES)),
    );
  } catch {
    // ignore persistence failure
  }
}

function addLog(level, message, detail = "") {
  const normalizedLevel =
    level === "error" || level === "warn" ? level : "info";
  const safeMessage = String(message || "").trim();
  if (!safeMessage) return;

  const detailText =
    typeof detail === "string"
      ? detail.trim()
      : detail
        ? JSON.stringify(detail)
        : "";

  state.logs.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ts: Date.now(),
    level: normalizedLevel,
    message: safeMessage,
    detail: detailText,
  });

  if (state.logs.length > LOG_MAX_ENTRIES) {
    state.logs = state.logs.slice(-LOG_MAX_ENTRIES);
  }

  persistLogs();

  const activeTab = Array.from(dom.tabs || []).find((tab) =>
    tab.classList.contains("active"),
  );
  if (activeTab?.dataset?.tab === "logs") {
    renderLogs();
  }
}

function getFilteredLogs() {
  const level = (dom.logLevelFilter?.value || "").trim();
  const query = (dom.logSearch?.value || "").trim().toLowerCase();

  return state.logs.filter((entry) => {
    if (level && entry.level !== level) return false;
    if (!query) return true;
    const haystack = `${entry.message} ${entry.detail || ""}`.toLowerCase();
    return haystack.includes(query);
  });
}

function renderLogs() {
  if (!dom.logList) return;

  const entries = getFilteredLogs().slice().reverse();
  if (entries.length === 0) {
    dom.logList.innerHTML =
      '<div class="log-empty">目前沒有符合條件的 log</div>';
    return;
  }

  dom.logList.innerHTML = entries
    .map((entry) => {
      const t = new Date(entry.ts);
      const ts = `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}:${String(t.getSeconds()).padStart(2, "0")}`;
      const lvl = entry.level.toUpperCase().padEnd(5);
      const detail = entry.detail ? `\n  ${escapeHtml(entry.detail)}` : "";
      return `<div class="log-raw-line"><span class="log-raw-ts">${ts}</span> <span class="log-raw-lvl">${lvl}</span> ${escapeHtml(entry.message)}${detail}</div>`;
    })
    .join("");
}

function clearLogs() {
  state.logs = [];
  persistLogs();
  renderLogs();
  showToast("Logs 已清空");
}

async function copyLogsToClipboard() {
  const entries = getFilteredLogs();
  if (entries.length === 0) {
    showToast("沒有可複製的 log", "warning");
    return;
  }

  const lines = entries.map((entry) => {
    const timeText = new Date(entry.ts).toLocaleString("zh-TW", {
      hour12: false,
    });
    const detail = entry.detail ? ` | ${entry.detail}` : "";
    return `[${timeText}] [${entry.level.toUpperCase()}] ${entry.message}${detail}`;
  });

  await copyToClipboard(lines.join("\n"), "Logs 已複製");
}

// Bridge real-time log SSE
function connectBridgeLogSSE() {
  disconnectBridgeLogSSE();
  createAuthorizedBridgeEventSource("/api/logs/stream")
    .then((eventSource) => {
      state.bridgeLogSSE = eventSource;
    state.bridgeLogSSE.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.connected) return;
        addLog(data.level || "info", `[Bridge] ${data.message || ""}`, "");
      } catch {
        /* ignore parse errors */
      }
    };
    state.bridgeLogSSE.onerror = () => {
      // Will auto-reconnect; don't flood logs
    };
    })
    .catch(() => {
    // Bridge not available
    });
}

function disconnectBridgeLogSSE() {
  if (state.bridgeLogSSE) {
    state.bridgeLogSSE.close();
    state.bridgeLogSSE = null;
  }
}

// ============================================
// Bridge History Log Tab
// ============================================

let logFileListEl = null;
let refreshLogBtn = null;

function setIframeAgentsExpanded(expanded) {
  if (!dom.logContainerIframe || !dom.logIframeAgentsToggle) return;

  dom.logContainerIframe.classList.toggle("collapsed", !expanded);
  dom.logIframeAgentsToggle.setAttribute("aria-expanded", String(expanded));

  const badge = dom.logIframeAgentsToggle.querySelector(".log-toolbar-badge");
  if (badge) {
    badge.textContent = expanded ? "▾" : "▸";
  }

  if (dom.logIframeAgentsBody) {
    dom.logIframeAgentsBody.style.display = expanded ? "flex" : "none";
  }

  if (expanded && dom.logIframeAgents && !dom.logIframeAgents.src) {
    dom.logIframeAgents.src = "https://github.com/copilot/agents";
  }
}

function updateHistoryTabMode() {
  if (!dom.logContainerSdk || !dom.logContainerIframe) return;

  if (state.detectedMode === "sdk") {
    dom.logContainerSdk.classList.remove("hidden");
    dom.logContainerSdk.style.display = "flex";
    dom.logContainerIframe.classList.add("hidden");
    dom.logContainerIframe.style.display = "none";
    setIframeAgentsExpanded(false);
  } else {
    dom.logContainerSdk.classList.add("hidden");
    dom.logContainerSdk.style.display = "none";
    dom.logContainerIframe.classList.remove("hidden");
    dom.logContainerIframe.style.display = "flex";
    setIframeAgentsExpanded(false);
  }
}

// ── History: parsing & labeling ──

function extractUserMessage(content) {
  if (typeof content !== "string")
    return { text: String(content || ""), tags: [] };
  const tags = [];
  const packetMatch = content.match(
    /\[\[SIDEPILOT_TURN_PACKET\]\]([\s\S]*?)\[\[END_SIDEPILOT_TURN_PACKET\]\]/,
  );
  if (packetMatch) {
    tags.push("packet");
    try {
      const pkt = JSON.parse(packetMatch[1]);
      if (pkt.context?.memory?.length > 0) tags.push("mem");
      if (pkt.context?.rules) tags.push("rules");
      if (pkt.output_contract) tags.push("struct");
      return { text: pkt.user_message || content, tags };
    } catch {
      /* fall through */
    }
  }
  return { text: content, tags };
}

function extractAssistantMessage(content) {
  if (typeof content !== "string")
    return { text: String(content || ""), tags: [] };
  const tags = [];
  const respMatch = content.match(
    /<assistant_response>([\s\S]*?)<\/assistant_response>/,
  );
  if (respMatch) {
    tags.push("parsed");
    return { text: respMatch[1].trim(), tags };
  }
  if (content.includes("<sidepilot_packet>")) tags.push("packet");
  return { text: content, tags };
}

function groupMessagesBySession(messages) {
  const sessions = new Map();
  const orphans = [];
  for (const msg of messages) {
    const sid = msg.sessionId;
    if (!sid) {
      orphans.push(msg);
      continue;
    }
    if (!sessions.has(sid)) sessions.set(sid, []);
    sessions.get(sid).push(msg);
  }
  const groups = [];
  for (const [sid, msgs] of sessions) {
    const models = [
      ...new Set(msgs.filter((m) => m.model).map((m) => m.model)),
    ];
    const userCount = msgs.filter((m) => m.role === "user").length;
    const asstCount = msgs.filter((m) => m.role === "assistant").length;
    const first = msgs[0];
    const last = msgs[msgs.length - 1];
    const firstUserMsg = msgs.find((m) => m.role === "user");
    const preview = firstUserMsg
      ? extractUserMessage(firstUserMsg.content).text
      : "";
    groups.push({
      sessionId: sid,
      messages: msgs,
      models,
      userCount,
      assistantCount: asstCount,
      startTime: first.timestamp,
      endTime: last.timestamp,
      preview: preview.length > 60 ? preview.slice(0, 60) + "…" : preview,
      tags: buildSessionTags(msgs, models),
    });
  }
  if (orphans.length > 0) {
    groups.push({
      sessionId: null,
      messages: orphans,
      models: [...new Set(orphans.filter((m) => m.model).map((m) => m.model))],
      userCount: orphans.filter((m) => m.role === "user").length,
      assistantCount: orphans.filter((m) => m.role === "assistant").length,
      startTime: orphans[0]?.timestamp,
      endTime: orphans[orphans.length - 1]?.timestamp,
      preview: "",
      tags: ["orphan"],
    });
  }
  return groups;
}

function buildSessionTags(msgs, models) {
  const tags = [];
  if (models.length > 0) tags.push(...models);
  const hasPacket = msgs.some(
    (m) =>
      m.role === "user" &&
      typeof m.content === "string" &&
      m.content.includes("SIDEPILOT_TURN_PACKET"),
  );
  if (hasPacket) tags.push("context");
  const hasMem = msgs.some((m) => {
    if (m.role !== "user" || typeof m.content !== "string") return false;
    const match = m.content.match(
      /\[\[SIDEPILOT_TURN_PACKET\]\]([\s\S]*?)\[\[END_SIDEPILOT_TURN_PACKET\]\]/,
    );
    if (!match) return false;
    try {
      const p = JSON.parse(match[1]);
      return p.context?.memory?.length > 0;
    } catch {
      return false;
    }
  });
  if (hasMem) tags.push("memory");
  return tags;
}

function renderTagBadges(tags) {
  if (!tags || tags.length === 0) return "";
  return tags
    .map(
      (t) =>
        `<span class="hist-tag hist-tag-${tagClass(t)}">${escapeHtml(t)}</span>`,
    )
    .join("");
}

function tagClass(tag) {
  if (["gpt-4o", "gpt-4.1", "gpt-4o-mini", "gpt-5-mini"].includes(tag))
    return "model-gpt";
  if (tag.startsWith("gpt-")) return "model-gpt";
  if (tag.startsWith("claude-")) return "model-claude";
  if (tag.startsWith("gemini-")) return "model-gemini";
  if (["context", "packet", "struct"].includes(tag)) return "context";
  if (["memory", "mem", "rules"].includes(tag)) return "inject";
  if (tag === "parsed") return "parsed";
  if (tag === "orphan") return "orphan";
  return "default";
}

// ── History: file list & rendering ──

async function loadLogFiles() {
  logFileListEl = logFileListEl || document.getElementById("logFileList");
  if (!logFileListEl) return;

  logFileListEl.innerHTML = '<div class="log-empty">載入中...</div>';

  try {
    const data = await bridgeJsonRequest("/api/history");

    if (!data.success || !data.files || data.files.length === 0) {
      logFileListEl.innerHTML = '<div class="log-empty">尚無對話歷史紀錄</div>';
      return;
    }

    renderLogFiles(data.files);
    connectLogSSE();
  } catch (err) {
    logFileListEl.innerHTML = `<div class="log-empty">無法連線 Bridge：${escapeHtml(err.message)}</div>`;
  }
}

function renderLogFiles(files) {
  if (!logFileListEl) return;
  logFileListEl.innerHTML = "";

  files.forEach((file) => {
    const item = document.createElement("div");
    item.className = "log-file-item";

    const header = document.createElement("div");
    header.className = "log-file-header";
    const filePath = file.path || "";
    const pathHtml = filePath
      ? `<span class="log-file-path" title="${escapeHtml(filePath)}">${escapeHtml(filePath)}</span>`
      : "";
    header.innerHTML = `
      <span class="log-file-date">📅 ${escapeHtml(file.date)}</span>
      ${pathHtml}
      <span class="log-file-badge">▸</span>
    `;

    const body = document.createElement("div");
    body.className = "log-file-body";
    body.style.display = "none";

    header.addEventListener("click", () => {
      const isExpanded = item.classList.toggle("expanded");
      body.style.display = isExpanded ? "block" : "none";
      header.querySelector(".log-file-badge").textContent = isExpanded
        ? "▾"
        : "▸";
      if (isExpanded && body.children.length === 0) {
        loadLogFileContent(file.name, body);
      }
    });

    item.appendChild(header);
    item.appendChild(body);
    logFileListEl.appendChild(item);
  });
}

async function loadLogFileContent(filename, container) {
  container.innerHTML = '<div class="log-empty">載入中...</div>';
  try {
    const data = await bridgeJsonRequest(
      `/api/history/${encodeURIComponent(filename)}`,
    );

    if (!data.success || !data.messages || data.messages.length === 0) {
      container.innerHTML = '<div class="log-empty">此日誌沒有訊息</div>';
      return;
    }

    container.innerHTML = "";
    const groups = groupMessagesBySession(data.messages);

    if (groups.length <= 1 && groups[0]?.sessionId === null) {
      // No sessions — render flat
      data.messages.forEach((msg) =>
        container.appendChild(createLogMessageEl(msg)),
      );
      return;
    }

    groups.forEach((group) => {
      const section = document.createElement("div");
      section.className = "hist-session";

      const sHeader = document.createElement("div");
      sHeader.className = "hist-session-header";
      const timeRange = formatTimeRange(group.startTime, group.endTime);
      const stats = `${group.userCount + group.assistantCount} msgs`;
      sHeader.innerHTML = `
        <span class="hist-session-toggle">▸</span>
        <span class="hist-session-time">${timeRange}</span>
        <span class="hist-session-stats">${stats}</span>
        ${renderTagBadges(group.tags)}
        ${group.preview ? `<span class="hist-session-preview">${escapeHtml(group.preview)}</span>` : ""}
      `;

      const sBody = document.createElement("div");
      sBody.className = "hist-session-body";
      sBody.style.display = "none";

      sHeader.addEventListener("click", () => {
        const open = section.classList.toggle("expanded");
        sBody.style.display = open ? "block" : "none";
        sHeader.querySelector(".hist-session-toggle").textContent = open
          ? "▾"
          : "▸";
        if (open && sBody.children.length === 0) {
          group.messages.forEach((msg) =>
            sBody.appendChild(createLogMessageEl(msg)),
          );
        }
      });

      section.appendChild(sHeader);
      section.appendChild(sBody);
      container.appendChild(section);
    });
  } catch (err) {
    container.innerHTML = `<div class="log-empty">讀取失敗：${escapeHtml(err.message)}</div>`;
  }
}

function formatTimeRange(startIso, endIso) {
  const fmt = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString("zh-TW", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const s = fmt(startIso);
  const e = fmt(endIso);
  return s === e ? s : `${s} – ${e}`;
}

function createLogMessageEl(msg) {
  const el = document.createElement("div");
  const role = msg.role || "system";
  el.className = `log-message log-msg-${role}`;

  const roleBadge = role === "user" ? "👤" : role === "assistant" ? "🤖" : "⚙️";
  const timeStr = msg.timestamp
    ? new Date(msg.timestamp).toLocaleTimeString("zh-TW", { hour12: false })
    : "";

  // Extract clean content & per-message tags
  let extracted;
  if (role === "user") {
    extracted = extractUserMessage(msg.content);
  } else if (role === "assistant") {
    extracted = extractAssistantMessage(msg.content);
  } else {
    extracted = {
      text:
        typeof msg.content === "string"
          ? msg.content
          : JSON.stringify(msg.content || ""),
      tags: [],
    };
  }

  const allTags = [...extracted.tags];
  if (msg.model) allTags.unshift(msg.model);

  el.innerHTML = `
    <div class="log-message-header">
      <span class="log-role-badge">${roleBadge} ${escapeHtml(role)}</span>
      ${renderTagBadges(allTags)}
      <span class="log-timestamp">${timeStr}</span>
    </div>
    <div class="log-message-content collapsed" title="點擊展開">
      ${escapeHtml(extracted.text)}
    </div>
  `;

  const contentDiv = el.querySelector(".log-message-content");
  contentDiv.addEventListener("click", () => {
    contentDiv.classList.toggle("collapsed");
  });

  return el;
}

function connectLogSSE() {
  disconnectLogSSE();

  createAuthorizedBridgeEventSource("/api/history/stream")
    .then((eventSource) => {
      state.logSSE = eventSource;
    state.logSSE.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.connected) return;
        appendLiveLogMessage(data);
      } catch {
        /* ignore parse errors */
      }
    };
    state.logSSE.onerror = () => {
      disconnectLogSSE();
    };
    })
    .catch(() => {
    // SSE not available
    });
}

function disconnectLogSSE() {
  if (state.logSSE) {
    state.logSSE.close();
    state.logSSE = null;
  }
}

function appendLiveLogMessage(msg) {
  if (!logFileListEl) return;
  // Append to the first (most recent) expanded file body, or create a live section
  const expandedBody = logFileListEl.querySelector(
    ".log-file-item.expanded .log-file-body",
  );
  if (expandedBody) {
    expandedBody.appendChild(createLogMessageEl(msg));
    expandedBody.scrollTop = expandedBody.scrollHeight;
  }
}

// ============================================
// Toast 通知
// ============================================

function showToast(message, type = "success", duration = 3000) {
  if (!dom.toast) return;

  dom.toast.textContent = message;
  dom.toast.className =
    "toast visible" + (type !== "success" ? ` ${type}` : "");
  addLog(
    type === "warning" ? "warn" : type === "error" ? "error" : "info",
    message,
  );

  setTimeout(() => {
    dom.toast.classList.remove("visible");
  }, duration);
}

// ============================================
// 工具函數
// ============================================

function escapeHtml(text) {
  if (typeof text !== "string") return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function escapeAttr(text) {
  if (typeof text !== "string") return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function detectContentFormat(rawContent) {
  const raw = typeof rawContent === "string" ? rawContent : "";
  const trimmed = raw.trim();
  if (!trimmed) {
    return { type: "text", label: "text", text: "" };
  }

  const jsonCandidate = tryParseJson(trimmed);
  if (jsonCandidate.parsed) {
    return {
      type: "json",
      label: "json",
      text: JSON.stringify(jsonCandidate.value, null, 2),
    };
  }

  if (looksLikeYaml(trimmed)) {
    return { type: "yaml", label: "yaml", text: raw };
  }

  if (looksLikeMarkdown(trimmed)) {
    return {
      type: "markdown",
      label: "markdown",
      html: renderMarkdownToHtml(raw),
    };
  }

  return { type: "text", label: "text", text: raw };
}

function tryParseJson(text) {
  if (!text) return { parsed: false, value: null };
  const starts = text[0];
  if (starts !== "{" && starts !== "[") {
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
  if (text.startsWith("{") || text.startsWith("[")) return false;
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
  const source = String(input || "").replace(/\r\n/g, "\n");
  const segments = [];
  let lastIndex = 0;
  const fencePattern = /```([^\n]*)\n([\s\S]*?)```/g;
  let match;

  while ((match = fencePattern.exec(source)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        content: source.slice(lastIndex, match.index),
      });
    }
    segments.push({
      type: "code",
      lang: (match[1] || "").trim(),
      content: match[2] || "",
    });
    lastIndex = fencePattern.lastIndex;
  }

  if (lastIndex < source.length) {
    segments.push({ type: "text", content: source.slice(lastIndex) });
  }

  const htmlParts = segments.map((segment) => {
    if (segment.type === "code") {
      const code = escapeHtml(segment.content);
      const langClass = segment.lang
        ? ` class="language-${escapeAttr(segment.lang)}"`
        : "";
      return `<pre><code${langClass}>${code}</code></pre>`;
    }
    return renderMarkdownText(segment.content || "");
  });

  return htmlParts.join("");
}

function renderMarkdownText(text) {
  const lines = String(text || "").split("\n");
  const html = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      html.push("</ul>");
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
      const itemText = trimmed.replace(/^[-*+]\s+/, "");
      if (!inList) {
        html.push("<ul>");
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
  return html.join("");
}

function renderMarkdownInline(text) {
  let output = escapeHtml(text);
  output = output.replace(
    /`([^`]+)`/g,
    (_match, code) => `<code>${code}</code>`,
  );
  output = output.replace(
    /\*\*([^*]+)\*\*/g,
    (_match, bold) => `<strong>${bold}</strong>`,
  );
  output = output.replace(
    /\*([^*]+)\*/g,
    (_match, italic) => `<em>${italic}</em>`,
  );
  output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });
  return output;
}

function parseSDKSandboxResponse(rawContent) {
  const content = typeof rawContent === "string" ? rawContent : "";
  const blocks = [];
  const packetObjects = [];
  const tagPattern =
    /<(sidepilot_packet|assistant_response)>([\s\S]*?)<\/\1>/gi;

  let lastIndex = 0;
  let match;

  while ((match = tagPattern.exec(content)) !== null) {
    const prefix = content.slice(lastIndex, match.index).trim();
    if (prefix) {
      blocks.push({
        type: "raw",
        label: "raw_output",
        content: prefix,
        parsed: null,
      });
    }

    const tag = match[1].toLowerCase();
    const inner = (match[2] || "").trim();

    if (tag === "sidepilot_packet") {
      let parsedPacket = null;
      try {
        parsedPacket = JSON.parse(inner);
        packetObjects.push(parsedPacket);
      } catch {
        parsedPacket = null;
      }

      blocks.push({
        type: "packet",
        label: "sidepilot_packet",
        content: inner,
        parsed: parsedPacket,
      });
    } else {
      blocks.push({
        type: "assistant",
        label: "assistant_response",
        content: inner,
        parsed: null,
      });
    }

    lastIndex = tagPattern.lastIndex;
  }

  const suffix = content.slice(lastIndex).trim();
  if (suffix) {
    blocks.push({
      type: "raw",
      label: "raw_output",
      content: suffix,
      parsed: null,
    });
  }

  if (blocks.length === 0) {
    blocks.push({
      type: "raw",
      label: "raw_output",
      content,
      parsed: null,
    });
  }

  return {
    rawContent: content,
    blocks,
    packetObjects,
    hasAssistantBlock: blocks.some((block) => block.type === "assistant"),
    hasPacketBlock: blocks.some((block) => block.type === "packet"),
  };
}

function addSDKStructuredAssistantMessage(parsedResponse) {
  if (!dom.sdkMessages) return;

  const parsed = parsedResponse?.blocks
    ? parsedResponse
    : parseSDKSandboxResponse(parsedResponse);
  const displayBlocks = parsed.hasAssistantBlock
    ? parsed.blocks
    : parsed.blocks.map((block) =>
        block.type === "raw"
          ? {
              ...block,
              type: "assistant",
              label: "assistant_response_fallback",
            }
          : block,
      );

  const msgEl = document.createElement("div");
  msgEl.className = "sdk-message assistant";

  const contentEl = document.createElement("div");
  contentEl.className = "sdk-message-content sdk-structured-content";

  displayBlocks.forEach((block) => {
    let format = null;
    if (block.type === "packet") {
      const packetValue =
        block.parsed && typeof block.parsed === "object"
          ? JSON.stringify(block.parsed, null, 2)
          : block.content || "";
      format = { type: "json", label: "json", text: packetValue };
    } else {
      format = detectContentFormat(block.content || "");
    }

    const blockEl = document.createElement("section");
    blockEl.className = `sdk-structured-block ${block.type} format-${format.type}`;

    const headerEl = document.createElement("div");
    headerEl.className = "sdk-structured-block-header";
    headerEl.textContent = format?.label
      ? `${block.label} · ${format.label}`
      : block.label;

    const isMarkdown = format.type === "markdown";
    const bodyEl = document.createElement(isMarkdown ? "div" : "pre");
    bodyEl.className = "sdk-structured-block-body";

    if (isMarkdown) {
      bodyEl.classList.add("markdown");
      bodyEl.innerHTML = format.html || "";
    } else {
      bodyEl.textContent = (format.text || "").trim() || "(empty)";
    }

    blockEl.appendChild(headerEl);
    blockEl.appendChild(bodyEl);
    contentEl.appendChild(blockEl);
  });

  const timeEl = document.createElement("div");
  timeEl.className = "sdk-message-time";
  const time = new Date();
  timeEl.textContent = time.toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
  });

  msgEl.appendChild(contentEl);
  msgEl.appendChild(timeEl);
  dom.sdkMessages.appendChild(msgEl);
  dom.sdkMessages.scrollTop = dom.sdkMessages.scrollHeight;
}

// ============================================
// SDK Chat Helpers
// ============================================

/**
 * Clear all messages in the SDK chat window
 * @returns {void}
 */
function clearSDKChatMessages() {
  if (!dom.sdkMessages) return;
  dom.sdkMessages.innerHTML = "";
  addSDKMessage("assistant", "🧹 對話已清空，可以開始新的問題了！");
}

/**
 * Display available slash commands help in the chat
 * @returns {void}
 */
function showSDKHelpMessage() {
  const helpText = [
    "📖 可用快捷指令：",
    "  /clear  —  清空對話記錄",
    "  /help   —  顯示這個提示",
    "",
    "💡 操作提示：",
    "  Enter 發送 | Shift+Enter 換行",
    "  垃圾桶按鈕 🗑 也可以清空對話",
  ].join("\n");
  addSDKMessage("assistant", helpText);
}

function addSDKMessage(role, content) {
  if (!dom.sdkMessages) return;

  const msgEl = document.createElement("div");
  msgEl.className = `sdk-message ${role}`;

  // Extract clean content & tags
  let displayText = content;
  let tags = [];
  if (role === "user") {
    const ex = extractUserMessage(content);
    displayText = ex.text;
    tags = ex.tags;
  }

  if (tags.length > 0) {
    const tagBar = document.createElement("div");
    tagBar.className = "sdk-message-tags";
    tagBar.innerHTML = renderTagBadges(tags);
    msgEl.appendChild(tagBar);
  }

  const contentEl = document.createElement("div");
  contentEl.className = "sdk-message-content";
  contentEl.textContent = displayText;

  const timeEl = document.createElement("div");
  timeEl.className = "sdk-message-time";
  const time = new Date();
  timeEl.textContent = time.toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
  });

  msgEl.appendChild(contentEl);
  msgEl.appendChild(timeEl);
  // Add copy action button for assistant messages
  if (role === "assistant") {
    const actionsEl = document.createElement("div");
    actionsEl.className = "sdk-message-actions";
    const copyBtn = document.createElement("button");
    copyBtn.className = "sdk-msg-copy-btn";
    copyBtn.title = "複製訊息內容";
    copyBtn.innerHTML =
      '<svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"/><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"/></svg>';
    copyBtn.addEventListener("click", () => {
      const text = contentEl.textContent || "";
      navigator.clipboard.writeText(text).then(() => {
        copyBtn.innerHTML = "✓";
        setTimeout(() => {
          copyBtn.innerHTML =
            '<svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"/><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"/></svg>';
        }, 1500);
      });
    });
    actionsEl.appendChild(copyBtn);
    msgEl.appendChild(actionsEl);
  }

  dom.sdkMessages.appendChild(msgEl);

  dom.sdkMessages.scrollTop = dom.sdkMessages.scrollHeight;
}

function addSDKTypingIndicator() {
  if (!dom.sdkMessages) return null;

  const id = `typing-${Date.now()}`;
  const msgEl = document.createElement("div");
  msgEl.className = "sdk-message assistant loading";
  msgEl.id = id;

  const indicator = document.createElement("div");
  indicator.className = "sdk-typing-indicator";
  indicator.innerHTML = "<span></span><span></span><span></span>";

  const contentEl = document.createElement("div");
  contentEl.className = "sdk-message-content";
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
// WP-01: Permission SSE & Modal
// ============================================

function schedulePermissionSSEReconnect() {
  if (state.permissionSSEReconnectTimer) {
    clearTimeout(state.permissionSSEReconnectTimer);
  }
  state.permissionSSEReconnectTimer = setTimeout(() => {
    state.permissionSSEReconnectTimer = null;
    connectPermissionSSE();
  }, 5000);
}

function connectPermissionSSE() {
  disconnectPermissionSSE();
  createAuthorizedBridgeEventSource("/api/permissions/stream", {
    forceRefresh: true,
  })
    .then((eventSource) => {
      state.permissionSSE = eventSource;
    state.permissionSSE.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.connected) return;
        if (data.id && data.scope) {
          showPermissionModal(data);
        }
      } catch {
        /* ignore parse errors */
      }
    };
    state.permissionSSE.addEventListener("permission_required", (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.id && data.scope) {
          showPermissionModal(data);
        }
      } catch (err) {
        console.error("[SidePilot] Failed to parse permission event:", err);
      }
    });
    state.permissionSSE.onerror = () => {
      disconnectPermissionSSE();
      schedulePermissionSSEReconnect();
    };
    })
    .catch(() => {
    schedulePermissionSSEReconnect();
    });
}

function disconnectPermissionSSE() {
  if (state.permissionSSE) {
    state.permissionSSE.close();
    state.permissionSSE = null;
  }
  if (state.permissionSSEReconnectTimer) {
    clearTimeout(state.permissionSSEReconnectTimer);
    state.permissionSSEReconnectTimer = null;
  }
}

let _currentPermissionId = null;
let _currentPermissionOptions = [];
let _selectedOptionId = null;

function showPermissionModal(permission) {
  if (!dom.permissionModal) return;
  _currentPermissionId = permission.id;
  _currentPermissionOptions = permission.options || [];
  _selectedOptionId =
    _currentPermissionOptions.length > 0
      ? _currentPermissionOptions[0].optionId
      : null;

  if (dom.permissionScope)
    dom.permissionScope.textContent = permission.scope || "(unknown)";
  if (dom.permissionReason)
    dom.permissionReason.textContent = permission.reason || "";

  // 渲染 permission options 供使用者選擇
  if (dom.permissionOptions) {
    dom.permissionOptions.innerHTML = "";
    _currentPermissionOptions.forEach((opt, idx) => {
      const optionId = opt.optionId || opt.id;
      const optionLabel = opt.label || opt.title || optionId;
      if (!optionId) return;
      const label = document.createElement("label");
      label.className = "permission-option-label";
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "permissionOption";
      radio.value = optionId;
      if (idx === 0) radio.checked = true;
      radio.addEventListener("change", () => {
        _selectedOptionId = optionId;
      });
      label.appendChild(radio);
      label.appendChild(document.createTextNode(` ${optionLabel}`));
      dom.permissionOptions.appendChild(label);
    });
  }

  dom.permissionModal.classList.remove("hidden");
  startPermissionCountdown(60);
  addLog(
    "info",
    `[Permission] 收到權限請求: ${permission.scope} (options: ${_currentPermissionOptions.length})`,
  );
}

function hidePermissionModal() {
  if (dom.permissionModal) dom.permissionModal.classList.add("hidden");
  stopPermissionCountdown();
  _currentPermissionId = null;
  _currentPermissionOptions = [];
  _selectedOptionId = null;
}

function startPermissionCountdown(seconds) {
  stopPermissionCountdown();
  let remaining = seconds;
  if (dom.permissionCountdown) dom.permissionCountdown.textContent = remaining;
  state.permissionCountdownTimer = setInterval(() => {
    remaining--;
    if (dom.permissionCountdown)
      dom.permissionCountdown.textContent = remaining;
    if (remaining <= 0) {
      resolvePermission("deny");
    }
  }, 1000);
}

function stopPermissionCountdown() {
  if (state.permissionCountdownTimer) {
    clearInterval(state.permissionCountdownTimer);
    state.permissionCountdownTimer = null;
  }
}

async function resolvePermission(decision) {
  const permId = _currentPermissionId;
  const optionId = _selectedOptionId;
  hidePermissionModal();
  if (!permId) return;

  const approved = decision === "allow";
  try {
    await bridgeJsonRequest("/api/permission/resolve", {
      method: "POST",
      body: {
        id: permId,
        approved,
        optionId: approved ? optionId : undefined,
      },
      timeoutMs: 5000,
    });
    addLog(
      "info",
      `[Permission] ${approved ? "已允許" : "已拒絕"}: ${permId}${approved && optionId ? ` (option: ${optionId})` : ""}`,
    );
  } catch (err) {
    addLog("error", `[Permission] 解析失敗: ${err.message}`);
  }
}

// ============================================
// WP-07: Prompt Strategy
// ============================================

function updatePromptStrategyUI(strategy) {
  dom.promptStrategyBtns?.querySelectorAll(".strategy-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.strategy === strategy);
  });
}

async function setPromptStrategy(strategy) {
  updatePromptStrategyUI(strategy);

  try {
    await bridgeJsonRequest("/api/prompt/strategy", {
      method: "POST",
      body: { strategy },
    });
    addLog("info", `[Prompt] 策略已切換: ${strategy}`);
  } catch (err) {
    addLog("error", `[Prompt] 策略切換失敗: ${err.message}`);
    loadPromptStrategy();
    showToast("Prompt 策略切換失敗", "error");
  }
}

async function loadPromptStrategy() {
  try {
    const data = await bridgeJsonRequest("/api/prompt/strategy");
    const strategy = data.strategy || "normal";
    updatePromptStrategyUI(strategy);
  } catch {
    // Bridge not available, keep default
  }
}

// ============================================
// 啟動
// ============================================

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    init().catch((err) => {
      console.error("[SidePilot] init failed:", err);
    });
  });
} else {
  init().catch((err) => {
    console.error("[SidePilot] init failed:", err);
  });
}
