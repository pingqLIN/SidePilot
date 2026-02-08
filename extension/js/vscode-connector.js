'use strict';

// ============================================
// VS Code Connector Module
// VS Code URI integration for memory entries
// ============================================

const VSCODE_URI_BASE = 'vscode://sidepilot.vscode-extension';
const MAX_URI_LENGTH = 2000;

// ============================================
// Module State
// ============================================

let initialized = false;

// ============================================
// Private Functions
// ============================================

/**
 * Safely encode data for URI
 * @param {Object} data - Data to encode
 * @returns {string} - URI encoded JSON string
 */
function encodeData(data) {
  try {
    const json = JSON.stringify(data);
    return encodeURIComponent(json);
  } catch (err) {
    console.error('[VSCodeConnector] Failed to encode data:', err);
    return '';
  }
}

/**
 * Truncate content to fit within URI length limit
 * @param {Object} data - Data object with potential content field
 * @param {number} maxLength - Maximum URI length
 * @returns {Object} - Data with truncated content if needed
 */
function truncateForUri(data, maxLength) {
  const baseUri = `${VSCODE_URI_BASE}?action=createTask&data=`;
  const baseLength = baseUri.length;
  const availableLength = maxLength - baseLength;

  // Try with full data first
  let encoded = encodeData(data);
  if (encoded.length <= availableLength) {
    return data;
  }

  // Need to truncate content
  const truncatedData = { ...data };
  if (truncatedData.content && typeof truncatedData.content === 'string') {
    // Binary search for max content length
    let low = 0;
    let high = truncatedData.content.length;
    let lastValidLength = 0;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      truncatedData.content = data.content.substring(0, mid) + '...';
      encoded = encodeData(truncatedData);

      if (encoded.length <= availableLength) {
        lastValidLength = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    truncatedData.content = data.content.substring(0, lastValidLength) + '...';
  }

  return truncatedData;
}

// ============================================
// Exported Functions
// ============================================

/**
 * Initialize the VS Code connector module.
 * @returns {Promise<void>}
 */
async function init() {
  if (initialized) {
    return;
  }

  try {
    initialized = true;
  } catch (err) {
    console.error('[VSCodeConnector] Init failed:', err);
    initialized = true;
  }
}

/**
 * Cleanup module resources.
 * @returns {void}
 */
function cleanup() {
  initialized = false;
}

/**
 * Get the current status of the VS Code connector.
 * @returns {{initialized: boolean}}
 */
function getStatus() {
  return {
    initialized
  };
}

/**
 * Check if VS Code protocol handler is available.
 * Best effort detection - may return true even if VS Code is not installed.
 * @returns {Promise<boolean>}
 */
async function isVSCodeAvailable() {
  // Protocol handler detection is limited in browsers
  // We can't reliably detect if VS Code is installed
  // Return true to allow attempts - failures will be graceful
  try {
    // Some browsers support navigator.protocolCheck (non-standard)
    // Most don't, so we default to true and let the user try
    return true;
  } catch (err) {
    console.warn('[VSCodeConnector] Cannot detect VS Code availability:', err);
    return true;
  }
}

/**
 * Format a memory entry for VS Code.
 * Converts entry to VS Code compatible format.
 * @param {Object} entry - Memory bank entry
 * @returns {Object} - VS Code formatted data
 */
function formatForVSCode(entry) {
  if (!entry) {
    return null;
  }

  return {
    id: entry.id,
    type: entry.type,
    title: entry.title,
    content: entry.content || '',
    tags: entry.tags || [],
    status: entry.status || null,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    source: 'sidepilot-extension'
  };
}

/**
 * Send a memory entry to VS Code.
 * Opens vscode:// URI with encoded entry data.
 * @param {Object} entry - Memory bank entry
 * @returns {Promise<boolean>} - True if URI was opened, false on failure
 */
async function sendToVSCode(entry) {
  if (!entry) {
    console.error('[VSCodeConnector] No entry provided');
    return false;
  }

  try {
    const formattedData = formatForVSCode(entry);
    if (!formattedData) {
      console.error('[VSCodeConnector] Failed to format entry');
      return false;
    }

    // Truncate if needed to fit URI length limit
    const truncatedData = truncateForUri(formattedData, MAX_URI_LENGTH);
    const encodedData = encodeData(truncatedData);

    if (!encodedData) {
      console.error('[VSCodeConnector] Failed to encode data');
      return false;
    }

    const uri = `${VSCODE_URI_BASE}?action=createTask&data=${encodedData}`;

    // Open the URI - this will launch VS Code if installed
    // Using window.open with _blank to avoid navigation issues
    const opened = window.open(uri, '_blank');

    if (!opened) {
      // Fallback: try location.href (may cause navigation)
      console.warn('[VSCodeConnector] window.open blocked, trying location.href');
      window.location.href = uri;
    }

    return true;
  } catch (err) {
    console.error('[VSCodeConnector] Failed to send to VS Code:', err);
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
  isVSCodeAvailable,
  sendToVSCode,
  formatForVSCode
};
