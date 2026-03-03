'use strict';

// ============================================
// Memory Bank Module
// Task/note storage with CRUD and search
// ============================================

const STORAGE_KEYS = {
  ENTRIES: 'sidepilot.memory.entries',
  INDEX: 'sidepilot.memory.index'
};

const ENTRY_TYPES = ['task', 'note', 'context', 'reference'];
const STATUS_VALUES = ['pending', 'in_progress', 'done'];
const ENTRY_SOURCES = ['user', 'system_baseline'];

// ============================================
// Module State
// ============================================

let initialized = false;
let entriesCache = {};
let indexCache = { byStatus: { pending: [], in_progress: [], done: [] } };

// ============================================
// Private Functions
// ============================================

/**
 * Generate a unique entry ID
 * @returns {string}
 */
function generateId() {
  return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Load entries and index from storage
 * @returns {Promise<void>}
 */
async function loadFromStorage() {
  try {
    const result = await chrome.storage.local.get([
      STORAGE_KEYS.ENTRIES,
      STORAGE_KEYS.INDEX
    ]);
    const rawEntries = result[STORAGE_KEYS.ENTRIES] || {};
    let changed = false;
    entriesCache = Object.fromEntries(
      Object.entries(rawEntries).map(([id, rawEntry]) => {
        const normalized = normalizeStoredEntry(id, rawEntry);
        if (rawEntry?.source !== normalized.source || rawEntry?.id !== normalized.id) {
          changed = true;
        }
        return [id, normalized];
      })
    );
    indexCache = result[STORAGE_KEYS.INDEX] || { byStatus: { pending: [], in_progress: [], done: [] } };

    if (changed) {
      await saveToStorage();
    }
  } catch (err) {
    console.error('[MemoryBank] Failed to load from storage:', err);
    entriesCache = {};
    indexCache = { byStatus: { pending: [], in_progress: [], done: [] } };
  }
}

/**
 * Save entries and index to storage
 * @returns {Promise<void>}
 */
async function saveToStorage() {
  try {
    await chrome.storage.local.set({
      [STORAGE_KEYS.ENTRIES]: entriesCache,
      [STORAGE_KEYS.INDEX]: indexCache
    });
  } catch (err) {
    console.error('[MemoryBank] Failed to save to storage:', err);
  }
}

/**
 * Update the status index for an entry
 * @param {string} id - Entry ID
 * @param {string|null} oldStatus - Previous status (null if new)
 * @param {string|null} newStatus - New status (null if deleted)
 */
function updateIndex(id, oldStatus, newStatus) {
  // Remove from old status list
  if (oldStatus && indexCache.byStatus[oldStatus]) {
    const idx = indexCache.byStatus[oldStatus].indexOf(id);
    if (idx !== -1) {
      indexCache.byStatus[oldStatus].splice(idx, 1);
    }
  }

  // Add to new status list
  if (newStatus && indexCache.byStatus[newStatus]) {
    if (!indexCache.byStatus[newStatus].includes(id)) {
      indexCache.byStatus[newStatus].push(id);
    }
  }
}

/**
 * Validate entry type
 * @param {string} type - Entry type to validate
 * @returns {boolean}
 */
function isValidType(type) {
  return ENTRY_TYPES.includes(type);
}

/**
 * Validate status value
 * @param {string} status - Status to validate
 * @returns {boolean}
 */
function isValidStatus(status) {
  return STATUS_VALUES.includes(status);
}

function normalizeEntrySource(source) {
  return ENTRY_SOURCES.includes(source) ? source : 'user';
}

function normalizeStoredEntry(id, rawEntry = {}) {
  const entry = rawEntry && typeof rawEntry === 'object' ? rawEntry : {};
  return {
    ...entry,
    id: entry.id || id,
    source: normalizeEntrySource(entry.source)
  };
}

// ============================================
// Exported Functions
// ============================================

/**
 * Initialize the memory bank module.
 * Loads persisted entries from storage.
 * @returns {Promise<void>}
 */
async function init() {
  if (initialized) {
    return;
  }

  try {
    await loadFromStorage();
    initialized = true;
  } catch (err) {
    console.error('[MemoryBank] Init failed:', err);
    initialized = true;
  }
}

/**
 * Cleanup module resources.
 * Resets state.
 * @returns {void}
 */
function cleanup() {
  initialized = false;
  entriesCache = {};
  indexCache = { byStatus: { pending: [], in_progress: [], done: [] } };
}

/**
 * Get the current status of the memory bank.
 * @returns {{initialized: boolean, entryCount: number}}
 */
function getStatus() {
  return {
    initialized,
    entryCount: Object.keys(entriesCache).length
  };
}

/**
 * Create a new entry.
 * @param {Object} entry - Entry data
 * @param {string} entry.type - Entry type: task, note, context, reference
 * @param {string} entry.title - Entry title
 * @param {string} [entry.content] - Entry content
 * @param {string[]} [entry.tags] - Entry tags
 * @param {string} [entry.status] - Status for task type only
 * @param {string} [entry.source] - Entry source: user, system_baseline
 * @returns {Promise<Object>} - The created entry with generated ID
 */
async function createEntry(entry) {
  if (!entry || !entry.type || !entry.title) {
    throw new Error('Entry must have type and title');
  }

  if (!isValidType(entry.type)) {
    throw new Error(`Invalid entry type: ${entry.type}. Must be one of: ${ENTRY_TYPES.join(', ')}`);
  }

  const now = Date.now();
  const newEntry = {
    id: generateId(),
    type: entry.type,
    title: entry.title,
    content: entry.content || '',
    tags: Array.isArray(entry.tags) ? entry.tags : [],
    source: normalizeEntrySource(entry.source),
    createdAt: now,
    updatedAt: now
  };

  // Only tasks can have status
  if (entry.type === 'task') {
    if (entry.status && !isValidStatus(entry.status)) {
      throw new Error(`Invalid status: ${entry.status}. Must be one of: ${STATUS_VALUES.join(', ')}`);
    }
    newEntry.status = entry.status || 'pending';
    updateIndex(newEntry.id, null, newEntry.status);
  }

  entriesCache[newEntry.id] = newEntry;
  await saveToStorage();

  return { ...newEntry };
}

/**
 * Get an entry by ID.
 * @param {string} id - Entry ID
 * @returns {Object|null} - The entry or null if not found
 */
function getEntry(id) {
  const entry = entriesCache[id];
  return entry ? { ...entry } : null;
}

/**
 * Update an existing entry.
 * @param {string} id - Entry ID
 * @param {Object} data - Fields to update
 * @returns {Promise<Object|null>} - The updated entry or null if not found
 */
async function updateEntry(id, data) {
  const entry = entriesCache[id];
  if (!entry) {
    return null;
  }

  entry.source = normalizeEntrySource(entry.source);

  const oldStatus = entry.status || null;

  // Validate type if provided
  if (data.type !== undefined) {
    if (!isValidType(data.type)) {
      throw new Error(`Invalid entry type: ${data.type}. Must be one of: ${ENTRY_TYPES.join(', ')}`);
    }
  }

  const updatedType = data.type !== undefined ? data.type : entry.type;

  // Update allowed fields
  if (data.title !== undefined) {
    entry.title = data.title;
  }
  if (data.content !== undefined) {
    entry.content = data.content;
  }
  if (data.tags !== undefined) {
    entry.tags = Array.isArray(data.tags) ? data.tags : [];
  }
  if (data.type !== undefined) {
    entry.type = data.type;
  }

  // Handle status changes
  if (updatedType === 'task') {
    if (data.status !== undefined) {
      if (!isValidStatus(data.status)) {
        throw new Error(`Invalid status: ${data.status}. Must be one of: ${STATUS_VALUES.join(', ')}`);
      }
      entry.status = data.status;
    } else if (!entry.status) {
      // New task type needs default status
      entry.status = 'pending';
    }
    updateIndex(id, oldStatus, entry.status);
  } else {
    // Non-task types should not have status
    if (entry.status) {
      updateIndex(id, oldStatus, null);
      delete entry.status;
    }
  }

  entry.updatedAt = Date.now();
  await saveToStorage();

  return { ...entry };
}

/**
 * Delete an entry by ID.
 * @param {string} id - Entry ID
 * @returns {Promise<boolean>} - True if deleted, false if not found
 */
async function deleteEntry(id) {
  const entry = entriesCache[id];
  if (!entry) {
    return false;
  }

  // Update index if entry has status
  if (entry.status) {
    updateIndex(id, entry.status, null);
  }

  delete entriesCache[id];
  await saveToStorage();

  return true;
}

/**
 * List entries with optional filtering.
 * @param {Object} [filter] - Filter options
 * @param {string} [filter.type] - Filter by entry type
 * @param {string} [filter.status] - Filter by status (tasks only)
 * @returns {Object[]} - Array of matching entries
 */
function listEntries(filter = {}) {
  let entries = Object.values(entriesCache);

  // Filter by type
  if (filter.type) {
    if (!isValidType(filter.type)) {
      console.warn(`[MemoryBank] Invalid filter type: ${filter.type}`);
      return [];
    }
    entries = entries.filter(e => e.type === filter.type);
  }

  // Filter by status
  if (filter.status) {
    if (!isValidStatus(filter.status)) {
      console.warn(`[MemoryBank] Invalid filter status: ${filter.status}`);
      return [];
    }
    entries = entries.filter(e => e.status === filter.status);
  }

  // Return copies to prevent mutation
  return entries.map(e => ({ ...e }));
}

/**
 * Search entries by text in title and content.
 * Case-insensitive search.
 * @param {string} query - Search query
 * @returns {Object[]} - Array of matching entries
 */
function searchEntries(query) {
  if (!query || typeof query !== 'string') {
    return [];
  }

  const lowerQuery = query.toLowerCase();
  const entries = Object.values(entriesCache);

  const matches = entries.filter(entry => {
    const titleMatch = entry.title && entry.title.toLowerCase().includes(lowerQuery);
    const contentMatch = entry.content && entry.content.toLowerCase().includes(lowerQuery);
    return titleMatch || contentMatch;
  });

  // Return copies to prevent mutation
  return matches.map(e => ({ ...e }));
}

// ============================================
// Module Export
// ============================================

export {
  init,
  cleanup,
  getStatus,
  createEntry,
  getEntry,
  updateEntry,
  deleteEntry,
  listEntries,
  searchEntries
};
