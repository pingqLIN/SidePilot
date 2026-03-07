import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as ModeManager from '../../extension/js/mode-manager.js';

describe('Mode Manager Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    ModeManager.cleanup();
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

  it('should return only null, sdk, or iframe from getActiveMode', async () => {
    // Before setMode is called the value must be null
    expect(ModeManager.getActiveMode()).toBeNull();
    // After setting each valid mode, getActiveMode must reflect it
    await ModeManager.setMode('sdk');
    expect(ModeManager.getActiveMode()).toBe('sdk');
    await ModeManager.setMode('iframe');
    expect(ModeManager.getActiveMode()).toBe('iframe');
  });
});
