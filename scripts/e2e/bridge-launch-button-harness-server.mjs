import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, execFileSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const port = Number(process.env.BRIDGE_E2E_PORT || 43123);

function resolveWindowsLocalAppData() {
  if (process.env.LOCALAPPDATA) {
    return process.env.LOCALAPPDATA;
  }
  try {
    return execFileSync(
      'powershell.exe',
      ['-NoProfile', '-Command', '[Environment]::GetFolderPath("LocalApplicationData")'],
      { encoding: 'utf8' },
    ).trim();
  } catch {
    return '';
  }
}

const launcherPs1 = path.win32.join(
  resolveWindowsLocalAppData(),
  'SidePilot',
  'BridgeLauncher',
  'sidepilot-bridge-launcher.ps1'
);

const sidepanelJsPath = path.join(repoRoot, 'extension', 'sidepanel.js');
const sidepanelCssPath = path.join(repoRoot, 'extension', 'styles.css');

const harnessHtml = `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Bridge Launch Button E2E Harness</title>
  <style>
    body { margin: 0; background: #111827; color: #e5e7eb; font-family: Segoe UI, sans-serif; }
    .shell { max-width: 980px; margin: 24px auto; padding: 16px; border: 1px solid #374151; border-radius: 10px; background: #1f2937; }
    .note { font-size: 12px; color: #9ca3af; margin-bottom: 12px; }
    .tab-content { opacity: 1 !important; transform: none !important; position: relative !important; visibility: visible !important; pointer-events: auto !important; }
    .settings-container { max-height: unset !important; }
    #copilotFrame { width: 100%; height: 1px; border: 0; }
    #loadingOverlay, #errorOverlay, #capturePanel, #welcomeOverlay, #sdkChat, .tab-bar, .mode-switch { display: none !important; }
  </style>
  <link rel="stylesheet" href="/styles.css" />
</head>
<body>
  <div class="shell">
    <div class="note">E2E harness: trigger the primary Bridge action and verify launcher + health.</div>

    <iframe id="copilotFrame" src="about:blank"></iframe>
    <div id="loadingOverlay"></div>
    <div id="errorOverlay" class="hidden"></div>
    <div id="capturePanel"></div>
    <div id="toast"></div>

    <div class="tab-content active" id="settings-tab">
      <div class="settings-container">
        <div class="settings-section" id="settingsSectionInstall">
          <div class="settings-section-title" data-toggle="section">Bridge 設定</div>
          <div class="settings-section-body">
            <div class="settings-item settings-install-card bridge-setup-card">
              <div class="settings-item-text">
                <div class="settings-item-title bridge-setup-heading">
                  <span>SDK Bridge Setup</span>
                  <span class="status-dot" id="bridgeStatusDot"></span>
                </div>
                <div class="settings-item-desc">SDK mode requires a local bridge service and sidepilot:// launcher.</div>
                <div class="bridge-setup-badges" id="bridgeSetupBadges">
                  <span class="bridge-setup-badge" id="bridgeLauncherBadge">Launcher: Unknown</span>
                  <span class="bridge-setup-badge" id="bridgeBridgeBadge">Bridge: Offline</span>
                  <span class="bridge-setup-badge" id="bridgeRuntimeBadge">Runtime: Auto</span>
                </div>
                <div class="bridge-setup-quickstart">
                  <div class="bridge-quickstart-title" id="bridgeInstallStatus">尚未檢查</div>
                  <div class="bridge-quickstart-detail" id="bridgeInstallDetail">-</div>
                </div>
                <div class="bridge-connection-details">
                  <div class="bridge-connection-header">Connection Details</div>
                  <div class="bridge-connection-grid">
                    <div class="bridge-detail-row"><span class="bridge-detail-label">Repo Root</span><span class="bridge-detail-value" id="bridgeDetailRepoRoot">-</span></div>
                    <div class="bridge-detail-row"><span class="bridge-detail-label">Runtime</span><span class="bridge-detail-value" id="bridgeDetailRuntime">-</span></div>
                    <div class="bridge-detail-row"><span class="bridge-detail-label">Launcher</span><span class="bridge-detail-value" id="bridgeDetailLauncher">-</span></div>
                    <div class="bridge-detail-row"><span class="bridge-detail-label">Bridge</span><span class="bridge-detail-value" id="bridgeDetailBridge">-</span></div>
                    <div class="bridge-detail-row"><span class="bridge-detail-label">CLI</span><span class="bridge-detail-value" id="bridgeDetailCli">-</span></div>
                  </div>
                </div>
              </div>
              <label class="settings-item settings-toggle">
                <div class="settings-item-text">
                  <div class="settings-item-title">自動啟動 Bridge（MVP）</div>
                  <div class="settings-item-desc">進入 SDK 模式時，若偵測不到 Bridge，會嘗試喚起 sidepilot:// 啟動器</div>
                </div>
                <input type="checkbox" id="settingAutoStartBridge" checked />
              </label>
              <div class="bridge-setup-actions">
                <button class="btn btn-primary btn-sm" id="bridgePrimaryBtn">嘗試自動啟動 Bridge</button>
                <button class="btn btn-secondary btn-sm" id="bridgeAdvancedToggleBtn" aria-expanded="false">顯示進階選項</button>
              </div>
              <div class="bridge-advanced-panel hidden" id="bridgeAdvancedPanel">
                <div class="settings-item settings-item-vertical">
                  <div class="settings-item-text">
                    <div class="settings-item-title">手動指令 Runtime</div>
                    <div class="settings-item-desc" id="bridgeAdvancedRuntimeHint">只顯示目前選定 runtime 的安裝與手動啟動指令</div>
                  </div>
                  <div class="bridge-runtime-picker" id="bridgeRuntimePicker">
                    <button class="bridge-runtime-btn" type="button" data-runtime="auto">Auto</button>
                    <button class="bridge-runtime-btn" type="button" data-runtime="windows">Windows</button>
                    <button class="bridge-runtime-btn" type="button" data-runtime="wsl">WSL</button>
                  </div>
                </div>
                <div class="settings-item settings-item-vertical">
                  <div class="settings-item-text">
                    <div class="settings-item-title">Launcher 安裝指令</div>
                  </div>
                  <textarea id="bridgeInstallCommandPreview" class="settings-textarea settings-mono-input bridge-command-preview" readonly></textarea>
                </div>
                <div class="settings-item settings-item-vertical">
                  <div class="settings-item-text">
                    <div class="settings-item-title">手動啟動指令</div>
                  </div>
                  <textarea id="bridgeCommandPreview" class="settings-textarea settings-mono-input bridge-command-preview" readonly></textarea>
                </div>
                <div class="settings-item settings-item-vertical">
                  <div class="settings-item-text">
                    <div class="settings-item-title">上次自動啟動結果</div>
                  </div>
                  <div class="settings-item-sub bridge-last-result" id="bridgeLastResultDetail">-</div>
                </div>
                <div class="settings-inline-actions">
                  <button class="btn btn-secondary settings-inline-btn" id="bridgeCheckBtn">重新檢查</button>
                  <button class="btn btn-secondary settings-inline-btn" id="bridgeCopyInstallBtn">複製安裝指令</button>
                  <button class="btn btn-secondary settings-inline-btn" id="bridgeCopyCmdBtn">複製啟動指令</button>
                  <button class="btn btn-secondary settings-inline-btn" id="bridgeCopyCheckBtn">複製檢查指令</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="settings-section collapsed" id="settingsSectionProviders">
          <div class="settings-section-title" data-toggle="section">Provider Probe</div>
          <div class="settings-section-body">
            <div class="settings-item settings-install-card">
              <div class="settings-item-text">
                <div class="settings-item-title">
                  <span>Antigravity Provider Probe</span>
                  <span class="status-dot" id="antigravityStatusDot"></span>
                </div>
                <div class="settings-item-desc" id="antigravityInstallStatus">尚未檢查</div>
                <div class="settings-item-sub" id="antigravityInstallDetail">預設探測：http://127.0.0.1:47619/health</div>
              </div>
              <div class="settings-item settings-item-vertical">
                <div class="settings-item-text">
                  <div class="settings-item-title">Base URL</div>
                </div>
                <input type="text" id="settingAntigravityBaseUrl" class="settings-text-input settings-mono-input" value="http://127.0.0.1:47619" spellcheck="false" />
              </div>
              <div class="settings-item settings-item-vertical">
                <div class="settings-item-text">
                  <div class="settings-item-title">Bridge Token</div>
                </div>
                <input type="password" id="settingAntigravityToken" class="settings-text-input settings-mono-input" autocomplete="off" spellcheck="false" />
              </div>
              <div class="settings-inline-actions">
                <button class="btn btn-secondary settings-inline-btn" id="antigravityHealthBtn">檢查 Health</button>
                <button class="btn btn-secondary settings-inline-btn" id="antigravityMetaBtn">讀取 Meta</button>
                <button class="btn btn-secondary settings-inline-btn" id="antigravityDetectBtn">自動偵測</button>
              </div>
            </div>
          </div>
        </div>

        <div class="settings-section collapsed">
          <div class="settings-section-title" data-toggle="section">SDK 模式</div>
          <div class="settings-section-body">
            <label class="settings-item settings-toggle">
              <div class="settings-item-text">
                <div class="settings-item-title">首次切換 SDK 自動帶出登入引導</div>
              </div>
              <input type="checkbox" id="settingAutoSdkLogin" checked />
            </label>
          </div>
        </div>

        <div class="settings-section collapsed">
          <div class="settings-section-title" data-toggle="section">啟動畫面</div>
          <div class="settings-section-body">
            <label class="settings-item settings-toggle"><input type="checkbox" id="settingPlayIntroEveryOpen" /></label>
            <label class="settings-item settings-toggle"><input type="checkbox" id="settingShowWarningOverlay" checked /></label>
          </div>
        </div>

        <div class="settings-section collapsed">
          <div class="settings-section-title" data-toggle="section">iframe 模式</div>
          <div class="settings-section-body">
            <textarea id="settingLinkAllowlist"></textarea>
            <input type="text" id="settingIframeHistoryUrl" value="https://github.com/copilot" />
          </div>
        </div>

        <div class="settings-section collapsed">
          <div class="settings-section-title" data-toggle="section">misc</div>
          <div class="settings-section-body">
            <select id="settingUiLanguage"><option value="zh-TW">繁體中文</option><option value="en">English</option></select>
            <input type="range" id="settingCaptureButtonWidth" min="2" max="100" value="42" />
            <span id="captureBtnWidthValue">42</span>
            <button id="openSdkLoginGuideBtn">open</button>
            <div id="settingsStatus"></div>
            <div id="sdkEndpointInfo"></div>
            <div id="promptStrategyBtns"><button class="strategy-btn" data-strategy="normal">normal</button></div>
            <div id="identityModuleChips"></div>
            <textarea id="identityEditor"></textarea>
            <button id="identitySaveBtn">save</button>
            <button id="identityResetBtn">reset</button>
            <div id="settingsIdentityContent"></div>
            <div id="sdkChat" class="hidden"></div>
            <div id="sdkMessages"></div>
            <div id="sdkInputContainer"><textarea id="sdkInput"></textarea></div>
            <div id="sdkInputResizer"></div>
            <button id="sdkSendBtn">send</button>
            <input type="checkbox" id="sdkIncludeMemory" checked />
            <input type="checkbox" id="sdkIncludeIdentity" checked />
            <input type="checkbox" id="sdkIncludeMemoryEntries" checked />
            <input type="checkbox" id="sdkIncludeRules" checked />
            <input type="checkbox" id="sdkIncludeSystemMsg" checked />
            <input type="checkbox" id="sdkStructuredOutput" checked />
            <input type="checkbox" id="sdkAssistantOnly" />
            <div id="sdkMemorySummary"></div>
            <select id="sdkModelSelect"><option value="">default</option></select>
            <div id="contextChildToggles"></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    window.__e2e = { openExternalLinkCalls: [] };
    window.addEventListener('error', (event) => {
      document.body.dataset.pageError = String(event?.error?.message || event?.message || 'error');
    });
    window.addEventListener('unhandledrejection', (event) => {
      document.body.dataset.pageError = String(event?.reason?.message || event?.reason || 'unhandledrejection');
    });
    const storage = {};
    const runtime = {
      id: 'e2e-mock-extension',
      getManifest: () => ({ version: '0.5.0', manifest_version: 3, permissions: [], version_name: '0.5.0+b80481db' }),
      onMessage: { addListener: () => {} },
      sendMessage: (message, callback) => {
        const withResult = (producer) => {
          const runner = async () => {
            try {
              return await producer();
            } catch (err) {
              return { success: false, error: String(err) };
            }
          };
          if (typeof callback === 'function') {
            runner().then((payload) => setTimeout(() => callback(payload), 0));
            return;
          }
          return runner();
        };

        if (!message || typeof message !== 'object') {
          return withResult(async () => ({ success: false, error: 'bad message' }));
        }
        if (message.action === 'startupGuardStatus') {
          return withResult(async () => ({ success: true, guard: { ready: true, locked: false, enabled: true, reasons: [] } }));
        }
        if (message.action === 'startupGuardRefresh') {
          return withResult(async () => ({ success: true, guard: { ready: true, locked: false, enabled: true, reasons: [] } }));
        }
        if (message.action === 'getMode') {
          return withResult(async () => ({ success: true, mode: 'iframe' }));
        }
        if (message.action === 'detectMode') {
          return withResult(async () => ({ success: true, mode: 'iframe' }));
        }
        if (message.action === 'setMode') {
          return withResult(async () => ({ success: true, mode: message.mode || 'iframe' }));
        }
        if (message.action === 'sdkConnect') {
          return withResult(async () => {
            const res = await fetch('/__bridgeHealth');
            const json = await res.json();
            return { success: !!json.success };
          });
        }
        if (message.action === 'sdkDisconnect') {
          return withResult(async () => ({ success: true }));
        }
        if (message.action === 'sdkMonitorStatus') {
          return withResult(async () => ({
            success: true,
            monitor: {
              startupGuard: { ready: true, locked: false, enabled: true, reasons: [] },
              chatState: 'standby',
              lastTool: '',
              lastError: '',
              resyncInFlight: false
            }
          }));
        }
        if (message.action === 'bridgeHealth') {
          return withResult(async () => {
            const res = await fetch('/__bridgeHealth');
            return res.json();
          });
        }
        if (message.action === 'bridgeStatusSnapshot') {
          return withResult(async () => {
            const res = await fetch('/__bridgeStatusSnapshot');
            return res.json();
          });
        }
        if (message.action === 'bridgeStatusAction') {
          return withResult(async () => {
            const res = await fetch('/__bridgeStatusAction', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(message || {})
            });
            return res.json();
          });
        }
        if (message.action === 'openExternalLink') {
          return withResult(async () => {
            window.__e2e.openExternalLinkCalls.push(message.url || '');
            const res = await fetch('/__openExternalLink', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: message.url || '' })
            });
            return res.json();
          });
        }
        if (message.action === 'getPageContent') {
          return withResult(async () => ({ success: false, error: 'mock' }));
        }
        if (message.action === 'sdkModels') {
          return withResult(async () => ({ success: true, models: ['gpt-5'] }));
        }
        if (message.action === 'rules.load') {
          return withResult(async () => ({ success: true, content: '', source: 'user' }));
        }
        if (message.action === 'rules.getTemplates') {
          return withResult(async () => ({ success: true, templates: [] }));
        }
        if (message.action === 'memory.list') {
          return withResult(async () => ({ success: true, entries: [] }));
        }
        return withResult(async () => ({ success: false, error: 'unsupported action: ' + message.action }));
      }
    };
    window.chrome = {
      runtime,
      tabs: { create: (_opts, cb) => cb && cb({}) },
      windows: { create: async () => ({}) },
      storage: {
        local: {
          get: (key, cb) => {
            if (typeof key === 'string') cb({ [key]: storage[key] });
            else cb({ ...storage });
          },
          set: (obj, cb) => { Object.assign(storage, obj || {}); cb && cb(); },
          remove: (key, cb) => { delete storage[key]; cb && cb(); }
        }
      }
    };
  </script>
  <script src="/sidepanel.js"></script>
  <script>
    (function setupAutorun() {
      const params = new URLSearchParams(window.location.search);
      const autorun = params.get('autorun');
      if (!autorun) return;
      const clickDelayMs = Number(params.get('delayMs') || '1500');

      async function waitForButton(id, timeoutMs = 12000) {
        const startedAt = Date.now();
        while (Date.now() - startedAt < timeoutMs) {
          const node = document.getElementById(id);
          if (node) {
            if (id !== 'bridgePrimaryBtn' || node.dataset.action) {
              return node;
            }
          }
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        throw new Error('button not ready: ' + id);
      }

      async function waitForApi(timeoutMs = 12000) {
        const startedAt = Date.now();
        while (Date.now() - startedAt < timeoutMs) {
          if (
            typeof window.checkBridgeHealth === 'function' &&
            typeof window.runBridgeAutoStartAttempt === 'function'
          ) {
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        throw new Error('bridge api not ready');
      }

      window.addEventListener('load', () => {
        (async () => {
          try {
            const buttonId = autorun === 'bridge-primary'
              ? 'bridgePrimaryBtn'
              : autorun === 'bridge-check'
                ? 'bridgeCheckBtn'
                : '';
            if (!buttonId) {
              document.body.dataset.autorunStatus = 'ignored';
              return;
            }

            const button = await waitForButton(buttonId);
            await waitForApi();
            await new Promise((resolve) => setTimeout(resolve, Math.max(0, clickDelayMs)));
            if (autorun === 'bridge-primary' && typeof window.runBridgeAutoStartAttempt === 'function') {
              await window.runBridgeAutoStartAttempt({
                force: true,
                bypassCooldown: true,
                showToast: false,
                source: 'e2e-harness'
              });
            } else if (autorun === 'bridge-check' && typeof window.checkBridgeHealth === 'function') {
              await window.checkBridgeHealth({ showToast: false });
            } else {
              button.click();
            }
            await new Promise((resolve) => setTimeout(resolve, 52000));
            document.body.dataset.autorunStatus = 'done';
            document.body.dataset.bridgeStatus = document.getElementById('bridgeInstallStatus')?.textContent || '';
            document.body.dataset.bridgeDetail = document.getElementById('bridgeInstallDetail')?.textContent || '';
            document.body.dataset.primaryLabel = document.getElementById('bridgePrimaryBtn')?.textContent || '';
          } catch (err) {
            document.body.dataset.autorunStatus = 'error';
            document.body.dataset.autorunError = String(err && err.message || err);
          }
        })();
      }, { once: true });
    })();
  </script>
</body>
</html>`;

function sendJson(res, code, obj) {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

function executeLauncher(protocolUrl) {
  return new Promise((resolve) => {
    const isWindowsPath = /^[A-Za-z]:\\/.test(launcherPs1);
    if (!launcherPs1 || (!isWindowsPath && !fs.existsSync(launcherPs1))) {
      resolve({ success: false, error: `launcher not found: ${launcherPs1}` });
      return;
    }

    const args = [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      launcherPs1,
      '-Uri',
      protocolUrl
    ];
    const child = spawn('powershell.exe', args, { windowsHide: true });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += String(d); });
    child.stderr.on('data', (d) => { stderr += String(d); });
    child.on('close', (exitCode) => {
      resolve({
        success: exitCode === 0,
        exitCode,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      });
    });
  });
}

function probeWindowsBridgeHealth() {
  return new Promise((resolve) => {
    const script = "$targets=@('localhost','127.0.0.1'); foreach ($host in $targets) { try { $res = Invoke-RestMethod -Uri ('http://' + $host + ':31031/health') -Method Get -TimeoutSec 2; [pscustomobject]@{ hostname = $host; data = $res } | ConvertTo-Json -Compress -Depth 6; exit 0 } catch {} }; exit 7";
    const child = spawn('powershell.exe', ['-NoProfile', '-Command', script], { windowsHide: true });
    let stdout = '';
    child.stdout.on('data', (chunk) => { stdout += String(chunk); });
    child.on('error', (err) => resolve({ success: false, isBridge: false, error: String(err), source: 'windows' }));
    child.on('close', (exitCode) => {
      if (exitCode !== 0) {
        resolve({ success: false, isBridge: false, error: `powershell exit ${exitCode}`, source: 'windows' });
        return;
      }
      try {
        const payload = JSON.parse(stdout || '{}');
        resolve({
          success: true,
          isBridge: payload?.data?.service === 'sidepilot-copilot-bridge',
          data: payload?.data || null,
          hostname: payload?.hostname || 'localhost',
          source: 'windows',
        });
      } catch (err) {
        resolve({ success: false, isBridge: false, error: String(err), source: 'windows' });
      }
    });
  });
}

function checkBridgeHealth() {
  const probeHost = (hostname) => new Promise((resolve) => {
    const req = http.request(
      { hostname, port: 31031, path: '/health', method: 'GET', timeout: 2500 },
      (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          if (res.statusCode !== 200) {
            resolve({ success: false, status: res.statusCode, isBridge: false, error: `HTTP ${res.statusCode}`, hostname });
            return;
          }
          try {
            const data = JSON.parse(body || '{}');
            resolve({
              success: true,
              isBridge: data?.service === 'sidepilot-copilot-bridge',
              data,
              hostname
            });
          } catch (err) {
            resolve({ success: false, isBridge: false, error: String(err), hostname });
          }
        });
      }
    );
    req.on('error', (err) => resolve({ success: false, isBridge: false, error: String(err), hostname }));
    req.on('timeout', () => {
      req.destroy(new Error('timeout'));
    });
    req.end();
  });

  return (async () => {
    let lastFailure = { success: false, isBridge: false, error: 'no probe executed' };
    const windowsResult = await probeWindowsBridgeHealth();
    if (windowsResult.success) {
      return windowsResult;
    }
    lastFailure = windowsResult;
    for (const hostname of ['localhost', '127.0.0.1']) {
      const result = await probeHost(hostname);
      if (result.success) {
        return result;
      }
      lastFailure = result;
    }
    return lastFailure;
  })();
}

function hasLauncherConfigured() {
  const isWindowsPath = /^[A-Za-z]:\\/.test(launcherPs1);
  return !!launcherPs1 && (isWindowsPath || fs.existsSync(launcherPs1));
}

function buildHarnessSnapshot(health, lastError = null, actionState = 'idle') {
  const bridgeReady = !!health?.success && !!health?.isBridge;
  const unsupported = !!health?.success && !health?.isBridge;
  const availability = bridgeReady ? 'ready' : unsupported ? 'unsupported' : 'offline';
  const launcherConfigured = hasLauncherConfigured();
  const authConfigured = Boolean(health?.data?.auth?.extensionBindingConfigured);
  const effectiveError =
    lastError ||
    (bridgeReady
      ? null
      : {
          code: unsupported ? 'BRG-COMPAT-001' : 'BRG-PROBE-001',
          message:
            health?.error ||
            (unsupported
              ? 'Non-SidePilot service is responding on port 31031'
              : 'Bridge offline'),
          at: new Date().toISOString(),
        });

  const primaryAction = bridgeReady
    ? authConfigured
      ? { action: 'check', label: 'Bridge 已就緒', disabled: false }
      : { action: 'open_login', label: '開啟 GitHub 登入頁', disabled: false }
    : launcherConfigured
      ? { action: 'start', label: '啟動 Bridge', disabled: false }
      : { action: 'copy_manual_command', label: '複製 Quick Setup', disabled: false };

  return {
    bridge: {
      service: health?.data?.service || 'sidepilot-copilot-bridge',
      version: health?.data?.version || null,
      port: 31031,
      availability,
      authConfigured,
      launcherConfigured,
      backend: health?.data?.backend || null,
    },
    cli: {
      sdkState: bridgeReady ? (health?.data?.sdk || 'ready') : 'offline',
      sessionCount: bridgeReady ? 1 : 0,
      pendingPermissionCount: 0,
      prompt: {
        state: bridgeReady ? 'idle' : 'offline',
        lastToolName: '',
      },
    },
    compatibility: {
      apiVersion: '2026-03-bridge-status-v1',
      supported: !unsupported,
      missingCapabilities: unsupported ? ['/api/status'] : [],
    },
    runtime: {
      selected: 'auto',
      resolved: 'windows',
      repoRoot,
      wslDistro: null,
    },
    auth: health?.data?.auth || {
      required: true,
      bootstrapPath: '/api/auth/bootstrap',
      extensionBindingConfigured: false,
    },
    action: {
      state: actionState,
      detail: bridgeReady ? '待命' : '等待啟動',
    },
    lastError: effectiveError,
    primaryAction,
    summary: bridgeReady
      ? {
          headline: 'Bridge 已就緒',
          detail: authConfigured
            ? 'Quick Start 與 Connection Details 都已同步'
            : 'Bridge 已啟動，下一步請完成 GitHub 登入',
        }
      : unsupported
        ? {
            headline: 'Bridge 版本不相容',
            detail: '請啟動支援 /api/status 的新版 Bridge',
          }
        : {
            headline: launcherConfigured ? 'Bridge 尚未啟動' : '尚未安裝 Launcher',
            detail: launcherConfigured
              ? '可直接使用 Quick Start 啟動 Bridge'
              : '請先透過 Quick Setup 安裝 launcher',
          },
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://127.0.0.1:${port}`);

  if (url.pathname === '/' || url.pathname === '/harness') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(harnessHtml);
    return;
  }

  if (url.pathname === '/sidepanel.js') {
    res.writeHead(200, { 'content-type': 'application/javascript; charset=utf-8' });
    res.end(fs.readFileSync(sidepanelJsPath, 'utf8'));
    return;
  }

  if (url.pathname === '/styles.css') {
    res.writeHead(200, { 'content-type': 'text/css; charset=utf-8' });
    res.end(fs.readFileSync(sidepanelCssPath, 'utf8'));
    return;
  }

  if (url.pathname === '/__bridgeHealth') {
    const health = await checkBridgeHealth();
    sendJson(res, 200, health);
    return;
  }

  if (url.pathname === '/__bridgeStatusSnapshot') {
    const health = await checkBridgeHealth();
    sendJson(res, 200, { success: true, snapshot: buildHarnessSnapshot(health) });
    return;
  }

  if (url.pathname === '/__bridgeStatusAction' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += String(chunk); });
    req.on('end', async () => {
      let action = 'check';
      try {
        action = JSON.parse(body || '{}')?.bridgeAction || 'check';
      } catch {
        // ignore parse failure
      }

      let lastError = null;
      if (action === 'start') {
        const launchResult = await executeLauncher('sidepilot://bridge?action=start&source=e2e-harness');
        if (!launchResult.success) {
          lastError = {
            code: 'BRG-LAUNCHER-001',
            message: launchResult.error || 'launcher blocked',
            at: new Date().toISOString(),
          };
        } else {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }

      const health = await checkBridgeHealth();
      sendJson(res, 200, {
        success: !lastError,
        error: lastError?.message || '',
        snapshot: buildHarnessSnapshot(
          health,
          lastError,
          action === 'start' ? (lastError ? 'failed' : 'starting') : 'idle',
        ),
      });
    });
    return;
  }

  if (url.pathname === '/__openExternalLink' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += String(chunk); });
    req.on('end', async () => {
      let protocolUrl = '';
      try {
        protocolUrl = JSON.parse(body || '{}')?.url || '';
      } catch {
        // ignore parse failure
      }
      const result = await executeLauncher(protocolUrl);
      sendJson(res, 200, result);
    });
    return;
  }

  sendJson(res, 404, { success: false, error: 'not found' });
});

server.listen(port, '127.0.0.1', () => {
  // eslint-disable-next-line no-console
  console.log(`[bridge-e2e] harness server running at http://127.0.0.1:${port}/harness`);
  // eslint-disable-next-line no-console
  console.log(`[bridge-e2e] launcher path: ${launcherPs1}`);
});
