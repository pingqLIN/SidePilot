'use strict';

// ============================================================
// Permission Manager Module
// Manages the permission request/response lifecycle in SDK mode.
// When the Copilot bridge server sends a permission request via SSE,
// this module tracks the pending request state so the extension can
// display a decision UI and package the user's choice into the
// payload expected by the bridge: { id, approved, optionId }.
// ============================================================

const MODULE = '[PermissionManager]';

// ============================================================
// Module State
// ============================================================

let _currentPermissionId = null;
let _currentPermissionOptions = [];
let _selectedOptionId = null;

// ============================================================
// Public API
// ============================================================

/**
 * Stores the incoming permission request and pre-selects the first option.
 * @param {{ id: string, scope: string, options: Array<{optionId: string, label?: string}> }} permission
 */
function showPermissionModal(permission) {
  _currentPermissionId = permission.id;
  _currentPermissionOptions = permission.options || [];
  _selectedOptionId = _currentPermissionOptions.length > 0
    ? _currentPermissionOptions[0].optionId
    : null;
  console.log(`${MODULE} Showing modal for request: ${permission.id}`);
}

/**
 * Clears all permission request state (e.g. after resolution or dismissal).
 */
function hidePermissionModal() {
  _currentPermissionId = null;
  _currentPermissionOptions = [];
  _selectedOptionId = null;
}

/**
 * Records the user's option selection in the decision UI.
 * @param {string} optionId
 */
function selectOption(optionId) {
  _selectedOptionId = optionId;
}

/**
 * Resolves the current permission request and produces the bridge payload.
 * Returns null if no permission request is currently active.
 * @param {'allow'|'deny'} decision
 * @returns {{ id: string, approved: boolean, optionId?: string } | null}
 */
function resolvePermission(decision) {
  const permId = _currentPermissionId;
  const optionId = _selectedOptionId;
  hidePermissionModal();
  if (!permId) return null;

  const approved = decision === 'allow';
  return { id: permId, approved, optionId: approved ? optionId : undefined };
}

/**
 * Returns the ID of the currently pending permission request, or null.
 * @returns {string|null}
 */
function getCurrentPermissionId() {
  return _currentPermissionId;
}

/**
 * Returns the currently selected option ID, or null.
 * @returns {string|null}
 */
function getSelectedOptionId() {
  return _selectedOptionId;
}

// ============================================================
// Module Export
// ============================================================

export {
  showPermissionModal,
  hidePermissionModal,
  selectOption,
  resolvePermission,
  getCurrentPermissionId,
  getSelectedOptionId,
};
