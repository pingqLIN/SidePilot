'use strict';

// ============================================
// Mode Manager Module
// Detects and manages SDK vs iframe mode
// ============================================

const STORAGE_KEYS = {
  ACTIVE_MODE: 'sidepilot.mode.active',
  LAST_CHECK: 'sidepilot.mode.lastCheck'
};

// Copilot Bridge server health endpoint (scripts/copilot-bridge)
const SDK_HEALTH_URL = 'http://localhost:3000/health';
const DETECTION_TIMEOUT_MS = 5000;

// ============================================
// Module State
// ============================================

let initialized = false;
let currentMode = null;
const listeners = new Set();

// ============================================
// Private Functions
// ============================================

/**
 * Load mode from storage
 * @returns {Promise<{mode: string|null, lastCheck: number|null}>}
 */
async function loadFromStorage() {
  try {
    const result = await chrome.storage.local.get([
      STORAGE_KEYS.ACTIVE_MODE,
      STORAGE_KEYS.LAST_CHECK
    ]);
    return {
      mode: result[STORAGE_KEYS.ACTIVE_MODE] || null,
      lastCheck: result[STORAGE_KEYS.LAST_CHECK] || null
    };
  } catch (err) {
    console.error('[ModeManager] Failed to load from storage:', err);
    return { mode: null, lastCheck: null };
  }
}

/**
 * Save mode to storage
 * @param {string} mode - 'sdk' or 'iframe'
 * @returns {Promise<void>}
 */
async function saveToStorage(mode) {
  try {
    await chrome.storage.local.set({
      [STORAGE_KEYS.ACTIVE_MODE]: mode,
      [STORAGE_KEYS.LAST_CHECK]: Date.now()
    });
  } catch (err) {
    console.error('[ModeManager] Failed to save to storage:', err);
  }
}

/**
 * Notify all listeners of mode change
 * @param {string} newMode - The new mode value
 */
function notifyListeners(newMode) {
  listeners.forEach(callback => {
    try {
      callback(newMode);
    } catch (err) {
      console.error('[ModeManager] Listener callback error:', err);
    }
  });
}

// ============================================
// Exported Functions
// ============================================

/**
 * Initialize the mode manager module.
 * Loads persisted mode from storage and runs detection.
 * @returns {Promise<void>}
 */
async function init() {
  if (initialized) {
    return;
  }

  try {
    // Load persisted mode first
    const stored = await loadFromStorage();
    if (stored.mode) {
      currentMode = stored.mode;
    }

    // Run fresh detection
    const detectedMode = await detectMode();
    
    // Update if different from stored
    if (detectedMode !== currentMode) {
      const oldMode = currentMode;
      currentMode = detectedMode;
      await saveToStorage(currentMode);
      if (oldMode !== null) {
        notifyListeners(currentMode);
      }
    }

    initialized = true;
  } catch (err) {
    console.error('[ModeManager] Init failed:', err);
    // Default to iframe mode on failure
    currentMode = 'iframe';
    initialized = true;
  }
}

/**
 * Cleanup module resources.
 * Clears all listeners and resets state.
 * @returns {void}
 */
function cleanup() {
  listeners.clear();
  initialized = false;
  currentMode = null;
}

/**
 * Get the current status of the mode manager.
 * @returns {{initialized: boolean, mode: string|null}}
 */
function getStatus() {
  return {
    initialized,
    mode: currentMode
  };
}

/**
 * Detect whether SDK mode is available.
 * Checks localhost:3000/health endpoint with 5s timeout.
 * @returns {Promise<'sdk'|'iframe'>}
 */
async function detectMode() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DETECTION_TIMEOUT_MS);

    const response = await fetch(SDK_HEALTH_URL, {
      method: 'GET',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return 'sdk';
    }
    return 'iframe';
  } catch (err) {
    // Network error, timeout, or abort - fall back to iframe
    return 'iframe';
  }
}

/**
 * Get the currently active mode synchronously.
 * Returns null if not yet initialized.
 * @returns {string|null} - 'sdk', 'iframe', or null
 */
function getActiveMode() {
  return currentMode;
}

/**
 * Manually set the active mode.
 * Persists to storage and notifies listeners.
 * @param {'sdk'|'iframe'} mode - The mode to set
 * @returns {Promise<void>}
 */
async function setMode(mode) {
  if (mode !== 'sdk' && mode !== 'iframe') {
    console.error('[ModeManager] Invalid mode:', mode);
    return;
  }

  if (mode === currentMode) {
    return;
  }

  currentMode = mode;
  await saveToStorage(mode);
  notifyListeners(mode);
}

/**
 * Subscribe to mode change events.
 * @param {function(string): void} callback - Called with new mode value
 * @returns {function(): void} - Unsubscribe function
 */
function onModeChange(callback) {
  if (typeof callback !== 'function') {
    console.error('[ModeManager] onModeChange requires a function callback');
    return () => {};
  }

  listeners.add(callback);

  // Return unsubscribe function
  return () => {
    listeners.delete(callback);
  };
}

// ============================================
// Module Export
// ============================================

export {
  init,
  cleanup,
  getStatus,
  detectMode,
  getActiveMode,
  setMode,
  onModeChange
};
