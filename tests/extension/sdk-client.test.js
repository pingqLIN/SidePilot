import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import * as SDKClient from '../../extension/js/sdk-client.js';

function createMockResponse({ ok = true, status = 200, jsonData = null, textData = '', contentType = 'application/json' } = {}) {
  return {
    ok,
    status,
    headers: {
      get(name) {
        if (String(name).toLowerCase() === 'content-type') {
          return contentType;
        }
        return null;
      }
    },
    async json() {
      return jsonData;
    },
    async text() {
      return textData;
    }
  };
}

describe('SDK Client Module', () => {
  beforeEach(() => {
    SDKClient.cleanup();
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    global.fetch = jest.fn();
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

  it('recreates the session once when the backend reports a stale provider/auth error', async () => {
    global.fetch
      .mockResolvedValueOnce(createMockResponse({
        jsonData: {
          status: 'ok',
          service: 'sidepilot-copilot-bridge'
        }
      }))
      .mockResolvedValueOnce(createMockResponse({
        jsonData: {
          success: true,
          sessionId: 'sess-1'
        }
      }))
      .mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 500,
        jsonData: {
          error: 'API Key not found. Please pass a valid API key.'
        }
      }))
      .mockResolvedValueOnce(createMockResponse({
        jsonData: {
          success: true
        }
      }))
      .mockResolvedValueOnce(createMockResponse({
        jsonData: {
          success: true,
          sessionId: 'sess-2'
        }
      }))
      .mockResolvedValueOnce(createMockResponse({
        jsonData: {
          success: true,
          sessionId: 'sess-2',
          content: 'Recovered reply'
        }
      }));

    await SDKClient.connect();
    const result = await SDKClient.sendMessage({
      content: 'hello after provider reset',
      model: 'claude-opus-4.6'
    });

    expect(result.content).toBe('Recovered reply');
    expect(result.sessionId).toBe('sess-2');
    expect(global.fetch).toHaveBeenCalledTimes(6);
    expect(global.fetch.mock.calls[1][0]).toContain('/api/sessions');
    expect(global.fetch.mock.calls[2][0]).toContain('/api/chat/sync');
    expect(global.fetch.mock.calls[3][0]).toContain('/api/sessions/sess-1');
    expect(global.fetch.mock.calls[4][0]).toContain('/api/sessions');
    expect(global.fetch.mock.calls[5][0]).toContain('/api/chat/sync');
  });
});
