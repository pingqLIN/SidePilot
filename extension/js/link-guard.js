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

let allowPatterns = buildRegexPatterns(DEFAULT_ALLOWLIST);

function isSidePilotIframeContext() {
  if (window.top === window.self) {
    return false;
  }

  const ref = document.referrer || '';
  return ref.startsWith(`chrome-extension://${chrome.runtime.id}/`);
}

function normalizeAllowlist(raw) {
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

  return clean.length > 0 ? clean : [...DEFAULT_ALLOWLIST];
}

function escapeRegex(value) {
  return value.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
}

function wildcardToRegex(pattern) {
  const escaped = escapeRegex(pattern).replace(/\\\*/g, '.*');
  return new RegExp(`^${escaped}$`, 'i');
}

function buildRegexPatterns(list) {
  return normalizeAllowlist(list).map(wildcardToRegex);
}

async function refreshAllowPatternsFromStorage() {
  try {
    const result = await chrome.storage.local.get(SETTINGS_STORAGE_KEY);
    const allowlist = result?.[SETTINGS_STORAGE_KEY]?.linkAllowlist;
    allowPatterns = buildRegexPatterns(allowlist);
  } catch {
    allowPatterns = buildRegexPatterns(DEFAULT_ALLOWLIST);
  }
}

function shouldKeepInIframe(urlString) {
  return allowPatterns.some((pattern) => pattern.test(urlString));
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
  allowPatterns = buildRegexPatterns(nextSettings.linkAllowlist);
}

if (isSidePilotIframeContext()) {
  refreshAllowPatternsFromStorage();
  chrome.storage.onChanged.addListener(onStorageChanged);
  document.addEventListener('click', onAnchorClick, true);
}
