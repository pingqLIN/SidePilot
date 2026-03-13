import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const harnessScriptPath = path.join(repoRoot, 'scripts', 'e2e', 'bridge-launch-button-harness-server.mjs');
const HARNESS_PORT = Number(process.env.BRIDGE_E2E_PORT || 43123);
const HARNESS_URL = `http://127.0.0.1:${HARNESS_PORT}/harness?autorun=bridge-primary`;
const CHROME_BIN = process.env.CHROME_BIN || 'google-chrome';
const VIRTUAL_TIME_BUDGET_MS = Number(process.env.BRIDGE_E2E_VTIME_MS || 65000);

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve(body));
    });
    req.on('error', reject);
  });
}

async function waitForHarness(url, timeoutMs = 20000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      await fetchText(url);
      return;
    } catch {
      await wait(250);
    }
  }
  throw new Error(`Harness did not become ready within ${timeoutMs}ms`);
}

function extractAttribute(html, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = html.match(new RegExp(`${escaped}="([^"]*)"`, 'i'));
  return match ? match[1] : '';
}

async function main() {
  const harness = spawn(
    process.execPath,
    [harnessScriptPath],
    {
      cwd: repoRoot,
      env: {
        ...process.env,
        BRIDGE_E2E_PORT: String(HARNESS_PORT),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  let harnessStdout = '';
  let harnessStderr = '';
  harness.stdout.on('data', (chunk) => { harnessStdout += String(chunk); });
  harness.stderr.on('data', (chunk) => { harnessStderr += String(chunk); });

  try {
    await waitForHarness(`http://127.0.0.1:${HARNESS_PORT}/harness`);

    const html = await new Promise((resolve, reject) => {
      const chrome = spawn(
        CHROME_BIN,
        [
          '--headless=new',
          '--no-sandbox',
          '--disable-gpu',
          `--virtual-time-budget=${VIRTUAL_TIME_BUDGET_MS}`,
          '--dump-dom',
          HARNESS_URL,
        ],
        {
          cwd: process.cwd(),
          env: process.env,
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      );

      let stdout = '';
      let stderr = '';
      chrome.stdout.on('data', (chunk) => { stdout += String(chunk); });
      chrome.stderr.on('data', (chunk) => { stderr += String(chunk); });
      chrome.on('error', reject);
      chrome.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Chrome failed (code=${code})\n${stderr}`));
          return;
        }
        resolve(stdout);
      });
    });

    const autorunStatus = extractAttribute(html, 'data-autorun-status');
    const bridgeStatus = extractAttribute(html, 'data-bridge-status');
    const primaryLabel = extractAttribute(html, 'data-primary-label');

    console.log(`[bridge-ui-e2e] autorunStatus=${autorunStatus}`);
    console.log(`[bridge-ui-e2e] bridgeStatus=${bridgeStatus}`);
    console.log(`[bridge-ui-e2e] primaryLabel=${primaryLabel}`);

    if (autorunStatus !== 'done') {
      throw new Error(`Unexpected autorun status: ${autorunStatus || '(empty)'}`);
    }
    if (!bridgeStatus.includes('Bridge')) {
      throw new Error(`Bridge status did not indicate success: ${bridgeStatus || '(empty)'}`);
    }
  } finally {
    harness.kill('SIGTERM');
    await wait(300);
    if (!harness.killed) {
      harness.kill('SIGKILL');
    }
  }

  if (harnessStdout.trim()) {
    console.log('[bridge-ui-e2e] harness stdout');
    console.log(harnessStdout.trim());
  }
  if (harnessStderr.trim()) {
    console.error('[bridge-ui-e2e] harness stderr');
    console.error(harnessStderr.trim());
  }
}

main().catch((err) => {
  console.error(`[bridge-ui-e2e] FAIL: ${err?.message || err}`);
  process.exit(1);
});
