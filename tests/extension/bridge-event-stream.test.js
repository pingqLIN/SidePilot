import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { TextDecoder, TextEncoder } from 'node:util';
import { ReadableStream } from 'node:stream/web';
import '../../extension/js/bridge-event-stream.js';

function createReadableEventStream(chunks) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      chunks.forEach((chunk) => {
        controller.enqueue(encoder.encode(chunk));
      });
      controller.close();
    }
  });
}

describe('Bridge Event Stream Helper', () => {
  const helper = globalThis.SidePilotBridgeEventStream;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    global.TextDecoder = TextDecoder;
  });

  afterEach(() => {
    delete global.fetch;
    delete global.TextDecoder;
  });

  it('streams SSE messages with authenticated headers instead of query parameters', async () => {
    const events = [];

    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      body: createReadableEventStream([
        'data: {"connected":true}\n\n',
        'event: permission_required\ndata: {"id":"perm-1"}\n\n'
      ])
    });

    await new Promise((resolve, reject) => {
      const stream = helper.createAuthenticatedEventSource({
        reconnectDelayMs: 0,
        getRequest: async () => ({
          url: 'http://localhost:31031/api/permissions/stream',
          headers: {
            'X-SidePilot-Token': 'bridge-token',
            'X-SidePilot-Extension-Id': 'abcdefghijklmnopabcdefghijklmnop',
          }
        })
      });

      stream.addEventListener('permission_required', (event) => {
        try {
          events.push(JSON.parse(event.data));
          stream.close();
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });

    expect(events).toEqual([{ id: 'perm-1' }]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch.mock.calls[0][0]).toBe('http://localhost:31031/api/permissions/stream');
    expect(global.fetch.mock.calls[0][1].headers).toMatchObject({
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-SidePilot-Token': 'bridge-token',
      'X-SidePilot-Extension-Id': 'abcdefghijklmnopabcdefghijklmnop',
    });
  });

  it('reconnects after an authentication failure and requests fresh headers', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        body: null,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: createReadableEventStream([
          'data: {"connected":true}\n\n',
          'data: {"level":"info","message":"ready"}\n\n'
        ])
      });

    const attempts = [];

    await new Promise((resolve, reject) => {
      const stream = helper.createAuthenticatedEventSource({
        reconnectDelayMs: 0,
        getRequest: async ({ attempt, previousError }) => {
          attempts.push({
            attempt,
            previousError: previousError?.message || null,
          });

          return {
            url: 'http://localhost:31031/api/logs/stream',
            headers: {
              'X-SidePilot-Token': attempt === 0 ? 'stale-token' : 'fresh-token',
            }
          };
        }
      });

      stream.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.connected) {
            return;
          }
          expect(payload.message).toBe('ready');
          stream.close();
          resolve();
        } catch (err) {
          reject(err);
        }
      };
    });

    expect(attempts).toEqual([
      { attempt: 0, previousError: null },
      { attempt: 1, previousError: 'Stream request failed (401)' },
    ]);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch.mock.calls[0][1].headers['X-SidePilot-Token']).toBe('stale-token');
    expect(global.fetch.mock.calls[1][1].headers['X-SidePilot-Token']).toBe('fresh-token');
  });
});
