import * as ModeManager from '../../js/mode-manager.js';

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

  it('getActiveMode should return a string', () => {
    const mode = ModeManager.getActiveMode();
    expect(typeof mode).toBe('string');
  });

  it('should support valid mode values', () => {
    const mode = ModeManager.getActiveMode();
    const validModes = ['copilot', 'advanced', 'rules', 'memory', 'automation'];
    expect(validModes).toContain(expect.anything());
  });
});
