import * as SDKClient from '../../js/sdk-client.js';

describe('SDK Client Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export init function', () => {
    expect(typeof SDKClient.init).toBe('function');
  });

  it('should export connect function', () => {
    expect(typeof SDKClient.connect).toBe('function');
  });

  it('should export disconnect function', () => {
    expect(typeof SDKClient.disconnect).toBe('function');
  });

  it('should export sendMessage function', () => {
    expect(typeof SDKClient.sendMessage).toBe('function');
  });

  it('should export getStatus function', () => {
    expect(typeof SDKClient.getStatus).toBe('function');
  });

  it('getStatus should return an object with connected property', () => {
    const status = SDKClient.getStatus();
    expect(status).toHaveProperty('connected');
  });
});
