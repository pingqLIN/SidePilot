import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const port = Number(process.env.BRIDGE_E2E_PORT || 43123);

const launcherPs1 = path.join(
  process.env.LOCALAPPDATA || '',
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
    <div class="note">E2E harness: click "0. 啟動 Bridge" and verify launcher + health.</div>

    <iframe id="copilotFrame" src="about:blank"></iframe>
    <div id="loadingOverlay"></div>
    <div id="errorOverlay" class="hidden"></div>
    <div id="capturePanel"></div>
    <div id="toast"></div>

    <div class="tab-content active" id="settings-tab">
      <div class="settings-container">
        <div class="settings-section" id="settingsSectionInstall">
          <div class="settings-section-title" data-toggle="section">安裝助手</div>
          <div class="settings-section-body">
            <div class="settings-item settings-install-card">
              <div class="settings-item-text">
                <div class="settings-item-title">
                  <span>Bridge 狀態</span>
                  <span class="status-dot" id="bridgeStatusDot"></span>
                </div>
                <div class="settings-item-desc" id="bridgeInstallStatus">尚未檢查</div>
                <div class="settings-item-sub" id="bridgeInstallDetail">-</div>
              </div>
              <label class="settings-item settings-toggle">
                <div class="settings-item-text">
                  <div class="settings-item-title">自動啟動 Bridge（MVP）</div>
                  <div class="settings-item-desc">進入 SDK 模式時，若偵測不到 Bridge，會嘗試喚起 sidepilot:// 啟動器</div>
                </div>
                <input type="checkbox" id="settingAutoStartBridge" checked />
              </label>
              <div class="settings-install-steps">
                <button class="btn btn-secondary btn-sm" id="bridgeLaunchBtn">0. 啟動 Bridge</button>
                <span class="step-arrow">→</span>
                <button class="btn btn-secondary btn-sm" id="bridgeCheckBtn">1. 檢查狀態</button>
                <span class="step-arrow">→</span>
                <button class="btn btn-secondary btn-sm" id="bridgeCopyCmdBtn">2. 複製啟動指令</button>
                <span class="step-arrow">→</span>
                <button class="btn btn-secondary btn-sm" id="bridgeCopyCheckBtn">3. 驗證連線</button>
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
            <button id="testSdkBridgeBtn">test</button>
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
        if (message.action === 'bridgeHealth') {
          return withResult(async () => {
            const res = await fetch('/__bridgeHealth');
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
</body>
</html>`;

function sendJson(res, code, obj) {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

function executeLauncher(protocolUrl) {
  return new Promise((resolve) => {
    if (!launcherPs1 || !fs.existsSync(launcherPs1)) {
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

function checkBridgeHealth() {
  return new Promise((resolve) => {
    const req = http.request(
      { hostname: '127.0.0.1', port: 31031, path: '/health', method: 'GET', timeout: 2500 },
      (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          if (res.statusCode !== 200) {
            resolve({ success: false, status: res.statusCode, isBridge: false, error: `HTTP ${res.statusCode}` });
            return;
          }
          try {
            const data = JSON.parse(body || '{}');
            resolve({
              success: true,
              isBridge: data?.service === 'sidepilot-copilot-bridge',
              data
            });
          } catch (err) {
            resolve({ success: false, isBridge: false, error: String(err) });
          }
        });
      }
    );
    req.on('error', (err) => resolve({ success: false, isBridge: false, error: String(err) }));
    req.on('timeout', () => {
      req.destroy(new Error('timeout'));
    });
    req.end();
  });
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
