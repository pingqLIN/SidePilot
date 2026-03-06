import { describe, it, expect, beforeEach } from '@jest/globals';
import * as PermissionManager from '../../extension/js/permission-manager.js';

describe('PermissionManager', () => {

  beforeEach(() => {
    PermissionManager.hidePermissionModal();
  });

  describe('showPermissionModal', () => {
    it('should store permission id and options', () => {
      PermissionManager.showPermissionModal({
        id: 'perm_1',
        scope: 'writeFile',
        options: [{ optionId: 'opt_a' }, { optionId: 'opt_b' }],
      });
      expect(PermissionManager.getCurrentPermissionId()).toBe('perm_1');
    });

    it('should pre-select the first option', () => {
      PermissionManager.showPermissionModal({
        id: 'perm_1',
        scope: 'writeFile',
        options: [{ optionId: 'first' }, { optionId: 'second' }],
      });
      expect(PermissionManager.getSelectedOptionId()).toBe('first');
    });

    it('should set selectedOptionId to null when options array is empty', () => {
      PermissionManager.showPermissionModal({ id: 'perm_2', scope: 'writeFile', options: [] });
      expect(PermissionManager.getSelectedOptionId()).toBeNull();
    });

    it('should handle missing options property gracefully', () => {
      PermissionManager.showPermissionModal({ id: 'perm_3', scope: 'writeFile' });
      expect(PermissionManager.getSelectedOptionId()).toBeNull();
      expect(PermissionManager.getCurrentPermissionId()).toBe('perm_3');
    });
  });

  describe('hidePermissionModal', () => {
    it('should clear current permission id', () => {
      PermissionManager.showPermissionModal({ id: 'perm_1', scope: 'x', options: [] });
      PermissionManager.hidePermissionModal();
      expect(PermissionManager.getCurrentPermissionId()).toBeNull();
    });

    it('should clear selected option id', () => {
      PermissionManager.showPermissionModal({
        id: 'perm_1',
        scope: 'x',
        options: [{ optionId: 'opt_a' }],
      });
      PermissionManager.hidePermissionModal();
      expect(PermissionManager.getSelectedOptionId()).toBeNull();
    });
  });

  describe('selectOption', () => {
    it('should update the selected option id', () => {
      PermissionManager.showPermissionModal({
        id: 'perm_1',
        scope: 'writeFile',
        options: [{ optionId: 'opt_a' }, { optionId: 'opt_b' }],
      });
      PermissionManager.selectOption('opt_b');
      expect(PermissionManager.getSelectedOptionId()).toBe('opt_b');
    });
  });

  describe('resolvePermission', () => {
    it('should return null when no permission is active', () => {
      expect(PermissionManager.resolvePermission('allow')).toBeNull();
    });

    it('should return correct payload on allow', () => {
      PermissionManager.showPermissionModal({
        id: 'perm_1',
        scope: 'writeFile',
        options: [{ optionId: 'opt_a' }],
      });
      const payload = PermissionManager.resolvePermission('allow');
      expect(payload).toEqual({ id: 'perm_1', approved: true, optionId: 'opt_a' });
    });

    it('should return correct payload on deny', () => {
      PermissionManager.showPermissionModal({
        id: 'perm_1',
        scope: 'writeFile',
        options: [{ optionId: 'opt_a' }],
      });
      const payload = PermissionManager.resolvePermission('deny');
      expect(payload).toEqual({ id: 'perm_1', approved: false, optionId: undefined });
    });

    it('should clear state after resolution', () => {
      PermissionManager.showPermissionModal({
        id: 'perm_1',
        scope: 'writeFile',
        options: [{ optionId: 'opt_a' }],
      });
      PermissionManager.resolvePermission('allow');
      expect(PermissionManager.getCurrentPermissionId()).toBeNull();
      expect(PermissionManager.getSelectedOptionId()).toBeNull();
    });
  });

  describe('getCurrentPermissionId', () => {
    it('should return null initially', () => {
      expect(PermissionManager.getCurrentPermissionId()).toBeNull();
    });

    it('should return the id after showPermissionModal', () => {
      PermissionManager.showPermissionModal({ id: 'perm_x', scope: 'x', options: [] });
      expect(PermissionManager.getCurrentPermissionId()).toBe('perm_x');
    });
  });

  describe('getSelectedOptionId', () => {
    it('should return null initially', () => {
      expect(PermissionManager.getSelectedOptionId()).toBeNull();
    });

    it('should return the pre-selected first option after showPermissionModal', () => {
      PermissionManager.showPermissionModal({
        id: 'perm_1',
        scope: 'x',
        options: [{ optionId: 'first' }],
      });
      expect(PermissionManager.getSelectedOptionId()).toBe('first');
    });
  });
});
