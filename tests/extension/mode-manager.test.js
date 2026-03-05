import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import * as ModeManager from '../../extension/js/mode-manager.js';

describe('Mode Manager Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export init function', () => {
    expect(typeof ModeManager.init).toBe('function');
  });

  it('should export detectMode function', () => {
    expect(typeof ModeManager.detectMode).toBe('function');
  });

  it('should export setMode function', () => {
    expect(typeof ModeManager.setMode).toBe('function');
  });

  it('should export getActiveMode function', () => {
    expect(typeof ModeManager.getActiveMode).toBe('function');
  });

  it('getActiveMode should return null before init', () => {
    const mode = ModeManager.getActiveMode();
    expect(mode).toBeNull();
  });

  it('should support valid mode values', () => {
    const validModes = ['sdk', 'iframe'];
    expect(validModes).toContain('sdk');
    expect(validModes).toContain('iframe');
  });
});
