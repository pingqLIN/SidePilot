import { describe, it, expect, beforeEach } from '@jest/globals';
import * as PermissionManager from '../../extension/js/permission-manager.js';

/**
 * Permission System Tests
 * 測試前後端 permission 欄位匹配、options 選擇、scope 解析
 *
 * The "Frontend resolvePermission" and "End-to-end" suites import and exercise
 * the real PermissionManager module (extension/js/permission-manager.js).
 *
 * The createMockSessionManager() helper below is a self-contained behavioral
 * specification for the bridge server's permission protocol: it documents the
 * expected pending-permission map, whitelist auto-approve logic, and
 * resolve/deny flow that the backend should implement. These contract tests
 * are intentional — the production backend (scripts/copilot-bridge/src/
 * session-manager.ts) uses a simpler inline implementation and a fuller
 * implementation would mirror this spec.
 */

// -- Helper: 模擬 SessionManager 的 permission 邏輯（backend 行為規格）--

function createMockSessionManager() {
  const pendingPermissions = new Map();
  const permissionWhitelist = ['readTextFile', 'listDirectory'];
  const logs = [];
  let idCounter = 0;

  function pushLog(level, message) {
    logs.push({ level, message, ts: Date.now() });
  }

  function generatePermissionId() {
    return `perm_${Date.now()}_${++idCounter}`;
  }

  function resolvePermission(id, approved, optionId) {
    const pending = pendingPermissions.get(id);
    if (!pending) return false;

    pendingPermissions.delete(id);

    if (approved) {
      const resolvedOptionId = optionId || (pending.options.length > 0 ? pending.options[0].optionId : undefined);
      if (resolvedOptionId) {
        pending.resolve({
          outcome: { outcome: 'selected', optionId: resolvedOptionId }
        });
        pushLog('info', `[Permission] Approved: ${id} (option: ${resolvedOptionId})`);
      } else {
        pending.resolve({
          outcome: { outcome: 'cancelled' }
        });
        pushLog('warn', `[Permission] Approved but no options available: ${id}`);
      }
    } else {
      pending.resolve({
        outcome: { outcome: 'cancelled' }
      });
      pushLog('info', `[Permission] Denied: ${id}`);
    }
    return true;
  }

  function requestPermissionAsync(sessionId, params) {
    const options = params?.options || [];
    const scope = params?.scope || params?.title || params?.resource?.uri || 'unknown';
    const reason = params?.message || params?.reason || '';

    // Whitelist check
    const isWhitelisted = permissionWhitelist.some(pattern =>
      scope.toLowerCase().includes(pattern.toLowerCase())
    );

    if (isWhitelisted && options.length > 0) {
      const first = options[0];
      pushLog('info', `[Permission] Auto-approved (whitelist): ${scope}`);
      return Promise.resolve({
        outcome: { outcome: 'selected', optionId: first.optionId }
      });
    }

    if (options.length === 0) {
      return Promise.resolve({ outcome: { outcome: 'cancelled' } });
    }

    const id = generatePermissionId();
    pushLog('warn', `[Permission] Pending approval: ${id} (scope: ${scope})`);

    return new Promise((resolve) => {
      pendingPermissions.set(id, {
        id,
        sessionId,
        scope,
        reason,
        options,
        timestamp: Date.now(),
        resolve,
      });
    });
  }

  return {
    pendingPermissions,
    resolvePermission,
    requestPermissionAsync,
    logs,
    get permissionWhitelist() { return [...permissionWhitelist]; },
  };
}

// ============================================
// Tests
// ============================================

describe('Permission System', () => {

  describe('resolvePermission — field matching', () => {
    let sm;

    beforeEach(() => {
      sm = createMockSessionManager();
    });

    it('should approve with explicit optionId', async () => {
      const promise = sm.requestPermissionAsync('sess1', {
        scope: 'writeFile',
        options: [{ optionId: 'allow_once', label: 'Allow once' }, { optionId: 'allow_always', label: 'Always' }],
      });

      const pending = [...sm.pendingPermissions.values()][0];
      sm.resolvePermission(pending.id, true, 'allow_always');

      const result = await promise;
      expect(result.outcome.outcome).toBe('selected');
      expect(result.outcome.optionId).toBe('allow_always');
    });

    it('should approve with default first option when optionId omitted', async () => {
      const promise = sm.requestPermissionAsync('sess1', {
        scope: 'writeFile',
        options: [{ optionId: 'allow_once', label: 'Allow once' }, { optionId: 'allow_always', label: 'Always' }],
      });

      const pending = [...sm.pendingPermissions.values()][0];
      sm.resolvePermission(pending.id, true); // no optionId

      const result = await promise;
      expect(result.outcome.outcome).toBe('selected');
      expect(result.outcome.optionId).toBe('allow_once'); // defaults to first
    });

    it('should deny correctly', async () => {
      const promise = sm.requestPermissionAsync('sess1', {
        scope: 'deleteFile',
        options: [{ optionId: 'allow_once', label: 'Allow once' }],
      });

      const pending = [...sm.pendingPermissions.values()][0];
      sm.resolvePermission(pending.id, false);

      const result = await promise;
      expect(result.outcome.outcome).toBe('cancelled');
    });

    it('should return false for non-existent permission id', () => {
      const result = sm.resolvePermission('perm_nonexistent', true, 'opt1');
      expect(result).toBe(false);
    });

    it('should handle approved=true but no options gracefully', async () => {
      // Manually add a pending permission with empty options
      const id = 'perm_test_empty';
      let resolveRef;
      const promise = new Promise((resolve) => { resolveRef = resolve; });
      sm.pendingPermissions.set(id, {
        id,
        sessionId: 'sess1',
        scope: 'mystery',
        reason: '',
        options: [],
        timestamp: Date.now(),
        resolve: resolveRef,
      });

      sm.resolvePermission(id, true);
      const result = await promise;
      expect(result.outcome.outcome).toBe('cancelled');
    });
  });

  describe('scope parsing', () => {
    let sm;

    beforeEach(() => {
      sm = createMockSessionManager();
    });

    it('should use params.scope when available', async () => {
      const result = await sm.requestPermissionAsync('sess1', {
        scope: 'readTextFile',
        options: [{ optionId: 'opt1' }],
      });
      expect(result.outcome.outcome).toBe('selected'); // whitelisted
    });

    it('should fallback to params.title', async () => {
      const result = await sm.requestPermissionAsync('sess1', {
        title: 'readTextFile check',
        options: [{ optionId: 'opt1' }],
      });
      expect(result.outcome.outcome).toBe('selected'); // whitelisted via title
    });

    it('should fallback to params.resource.uri', async () => {
      const permissionPromise = sm.requestPermissionAsync('sess1', {
        resource: { uri: '/some/path' },
        options: [{ optionId: 'opt1' }],
      });
      const [permissionId, pending] = [...sm.pendingPermissions.entries()][0];
      expect(pending.scope).toBe('/some/path');
      sm.resolvePermission(permissionId, true, 'opt1');
      await permissionPromise;
    });

    it('should default to "unknown" when no scope info', async () => {
      const permissionPromise = sm.requestPermissionAsync('sess1', {
        options: [{ optionId: 'opt1' }],
      });
      const [permissionId, pending] = [...sm.pendingPermissions.entries()][0];
      expect(pending.scope).toBe('unknown');
      sm.resolvePermission(permissionId, true, 'opt1');
      await permissionPromise;
    });

    it('should auto-cancel when options array is empty', async () => {
      const result = await sm.requestPermissionAsync('sess1', {
        scope: 'deleteFile',
        options: [],
      });
      expect(result.outcome.outcome).toBe('cancelled');
    });
  });

  describe('whitelist auto-approve', () => {
    let sm;

    beforeEach(() => {
      sm = createMockSessionManager();
    });

    it('should auto-approve whitelisted scope', async () => {
      const result = await sm.requestPermissionAsync('sess1', {
        scope: 'readTextFile',
        options: [{ optionId: 'opt1' }],
      });
      expect(result.outcome.outcome).toBe('selected');
      expect(result.outcome.optionId).toBe('opt1');
    });

    it('should auto-approve listDirectory', async () => {
      const result = await sm.requestPermissionAsync('sess1', {
        scope: 'listDirectory',
        options: [{ optionId: 'opt1' }, { optionId: 'opt2' }],
      });
      expect(result.outcome.outcome).toBe('selected');
      expect(result.outcome.optionId).toBe('opt1'); // always first
    });

    it('should NOT auto-approve non-whitelisted scope', async () => {
      const permissionPromise = sm.requestPermissionAsync('sess1', {
        scope: 'writeFile',
        options: [{ optionId: 'opt1' }],
      });
      expect(sm.pendingPermissions.size).toBe(1);
      const [permissionId] = sm.pendingPermissions.keys();
      sm.resolvePermission(permissionId, false);
      await permissionPromise;
    });

    it('should NOT auto-approve whitelisted scope with no options', async () => {
      const result = await sm.requestPermissionAsync('sess1', {
        scope: 'readTextFile',
        options: [],
      });
      expect(result.outcome.outcome).toBe('cancelled');
    });
  });

  describe('Frontend resolvePermission — payload format', () => {

    beforeEach(() => {
      PermissionManager.hidePermissionModal();
    });

    it('should send { approved: true, optionId } on allow', () => {
      PermissionManager.showPermissionModal({
        id: 'perm_1',
        scope: 'writeFile',
        options: [{ optionId: 'allow_once' }, { optionId: 'allow_always' }],
      });

      const payload = PermissionManager.resolvePermission('allow');
      expect(payload).toEqual({
        id: 'perm_1',
        approved: true,
        optionId: 'allow_once', // default first
      });
    });

    it('should send selected optionId when user picks one', () => {
      PermissionManager.showPermissionModal({
        id: 'perm_2',
        scope: 'writeFile',
        options: [{ optionId: 'allow_once' }, { optionId: 'allow_always' }],
      });
      PermissionManager.selectOption('allow_always');

      const payload = PermissionManager.resolvePermission('allow');
      expect(payload).toEqual({
        id: 'perm_2',
        approved: true,
        optionId: 'allow_always',
      });
    });

    it('should send { approved: false, optionId: undefined } on deny', () => {
      PermissionManager.showPermissionModal({
        id: 'perm_3',
        scope: 'deleteFile',
        options: [{ optionId: 'opt1' }],
      });

      const payload = PermissionManager.resolvePermission('deny');
      expect(payload).toEqual({
        id: 'perm_3',
        approved: false,
        optionId: undefined,
      });
    });

    it('should return null if no permission is active', () => {
      const payload = PermissionManager.resolvePermission('allow');
      expect(payload).toBeNull();
    });

    it('should clear state after resolve', () => {
      PermissionManager.showPermissionModal({
        id: 'perm_4',
        scope: 'writeFile',
        options: [{ optionId: 'opt1' }],
      });
      PermissionManager.resolvePermission('allow');
      expect(PermissionManager.getCurrentPermissionId()).toBeNull();
      expect(PermissionManager.getSelectedOptionId()).toBeNull();
    });
  });

  describe('End-to-end: frontend → backend field matching', () => {

    beforeEach(() => {
      PermissionManager.hidePermissionModal();
    });

    it('should correctly approve permission through full flow', async () => {
      const sm = createMockSessionManager();

      // Backend: create pending permission
      const promise = sm.requestPermissionAsync('sess1', {
        scope: 'writeFile',
        message: 'Write to config.json',
        options: [{ optionId: 'allow_once', label: 'Allow once' }, { optionId: 'allow_always', label: 'Always allow' }],
      });

      // Simulate SSE push to frontend
      const pending = [...sm.pendingPermissions.values()][0];
      PermissionManager.showPermissionModal(pending);

      // User selects second option and approves
      PermissionManager.selectOption('allow_always');
      const payload = PermissionManager.resolvePermission('allow');

      // Backend resolves with frontend payload
      sm.resolvePermission(payload.id, payload.approved, payload.optionId);

      const result = await promise;
      expect(result.outcome.outcome).toBe('selected');
      expect(result.outcome.optionId).toBe('allow_always');
    });

    it('should correctly deny permission through full flow', async () => {
      const sm = createMockSessionManager();

      const promise = sm.requestPermissionAsync('sess1', {
        scope: 'deleteFile',
        options: [{ optionId: 'allow_once' }],
      });

      const pending = [...sm.pendingPermissions.values()][0];
      PermissionManager.showPermissionModal(pending);
      const payload = PermissionManager.resolvePermission('deny');

      sm.resolvePermission(payload.id, payload.approved, payload.optionId);

      const result = await promise;
      expect(result.outcome.outcome).toBe('cancelled');
    });
  });
});
