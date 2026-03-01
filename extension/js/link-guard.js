'use strict';

// ============================================
// Link Guard (Virtual Layer)
// Intercepts out-of-bound links in SidePilot iframe
// and opens them in a normal browser tab instead
// ============================================

const SETTINGS_STORAGE_KEY = 'sidepilot.settings.v1';
const DEFAULT_ALLOWLIST = [
  'https://github.com/copilot/*',
  'https://github.com/settings/copilot*',
  'https://github.com/features/copilot*'
];

let allowPatterns = buildRegexPatterns(DEFAULT_ALLOWLIST, 'allow');
let guardMode = 'allow';

function isSidePilotIframeContext() {
  if (window.top === window.self) {
    return false;
  }

  const ref = document.referrer || '';
  return ref.startsWith(`chrome-extension://${chrome.runtime.id}/`);
}

function normalizeAllowlist(raw, mode = 'allow') {
  const source = Array.isArray(raw) ? raw : [];
  const clean = [];
  const seen = new Set();

  for (const item of source) {
    const value = String(item || '').trim();
    if (!value) continue;
    if (!/^https?:\/\//i.test(value)) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    clean.push(value);
  }

  if (clean.length > 0) return clean;
  return mode === 'deny' ? [] : [...DEFAULT_ALLOWLIST];
}

function escapeRegex(value) {
  return value.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
}

function wildcardToRegex(pattern) {
  const escaped = escapeRegex(pattern).replace(/\\\*/g, '.*');
  return new RegExp(`^${escaped}$`, 'i');
}

function buildRegexPatterns(list, mode) {
  return normalizeAllowlist(list, mode).map(wildcardToRegex);
}

async function refreshAllowPatternsFromStorage() {
  try {
    const result = await chrome.storage.local.get(SETTINGS_STORAGE_KEY);
    const settings = result?.[SETTINGS_STORAGE_KEY] || {};
    guardMode = settings?.linkGuardMode === 'deny' ? 'deny' : 'allow';
    const allowlist = settings?.linkAllowlist;
    allowPatterns = buildRegexPatterns(allowlist, guardMode);
  } catch {
    allowPatterns = buildRegexPatterns(DEFAULT_ALLOWLIST, 'allow');
    guardMode = 'allow';
  }
}

function shouldKeepInIframe(urlString) {
  const matches = allowPatterns.some((pattern) => pattern.test(urlString));
  if (guardMode === 'deny') {
    return !matches;
  }
  return matches;
}

function onAnchorClick(event) {
  const anchor = event.target?.closest?.('a[href]');
  if (!anchor) return;

  const href = anchor.getAttribute('href');
  if (!href || href.startsWith('#')) return;

  let url;
  try {
    url = new URL(anchor.href, window.location.href);
  } catch {
    return;
  }

  if (!/^https?:$/i.test(url.protocol)) {
    return;
  }

  if (shouldKeepInIframe(url.toString())) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  chrome.runtime.sendMessage({
    action: 'openExternalLink',
    url: url.toString()
  });
}

function onStorageChanged(changes, areaName) {
  if (areaName !== 'local') return;
  if (!changes?.[SETTINGS_STORAGE_KEY]) return;
  const nextSettings = changes[SETTINGS_STORAGE_KEY].newValue || {};
  guardMode = nextSettings.linkGuardMode === 'deny' ? 'deny' : 'allow';
  allowPatterns = buildRegexPatterns(nextSettings.linkAllowlist, guardMode);
}

if (isSidePilotIframeContext()) {
  refreshAllowPatternsFromStorage();
  chrome.storage.onChanged.addListener(onStorageChanged);
  document.addEventListener('click', onAnchorClick, true);
}
