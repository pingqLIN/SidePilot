import * as VSCodeConnector from '../../js/vscode-connector.js';

describe('VSCode Connector Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export init function', () => {
    expect(typeof VSCodeConnector.init).toBe('function');
  });

  it('should export sendToVSCode function', () => {
    expect(typeof VSCodeConnector.sendToVSCode).toBe('function');
  });

  it('should export formatForVSCode function', () => {
    expect(typeof VSCodeConnector.formatForVSCode).toBe('function');
  });

  it('should export getStatus function', () => {
    expect(typeof VSCodeConnector.getStatus).toBe('function');
  });

  it('should export isVSCodeAvailable function', () => {
    expect(typeof VSCodeConnector.isVSCodeAvailable).toBe('function');
  });

  describe('formatForVSCode', () => {
    it('should return null for null entry', () => {
      const result = VSCodeConnector.formatForVSCode(null);
      expect(result).toBeNull();
    });

    it('should include required fields in formatted entry', () => {
      const entry = {
        id: 'test-1',
        type: 'task',
        title: 'Test Task',
        content: 'Test Content',
        createdAt: Date.now()
      };
      const result = VSCodeConnector.formatForVSCode(entry);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('source', 'sidepilot-extension');
    });
  });

  describe('isVSCodeAvailable', () => {
    it('should return a boolean promise', async () => {
      const result = await VSCodeConnector.isVSCodeAvailable();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getStatus', () => {
    it('should return status object', () => {
      const status = VSCodeConnector.getStatus();
      expect(status).toHaveProperty('initialized');
      expect(typeof status.initialized).toBe('boolean');
    });
  });
});
