'use strict';

// ============================================
// Storage Manager Module
// Wrapper for chrome.storage.local with namespace
// ============================================

const NAMESPACE_PREFIX = 'sidepilot.';

// ============================================
// Module State
// ============================================

let initialized = false;
const changeListeners = new Set();

// ============================================
// Private Functions
// ============================================

/**
 * Add namespace prefix to key
 * @param {string} key - Original key
 * @returns {string} - Namespaced key
 */
function namespaceKey(key) {
  if (key.startsWith(NAMESPACE_PREFIX)) {
    return key;
  }
  return NAMESPACE_PREFIX + key;
}

/**
 * Remove namespace prefix from key
 * @param {string} key - Namespaced key
 * @returns {string} - Original key
 */
function stripNamespace(key) {
  if (key.startsWith(NAMESPACE_PREFIX)) {
    return key.slice(NAMESPACE_PREFIX.length);
  }
  return key;
}

/**
 * Handle storage change events
 * @param {Object} changes - Changed items
 * @param {string} areaName - Storage area name
 */
function handleStorageChange(changes, areaName) {
  if (areaName !== 'local') {
    return;
  }

  // Filter to only sidepilot.* changes
  const relevantChanges = {};
  for (const [key, change] of Object.entries(changes)) {
    if (key.startsWith(NAMESPACE_PREFIX)) {
      relevantChanges[stripNamespace(key)] = {
        oldValue: change.oldValue,
        newValue: change.newValue
      };
    }
  }

  if (Object.keys(relevantChanges).length === 0) {
    return;
  }

  // Notify listeners
  changeListeners.forEach(callback => {
    try {
      callback(relevantChanges);
    } catch (err) {
      console.error('[StorageManager] Listener callback error:', err);
    }
  });
}

// ============================================
// Exported Functions
// ============================================

/**
 * Initialize the storage manager module.
 * Sets up storage change listener.
 * @returns {Promise<void>}
 */
async function init() {
  if (initialized) {
    return;
  }

  try {
    chrome.storage.onChanged.addListener(handleStorageChange);
    initialized = true;
  } catch (err) {
    console.error('[StorageManager] Init failed:', err);
    throw err;
  }
}

/**
 * Cleanup module resources.
 * Removes listener and clears state.
 * @returns {void}
 */
function cleanup() {
  try {
    chrome.storage.onChanged.removeListener(handleStorageChange);
  } catch (err) {
    console.error('[StorageManager] Failed to remove listener:', err);
  }
  changeListeners.clear();
  initialized = false;
}

/**
 * Get the current status of the storage manager.
 * @returns {{initialized: boolean}}
 */
function getStatus() {
  return {
    initialized
  };
}

/**
 * Save a value to chrome.storage.local.
 * Key is automatically namespaced with sidepilot. prefix.
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 * @returns {Promise<boolean>} - True on success, false on error
 */
async function save(key, value) {
  const namespacedKey = namespaceKey(key);

  try {
    await chrome.storage.local.set({ [namespacedKey]: value });
    return true;
  } catch (err) {
    // Handle quota exceeded error
    if (err.message && err.message.includes('QUOTA_BYTES')) {
      console.error('[StorageManager] Storage quota exceeded for key:', key);
    } else {
      console.error('[StorageManager] Failed to save key:', key, err);
    }
    return false;
  }
}

/**
 * Load a value from chrome.storage.local.
 * Key is automatically namespaced with sidepilot. prefix.
 * @param {string} key - Storage key
 * @returns {Promise<*>} - Stored value or null if not found
 */
async function load(key) {
  const namespacedKey = namespaceKey(key);

  try {
    const result = await chrome.storage.local.get(namespacedKey);
    return result[namespacedKey] ?? null;
  } catch (err) {
    console.error('[StorageManager] Failed to load key:', key, err);
    return null;
  }
}

/**
 * Remove a key from chrome.storage.local.
 * Key is automatically namespaced with sidepilot. prefix.
 * @param {string} key - Storage key to remove
 * @returns {Promise<boolean>} - True on success, false on error
 */
async function remove(key) {
  const namespacedKey = namespaceKey(key);

  try {
    await chrome.storage.local.remove(namespacedKey);
    return true;
  } catch (err) {
    console.error('[StorageManager] Failed to remove key:', key, err);
    return false;
  }
}

/**
 * Get bytes in use for sidepilot.* keys.
 * @returns {Promise<number>} - Bytes in use, or -1 on error
 */
async function getBytesInUse() {
  try {
    // Get all keys first
    const allData = await chrome.storage.local.get(null);
    const sidepilotKeys = Object.keys(allData).filter(k => k.startsWith(NAMESPACE_PREFIX));
    
    if (sidepilotKeys.length === 0) {
      return 0;
    }

    const bytes = await chrome.storage.local.getBytesInUse(sidepilotKeys);
    return bytes;
  } catch (err) {
    console.error('[StorageManager] Failed to get bytes in use:', err);
    return -1;
  }
}

/**
 * Subscribe to storage change events.
 * Only notified of changes to sidepilot.* keys.
 * @param {function(Object): void} callback - Called with changes object
 * @returns {function(): void} - Unsubscribe function
 */
function onStorageChange(callback) {
  if (typeof callback !== 'function') {
    console.error('[StorageManager] onStorageChange requires a function callback');
    return () => {};
  }

  changeListeners.add(callback);

  // Return unsubscribe function
  return () => {
    changeListeners.delete(callback);
  };
}

// ============================================
// Module Export
// ============================================

export {
  init,
  cleanup,
  getStatus,
  save,
  load,
  remove,
  getBytesInUse,
  onStorageChange
};
