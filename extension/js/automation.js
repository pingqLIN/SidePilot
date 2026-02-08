'use strict';

// ============================================
// Automation Module
// Captures page context for Copilot
// ============================================

import * as StorageManager from './storage-manager.js';

const STORAGE_KEYS = {
  SETTINGS: 'automation.settings'
};

const DEFAULT_SETTINGS = {
  autoInjectContext: false,
  contextMaxLength: 5000
};

// ============================================
// Module State
// ============================================

let initialized = false;
let settings = { ...DEFAULT_SETTINGS };

// ============================================
// Private Functions
// ============================================

/**
 * Load settings from storage
 * @returns {Promise<void>}
 */
async function loadSettings() {
  const stored = await StorageManager.load(STORAGE_KEYS.SETTINGS);
  if (stored) {
    settings = { ...DEFAULT_SETTINGS, ...stored };
  }
}

/**
 * Truncate text to max length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) {
    return text || '';
  }
  return text.slice(0, maxLength - 3) + '...';
}

// ============================================
// Exported Functions
// ============================================

/**
 * Initialize the automation module.
 * @returns {Promise<void>}
 */
async function init() {
  if (initialized) {
    return;
  }

  try {
    // Ensure storage manager is initialized
    const storageStatus = StorageManager.getStatus();
    if (!storageStatus.initialized) {
      await StorageManager.init();
    }

    await loadSettings();
    initialized = true;
  } catch (err) {
    console.error('[Automation] Init failed:', err);
    throw err;
  }
}

/**
 * Cleanup module resources.
 * @returns {void}
 */
function cleanup() {
  settings = { ...DEFAULT_SETTINGS };
  initialized = false;
}

/**
 * Get the current status of the automation module.
 * @returns {{initialized: boolean}}
 */
function getStatus() {
  return {
    initialized
  };
}

/**
 * Capture current page context.
 * Must be called from content script context.
 * @returns {Object} - Page context data
 */
function capturePageContext() {
  try {
    const context = {
      url: window.location.href,
      title: document.title,
      pathname: window.location.pathname,
      hostname: window.location.hostname,
      timestamp: Date.now()
    };

    // Get meta description if available
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      context.description = metaDescription.getAttribute('content');
    }

    // Get selected text if any
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      context.selectedText = selection.toString().trim();
    }

    // Get visible text content (limited)
    const bodyText = document.body?.innerText || '';
    context.pageText = truncateText(bodyText, settings.contextMaxLength);

    return context;
  } catch (err) {
    console.error('[Automation] Failed to capture page context:', err);
    return {
      url: window.location.href,
      title: document.title,
      timestamp: Date.now(),
      error: err.message
    };
  }
}

/**
 * Format captured data as context string for Copilot.
 * @param {Object} data - Captured page data
 * @returns {string} - Formatted context string
 */
function formatAsContext(data) {
  if (!data) {
    return '';
  }

  const parts = [];

  parts.push('## Page Context');
  parts.push('');

  if (data.title) {
    parts.push(`**Title:** ${data.title}`);
  }

  if (data.url) {
    parts.push(`**URL:** ${data.url}`);
  }

  if (data.description) {
    parts.push(`**Description:** ${data.description}`);
  }

  if (data.selectedText) {
    parts.push('');
    parts.push('### Selected Text');
    parts.push('```');
    parts.push(data.selectedText);
    parts.push('```');
  }

  if (data.pageText && !data.selectedText) {
    parts.push('');
    parts.push('### Page Content');
    parts.push(truncateText(data.pageText, settings.contextMaxLength));
  }

  return parts.join('\n');
}

/**
 * Get current automation settings.
 * @returns {Object} - Current settings
 */
function getSettings() {
  return { ...settings };
}

/**
 * Update automation settings.
 * @param {Object} newSettings - Settings to update
 * @returns {Promise<boolean>} - True on success
 */
async function updateSettings(newSettings) {
  try {
    // Merge with existing settings
    const merged = {
      ...settings,
      ...newSettings
    };

    // Validate settings
    if (typeof merged.autoInjectContext !== 'boolean') {
      merged.autoInjectContext = DEFAULT_SETTINGS.autoInjectContext;
    }

    if (typeof merged.contextMaxLength !== 'number' || merged.contextMaxLength < 100) {
      merged.contextMaxLength = DEFAULT_SETTINGS.contextMaxLength;
    }

    // Save to storage
    const saved = await StorageManager.save(STORAGE_KEYS.SETTINGS, merged);
    
    if (saved) {
      settings = merged;
    }

    return saved;
  } catch (err) {
    console.error('[Automation] Failed to update settings:', err);
    return false;
  }
}

// ============================================
// Module Export
// ============================================

export {
  init,
  cleanup,
  getStatus,
  capturePageContext,
  formatAsContext,
  getSettings,
  updateSettings
};
