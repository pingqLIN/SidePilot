#!/usr/bin/env node
/**
 * verify-control-plane.mjs
 *
 * 外部控制面健康檢測器（不依賴 extension 內部邏輯）：
 * - 檢查 Bridge 是否可用
 * - 檢查關鍵控制 API 是否維持不變量
 * - 檢查 /api/integrity/verify 外部完整性驗證入口
 * - 作為「開發過程中的異常偵測」補強，與 integrity seal 互補
 *
 * 用法：
 *   node scripts/verify-control-plane.mjs
 *   node scripts/verify-control-plane.mjs --base-url http://localhost:31031
 *   node scripts/verify-control-plane.mjs --timeout 5000
 *
 * Exit code:
 *   0 = PASS（控制面檢測通過）
 *   1 = FAIL（控制面不變量違反）
 *   2 = UNAVAILABLE（Bridge 不可達）
 */

const args = process.argv.slice(2);

function readArg(name, fallback) {
  const idx = args.indexOf(name);
  if (idx === -1 || idx === args.length - 1) return fallback;
  return args[idx + 1];
}

const BASE_URL = readArg('--base-url', 'http://localhost:31031').replace(/\/+$/, '');
const TIMEOUT_MS = Number.parseInt(readArg('--timeout', '3500'), 10);
const EXTENSION_ID = readArg('--extension-id', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa').trim().toLowerCase();
const EXTENSION_ORIGIN = `chrome-extension://${EXTENSION_ID}`;

if (!Number.isFinite(TIMEOUT_MS) || TIMEOUT_MS <= 0) {
  console.error('❌ Invalid --timeout value');
  process.exit(1);
}

const expectedPermissionWhitelist = ['readTextFile', 'listDirectory'];
const validSdkStates = new Set(['idle', 'ready', 'connected']);
const validPromptStrategies = new Set(['normal', 'concise', 'one-sentence']);

const failures = [];
const notes = [];

function fail(message) {
  failures.push(message);
}

function note(message) {
  notes.push(message);
}

async function fetchJson(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const method = options.method || 'GET';
  const headers = {
    Accept: 'application/json',
    ...(options.headers || {})
  };
  const body = options.body !== undefined
    ? JSON.stringify(options.body)
    : undefined;

  try {
    const resp = await fetch(url, {
      method,
      headers,
      body,
      signal: controller.signal,
    });
    const payload = await resp.json().catch(() => null);
    return { ok: resp.ok, status: resp.status, body: payload, url };
  } finally {
    clearTimeout(timer);
  }
}

function buildAuthHeaders({ includeExtensionOrigin = false, includeJson = false } = {}) {
  const headers = {
    Accept: 'application/json',
  };

  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }

  if (includeExtensionOrigin) {
    headers.Origin = EXTENSION_ORIGIN;
    headers['X-SidePilot-Extension-Id'] = EXTENSION_ID;
  }

  return headers;
}

function buildProtectedHeaders(token, { includeJson = false } = {}) {
  return {
    ...buildAuthHeaders({
      includeExtensionOrigin: true,
      includeJson,
    }),
    'X-SidePilot-Token': token,
  };
}

async function bootstrapBridgeAuth() {
  const response = await fetchJson('/api/auth/bootstrap', {
    method: 'POST',
    headers: buildAuthHeaders({
      includeExtensionOrigin: true,
      includeJson: true,
    }),
    body: {}
  }).catch(() => null);

  if (!response || !response.ok || !response.body?.success || typeof response.body?.token !== 'string') {
    return null;
  }

  return response.body.token;
}

async function main() {
  console.log('🩺 SidePilot Control Plane Verification');
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Timeout:  ${TIMEOUT_MS}ms`);

  // 1) Health
  let health;
  try {
    health = await fetchJson('/health');
  } catch (err) {
    console.error('\n⚠️  UNAVAILABLE — cannot reach bridge /health');
    console.error(`   Reason: ${err.message}`);
    return 2;
  }

  if (!health.ok || !health.body) {
    console.error('\n⚠️  UNAVAILABLE — invalid /health response');
    console.error(`   HTTP: ${health.status}`);
    return 2;
  }

  const healthBody = health.body;
  if (healthBody.status !== 'ok') {
    fail(`health.status should be "ok", got "${healthBody.status}"`);
  }
  if (healthBody.service !== 'sidepilot-copilot-bridge') {
    fail(`health.service should be "sidepilot-copilot-bridge", got "${healthBody.service}"`);
  }
  if (healthBody.auth?.required !== true) {
    fail('health.auth.required should be true');
  }
  if (healthBody.auth?.extensionBindingConfigured !== true) {
    fail('health.auth.extensionBindingConfigured should be true');
  }
  if (!validSdkStates.has(String(healthBody.sdk))) {
    fail(`health.sdk must be one of ${Array.from(validSdkStates).join(', ')}, got "${healthBody.sdk}"`);
  }
  if (!healthBody.backend || typeof healthBody.backend.command !== 'string') {
    fail('health.backend.command missing');
  } else if (!healthBody.backend.command.includes('copilot')) {
    note(`health.backend.command does not contain "copilot": ${healthBody.backend.command}`);
  }

  const bridgeToken = await bootstrapBridgeAuth();
  if (!bridgeToken) {
    fail('/api/auth/bootstrap unavailable or malformed');
  }

  const protectedHeaders = bridgeToken
    ? buildProtectedHeaders(bridgeToken)
    : {};

  // 2) Config
  const configResp = await fetchJson('/api/config', {
    headers: protectedHeaders
  }).catch(() => null);
  if (!configResp || !configResp.ok || !configResp.body?.success) {
    fail('/api/config unavailable or malformed');
  } else {
    const cfg = configResp.body.config || {};
    if (typeof cfg.cliPath !== 'string' || cfg.cliPath.trim() === '') {
      fail('config.cliPath must be a non-empty string');
    }
    if (!Number.isFinite(cfg.timeoutMs)) {
      fail('config.timeoutMs must be a number');
    } else {
      if (cfg.timeoutMs < 1000) fail(`config.timeoutMs too low: ${cfg.timeoutMs}`);
      if (cfg.timeoutMs > 600000) fail(`config.timeoutMs too high: ${cfg.timeoutMs}`);
    }
  }

  // 3) Permission queue + whitelist
  const pendingResp = await fetchJson('/api/permissions', {
    headers: protectedHeaders
  }).catch(() => null);
  if (!pendingResp || !pendingResp.ok || !pendingResp.body?.success) {
    fail('/api/permissions unavailable or malformed');
  } else if (!Array.isArray(pendingResp.body.permissions)) {
    fail('/api/permissions.permissions must be an array');
  }

  const whitelistResp = await fetchJson('/api/permissions/whitelist', {
    headers: protectedHeaders
  }).catch(() => null);
  if (!whitelistResp || !whitelistResp.ok || !whitelistResp.body?.success) {
    fail('/api/permissions/whitelist unavailable or malformed');
  } else {
    const wl = whitelistResp.body.whitelist;
    if (!Array.isArray(wl)) {
      fail('/api/permissions/whitelist.whitelist must be an array');
    } else {
      for (const required of expectedPermissionWhitelist) {
        if (!wl.includes(required)) {
          note(`permission whitelist missing recommended low-risk entry: ${required}`);
        }
      }
    }
  }

  // 4) Prompt strategy guard surface
  const strategyResp = await fetchJson('/api/prompt/strategy', {
    headers: protectedHeaders
  }).catch(() => null);
  if (!strategyResp || !strategyResp.ok || !strategyResp.body?.success) {
    fail('/api/prompt/strategy unavailable or malformed');
  } else {
    const strategy = strategyResp.body.strategy;
    const turns = strategyResp.body.maxHistoryTurns;
    if (!validPromptStrategies.has(String(strategy))) {
      fail(`prompt.strategy invalid: ${strategy}`);
    }
    if (!Number.isFinite(turns) || turns < 1 || turns > 1000) {
      fail(`prompt.maxHistoryTurns invalid: ${turns}`);
    }
  }

  // 5) External integrity verify endpoint
  const integrityResp = await fetchJson('/api/integrity/verify', {
    method: 'POST',
    headers: {
      ...protectedHeaders,
      ...buildAuthHeaders({
        includeExtensionOrigin: true,
        includeJson: true,
      })
    },
    body: { timeoutMs: 5000 }
  }).catch(() => null);
  const integrityReachable =
    !!integrityResp &&
    (integrityResp.status === 200 || integrityResp.status === 409) &&
    typeof integrityResp.body?.success === 'boolean';
  if (!integrityReachable) {
    fail('/api/integrity/verify unavailable or failed');
  } else if (integrityResp.body.success !== true) {
    note(`/api/integrity/verify reported current worktree as unsealed (${integrityResp.body.error || 'verification failed'})`);
  }

  // Final
  console.log('\nChecks:');
  console.log(`  - Health endpoint          : ${failures.some(f => f.includes('health')) ? 'FAIL' : 'PASS'}`);
  console.log(`  - Auth bootstrap          : ${failures.some(f => f.includes('/api/auth/bootstrap')) ? 'FAIL' : 'PASS'}`);
  console.log(`  - Config endpoint          : ${failures.some(f => f.includes('/api/config') || f.includes('config.')) ? 'FAIL' : 'PASS'}`);
  console.log(`  - Permission control plane : ${failures.some(f => f.includes('/api/permissions') || f.includes('whitelist')) ? 'FAIL' : 'PASS'}`);
  console.log(`  - Prompt strategy surface  : ${failures.some(f => f.includes('/api/prompt/strategy') || f.includes('prompt.')) ? 'FAIL' : 'PASS'}`);
  console.log(`  - Integrity verify endpoint: ${failures.some(f => f.includes('/api/integrity/verify')) ? 'FAIL' : 'PASS'}`);

  if (notes.length > 0) {
    console.log('\nNotes:');
    for (const n of notes) {
      console.log(`  - ${n}`);
    }
  }

  if (failures.length > 0) {
    console.log('\n❌ FAIL — control plane invariant check failed');
    for (const f of failures) {
      console.log(`  - ${f}`);
    }
    return 1;
  }

  console.log('\n✅ PASS — control plane is in expected safe shape');
  return 0;
}

main().catch((err) => {
  console.error('\n❌ FAIL — unexpected verifier error');
  console.error(`   ${err?.message || String(err)}`);
  return 1;
}).then((code) => {
  process.exitCode = Number.isInteger(code) ? code : 1;
});
