'use strict';

// ============================================
// Rules Manager Module
// Manages Copilot instructions and templates
// ============================================

import * as StorageManager from './storage-manager.js';

const STORAGE_KEYS = {
  CONTENT: 'rules.content',
  LAST_MODIFIED: 'rules.lastModified',
  VERSION: 'rules.version'
};

const EXPORT_FILENAME = 'copilot-instructions.md';

// ============================================
// Module State
// ============================================

let initialized = false;

// ============================================
// Built-in Templates
// ============================================

const TEMPLATES = {
  default: {
    id: 'default',
    name: 'Default',
    description: 'General coding guidelines',
    path: 'templates/default-rules.md'
  },
  typescript: {
    id: 'typescript',
    name: 'TypeScript',
    description: 'TypeScript best practices',
    path: 'templates/typescript-rules.md'
  },
  react: {
    id: 'react',
    name: 'React',
    description: 'React component guidelines',
    path: 'templates/react-rules.md'
  }
};

// ============================================
// Private Functions
// ============================================

/**
 * Load template content from file
 * @param {string} templatePath - Path to template file
 * @returns {Promise<string>} - Template content
 */
async function loadTemplateContent(templatePath) {
  try {
    const url = chrome.runtime.getURL(templatePath);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch template: ${response.status}`);
    }
    
    const content = await response.text();
    
    // Validate template content
    if (!content || content.trim().length === 0) {
      throw new Error('Template content is empty');
    }
    
    if (content.length > 500000) {
      throw new Error('Template content exceeds 500KB limit');
    }
    
    return content;
  } catch (err) {
    console.error('[RulesManager] Failed to load template:', templatePath, err);
    throw err;
  }
}

/**
 * Trigger file download
 * @param {string} content - File content
 * @param {string} filename - Download filename
 */
function downloadFile(content, filename) {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);

  chrome.downloads.download({
    url: url,
    filename: filename,
    saveAs: true
  }, (downloadId) => {
    // Clean up object URL after download starts
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    
    if (chrome.runtime.lastError) {
      console.error('[RulesManager] Download failed:', chrome.runtime.lastError);
    }
  });
}

// ============================================
// Exported Functions
// ============================================

/**
 * Initialize the rules manager module.
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

    initialized = true;
  } catch (err) {
    console.error('[RulesManager] Init failed:', err);
    throw err;
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
 * Get the current status of the rules manager.
 * @returns {{initialized: boolean}}
 */
function getStatus() {
  return {
    initialized
  };
}

/**
 * Save rules content to storage.
 * @param {string} content - Rules content
 * @returns {Promise<boolean>} - True on success
 */
async function saveRules(content) {
  try {
    // Get current version
    const currentVersion = await StorageManager.load(STORAGE_KEYS.VERSION) || 0;
    const newVersion = currentVersion + 1;

    // Save all fields
    const contentSaved = await StorageManager.save(STORAGE_KEYS.CONTENT, content);
    const timestampSaved = await StorageManager.save(STORAGE_KEYS.LAST_MODIFIED, Date.now());
    const versionSaved = await StorageManager.save(STORAGE_KEYS.VERSION, newVersion);

    return contentSaved && timestampSaved && versionSaved;
  } catch (err) {
    console.error('[RulesManager] Failed to save rules:', err);
    return false;
  }
}

/**
 * Load rules from storage.
 * @returns {Promise<{content: string|null, lastModified: number|null, version: number|null}>}
 */
async function loadRules() {
  try {
    const [content, lastModified, version] = await Promise.all([
      StorageManager.load(STORAGE_KEYS.CONTENT),
      StorageManager.load(STORAGE_KEYS.LAST_MODIFIED),
      StorageManager.load(STORAGE_KEYS.VERSION)
    ]);

    return {
      content,
      lastModified,
      version
    };
  } catch (err) {
    console.error('[RulesManager] Failed to load rules:', err);
    return {
      content: null,
      lastModified: null,
      version: null
    };
  }
}

/**
 * Export rules as downloadable .md file.
 * @returns {Promise<boolean>} - True if export started
 */
async function exportAsFile() {
  try {
    const { content } = await loadRules();
    
    if (!content) {
      console.warn('[RulesManager] No rules content to export');
      return false;
    }

    downloadFile(content, EXPORT_FILENAME);
    return true;
  } catch (err) {
    console.error('[RulesManager] Export failed:', err);
    return false;
  }
}

/**
 * Import rules from uploaded file.
 * @param {File} file - File object from input
 * @returns {Promise<{success: boolean, content?: string, error?: string}>}
 */
async function importFromFile(file) {
  try {
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    const MAX_FILE_SIZE = 500 * 1024; // 500 KB
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return { 
        success: false, 
        error: `File size exceeds 500KB limit (current: ${(file.size / 1024).toFixed(2)}KB)` 
      };
    }

    // Validate file type
    const validTypes = ['text/markdown', 'text/plain', 'text/x-markdown'];
    const isMarkdown = validTypes.includes(file.type) || 
                       file.name.endsWith('.md') || 
                       file.name.endsWith('.txt');

    if (!isMarkdown) {
      return { success: false, error: 'Invalid file type. Please upload a .md or .txt file.' };
    }

    // Read file content
    const content = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });

    // Validate content
    if (!content || content.trim().length === 0) {
      return { success: false, error: 'File content is empty' };
    }

    // Save imported content
    const saved = await saveRules(content);
    
    if (!saved) {
      return { success: false, error: 'Failed to save imported rules' };
    }

    return { success: true, content };
  } catch (err) {
    console.error('[RulesManager] Import failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get available templates.
 * @returns {Array<{id: string, name: string, description: string}>}
 */
function getTemplates() {
  return Object.values(TEMPLATES).map(({ id, name, description }) => ({
    id,
    name,
    description
  }));
}

/**
 * Apply a template by ID.
 * @param {string} templateId - Template ID
 * @returns {Promise<{success: boolean, content?: string, error?: string}>}
 */
async function applyTemplate(templateId) {
  try {
    const template = TEMPLATES[templateId];
    
    if (!template) {
      return { success: false, error: `Unknown template: ${templateId}` };
    }

    const content = await loadTemplateContent(template.path);
    const saved = await saveRules(content);

    if (!saved) {
      return { success: false, error: 'Failed to save template content' };
    }

    return { success: true, content };
  } catch (err) {
    console.error('[RulesManager] Apply template failed:', err);
    return { success: false, error: err.message };
  }
}

// ============================================
// Module Export
// ============================================

export {
  init,
  cleanup,
  getStatus,
  saveRules,
  loadRules,
  exportAsFile,
  importFromFile,
  getTemplates,
  applyTemplate
};
