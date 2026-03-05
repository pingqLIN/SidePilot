'use strict';

// ============================================
// Rules Manager Module
// Manages Copilot instructions and templates
// ============================================

import * as StorageManager from './storage-manager.js';

const STORAGE_KEYS = {
  CONTENT: 'rules.content',
  LAST_MODIFIED: 'rules.lastModified',
  VERSION: 'rules.version',
  TEMPLATE_ID: 'rules.templateId',
  SEED_VERSION: 'rules.seedVersion',
  SOURCE: 'rules.source'
};

const EXPORT_FILENAME = 'copilot-instructions.md';
const DEFAULT_TEMPLATE_ID = 'default';
const RULES_SEED_VERSION = 1;
const RULES_SOURCE_SYSTEM_BASELINE = 'system_baseline';
const RULES_SOURCE_USER = 'user';

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
  },
  'self-iteration': {
    id: 'self-iteration',
    name: '🔄 自我疊代',
    description: 'AI 主動建議記憶與規則更新',
    path: 'templates/self-iteration-rules.md'
  },
  'extension-dev': {
    id: 'extension-dev',
    name: '🧩 擴充開發',
    description: 'SidePilot 擴充端開發慣例',
    path: 'templates/extension-dev-rules.md'
  },
  safety: {
    id: 'safety',
    name: '🛡️ 絕對安全',
    description: '最嚴格的安全與變更控制',
    path: 'templates/safety-rules.md'
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

async function markSeedVersion(version = RULES_SEED_VERSION) {
  await StorageManager.save(STORAGE_KEYS.SEED_VERSION, version);
}

function normalizeRulesSource(source) {
  return source === RULES_SOURCE_SYSTEM_BASELINE
    ? RULES_SOURCE_SYSTEM_BASELINE
    : RULES_SOURCE_USER;
}

/**
 * Seed default rules once when extension is first used.
 * - If user already has content, only mark seed version.
 * - If content is empty, apply default template as baseline.
 */
async function ensureDefaultRulesSeed() {
  const [seedVersionRaw, currentContent] = await Promise.all([
    StorageManager.load(STORAGE_KEYS.SEED_VERSION),
    StorageManager.load(STORAGE_KEYS.CONTENT)
  ]);

  const seedVersion = Number(seedVersionRaw) || 0;
  if (seedVersion >= RULES_SEED_VERSION) {
    return;
  }

  const hasExistingRules = typeof currentContent === 'string' && currentContent.trim().length > 0;
  if (hasExistingRules) {
    await markSeedVersion();
    return;
  }

  const defaultTemplate = TEMPLATES[DEFAULT_TEMPLATE_ID];
  if (!defaultTemplate) {
    throw new Error(`Default template missing: ${DEFAULT_TEMPLATE_ID}`);
  }

  const defaultContent = await loadTemplateContent(defaultTemplate.path);
  const saved = await saveRules(defaultContent, {
    source: RULES_SOURCE_SYSTEM_BASELINE,
    templateId: DEFAULT_TEMPLATE_ID
  });
  if (!saved) {
    throw new Error('Failed to seed default rules');
  }

  await markSeedVersion();
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

    try {
      await ensureDefaultRulesSeed();
    } catch (seedErr) {
      console.warn('[RulesManager] Default rules seed skipped:', seedErr?.message || seedErr);
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
 * @param {{source?: string, templateId?: string}} [options] - Save metadata
 * @returns {Promise<boolean>} - True on success
 */
async function saveRules(content, options = {}) {
  try {
    // Get current version
    const currentVersion = await StorageManager.load(STORAGE_KEYS.VERSION) || 0;
    const newVersion = currentVersion + 1;
    const source = normalizeRulesSource(options?.source);
    const templateId = typeof options?.templateId === 'string' && options.templateId.trim().length > 0
      ? options.templateId.trim()
      : 'custom';

    // Save all fields
    const [contentSaved, timestampSaved, versionSaved, sourceSaved, templateSaved] = await Promise.all([
      StorageManager.save(STORAGE_KEYS.CONTENT, content),
      StorageManager.save(STORAGE_KEYS.LAST_MODIFIED, Date.now()),
      StorageManager.save(STORAGE_KEYS.VERSION, newVersion),
      StorageManager.save(STORAGE_KEYS.SOURCE, source),
      StorageManager.save(STORAGE_KEYS.TEMPLATE_ID, templateId)
    ]);

    return contentSaved && timestampSaved && versionSaved && sourceSaved && templateSaved;
  } catch (err) {
    console.error('[RulesManager] Failed to save rules:', err);
    return false;
  }
}

/**
 * Load rules from storage.
 * @returns {Promise<{content: string|null, lastModified: number|null, version: number|null, templateId: string|null, source: string}>}
 */
async function loadRules() {
  try {
    const [content, lastModified, version, templateId, source] = await Promise.all([
      StorageManager.load(STORAGE_KEYS.CONTENT),
      StorageManager.load(STORAGE_KEYS.LAST_MODIFIED),
      StorageManager.load(STORAGE_KEYS.VERSION),
      StorageManager.load(STORAGE_KEYS.TEMPLATE_ID),
      StorageManager.load(STORAGE_KEYS.SOURCE)
    ]);

    return {
      content,
      lastModified,
      version,
      templateId: typeof templateId === 'string' && templateId.trim().length > 0 ? templateId.trim() : null,
      source: normalizeRulesSource(source)
    };
  } catch (err) {
    console.error('[RulesManager] Failed to load rules:', err);
    return {
      content: null,
      lastModified: null,
      version: null,
      templateId: null,
      source: RULES_SOURCE_USER
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
    const saved = await saveRules(content, {
      source: RULES_SOURCE_USER,
      templateId
    });

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
