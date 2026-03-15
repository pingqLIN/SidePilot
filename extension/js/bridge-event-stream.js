"use strict";

// ============================================
// Bridge Event Stream Helper
// ============================================

const READY_STATE_CONNECTING = 0;
const READY_STATE_OPEN = 1;
const READY_STATE_CLOSED = 2;
const DEFAULT_RECONNECT_DELAY_MS = 1000;

function buildStreamErrorEvent(error) {
  const normalizedError =
    error instanceof Error ? error : new Error(String(error || "unknown error"));

  return {
    type: "error",
    error: normalizedError,
    message: normalizedError.message,
  };
}

function emitEvent(source, listeners, type, event) {
  const handlerName =
    type === "open" ? "onopen" : type === "error" ? "onerror" : "onmessage";
  const handler = source[handlerName];
  if (typeof handler === "function") {
    try {
      handler(event);
    } catch (err) {
      console.error("[BridgeEventStream] Listener error:", err);
    }
  }

  const registered = listeners.get(type);
  if (!registered || registered.size === 0) return;

  for (const listener of registered) {
    try {
      listener(event);
    } catch (err) {
      console.error("[BridgeEventStream] Event listener error:", err);
    }
  }
}

async function consumeEventStream(body, onEvent) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let eventType = "message";
  let dataLines = [];

  const flushEvent = () => {
    if (dataLines.length === 0) {
      eventType = "message";
      return;
    }

    onEvent({
      type: eventType || "message",
      data: dataLines.join("\n"),
    });

    eventType = "message";
    dataLines = [];
  };

  const processBuffer = () => {
    let newlineIndex = buffer.indexOf("\n");
    while (newlineIndex !== -1) {
      const rawLine = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);

      const line = rawLine.endsWith("\r")
        ? rawLine.slice(0, -1)
        : rawLine;

      if (line === "") {
        flushEvent();
        newlineIndex = buffer.indexOf("\n");
        continue;
      }

      if (line.startsWith(":")) {
        newlineIndex = buffer.indexOf("\n");
        continue;
      }

      const separatorIndex = line.indexOf(":");
      const field =
        separatorIndex === -1 ? line : line.slice(0, separatorIndex);
      let value =
        separatorIndex === -1 ? "" : line.slice(separatorIndex + 1);

      if (value.startsWith(" ")) {
        value = value.slice(1);
      }

      if (field === "event") {
        eventType = value || "message";
      } else if (field === "data") {
        dataLines.push(value);
      }

      newlineIndex = buffer.indexOf("\n");
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    processBuffer();
  }

  buffer += decoder.decode();
  if (buffer) {
    buffer += "\n";
    processBuffer();
  }
  flushEvent();
}

/**
 * Create an EventSource-like stream backed by fetch(), allowing custom headers.
 * @param {{
 *   getRequest: ({ attempt: number, previousError: Error|null }) => Promise<{ url: string, headers?: Record<string, string> }>,
 *   fetchImpl?: typeof fetch,
 *   reconnectDelayMs?: number
 * }} options
 * @returns {{
 *   CONNECTING: number,
 *   OPEN: number,
 *   CLOSED: number,
 *   readyState: number,
 *   onopen: ((event: { type: "open" }) => void)|null,
 *   onmessage: ((event: { type: string, data: string }) => void)|null,
 *   onerror: ((event: { type: "error", error: Error, message: string }) => void)|null,
 *   addEventListener: (type: string, listener: Function) => void,
 *   removeEventListener: (type: string, listener: Function) => void,
 *   close: () => void
 * }}
 */
function createAuthenticatedEventSource(options = {}) {
  if (typeof options.getRequest !== "function") {
    throw new Error("getRequest is required");
  }

  const fetchImpl = options.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== "function") {
    throw new Error("fetch is required");
  }

  const reconnectDelayMs = Math.max(
    0,
    Number(options.reconnectDelayMs) || DEFAULT_RECONNECT_DELAY_MS,
  );
  const listeners = new Map();

  let closed = false;
  let connectAttempt = 0;
  let previousError = null;
  let reconnectTimer = null;
  let activeController = null;

  const source = {
    CONNECTING: READY_STATE_CONNECTING,
    OPEN: READY_STATE_OPEN,
    CLOSED: READY_STATE_CLOSED,
    readyState: READY_STATE_CONNECTING,
    onopen: null,
    onmessage: null,
    onerror: null,
    addEventListener(type, listener) {
      if (typeof listener !== "function") return;
      const key = String(type || "message");
      if (!listeners.has(key)) {
        listeners.set(key, new Set());
      }
      listeners.get(key).add(listener);
    },
    removeEventListener(type, listener) {
      const key = String(type || "message");
      listeners.get(key)?.delete(listener);
    },
    close() {
      closed = true;
      source.readyState = READY_STATE_CLOSED;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (activeController) {
        activeController.abort();
        activeController = null;
      }
    },
  };

  const scheduleReconnect = (error) => {
    if (closed) return;

    previousError = error instanceof Error ? error : new Error(String(error || "stream error"));
    source.readyState = READY_STATE_CONNECTING;
    connectAttempt += 1;

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      void connect();
    }, reconnectDelayMs);
  };

  const connect = async () => {
    if (closed) return;

    let request;
    try {
      request = await options.getRequest({
        attempt: connectAttempt,
        previousError,
      });
    } catch (err) {
      const errorEvent = buildStreamErrorEvent(err);
      emitEvent(source, listeners, "error", errorEvent);
      scheduleReconnect(errorEvent.error);
      return;
    }

    if (
      !request ||
      typeof request.url !== "string" ||
      request.url.trim() === ""
    ) {
      const errorEvent = buildStreamErrorEvent("stream request url is required");
      emitEvent(source, listeners, "error", errorEvent);
      scheduleReconnect(errorEvent.error);
      return;
    }

    const controller = new AbortController();
    activeController = controller;

    try {
      const response = await fetchImpl(request.url, {
        method: "GET",
        headers: {
          Accept: "text/event-stream",
          "Cache-Control": "no-cache",
          ...(request.headers || {}),
        },
        signal: controller.signal,
        cache: "no-store",
      });

      if (!response.ok || !response.body) {
        throw new Error(`Stream request failed (${response.status})`);
      }

      connectAttempt = 0;
      previousError = null;
      source.readyState = READY_STATE_OPEN;
      emitEvent(source, listeners, "open", { type: "open" });

      await consumeEventStream(response.body, (event) => {
        emitEvent(source, listeners, event.type, event);
      });

      if (!closed && !controller.signal.aborted) {
        throw new Error("Stream connection closed");
      }
    } catch (err) {
      if (closed || controller.signal.aborted) {
        return;
      }

      const errorEvent = buildStreamErrorEvent(err);
      emitEvent(source, listeners, "error", errorEvent);
      scheduleReconnect(errorEvent.error);
    } finally {
      if (activeController === controller) {
        activeController = null;
      }
    }
  };

  void connect();

  return source;
}

globalThis.SidePilotBridgeEventStream = Object.freeze({
  createAuthenticatedEventSource,
});
