import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const packageDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const repositoryDirectory = path.resolve(packageDirectory, '../..');
const DEFAULT_ENDPOINT = 'http://127.0.0.1:9222';
export const DESKTOP_CDP_FETCH_TIMEOUT_MS = 10_000;
export const DESKTOP_CDP_CONNECT_TIMEOUT_MS = 10_000;
export const DESKTOP_CDP_COMMAND_TIMEOUT_MS = 10_000;

function normalizeTimeout(value, fallback, label) {
  const timeoutMs = value == null ? fallback : Number(value);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60_000) {
    throw new Error(`${label} must be an integer between 1 and 60000 ms`);
  }
  return timeoutMs;
}

function timeoutError(label, timeoutMs) {
  const error = new Error(`${label} timed out after ${String(timeoutMs)} ms`);
  error.code = 'ETIMEDOUT';
  return error;
}

function abortError(signal, label) {
  if (signal?.reason instanceof Error) return signal.reason;
  const error = new Error(`${label} was aborted`);
  error.code = 'ABORT_ERR';
  return error;
}

function addSocketListener(socket, event, listener, { once = false } = {}) {
  if (typeof socket.on === 'function') {
    const add = once && typeof socket.once === 'function' ? socket.once : socket.on;
    add.call(socket, event, listener);
    return () => {
      const remove = socket.off || socket.removeListener;
      remove?.call(socket, event, listener);
    };
  }
  socket.addEventListener(event, listener, { once });
  return () => socket.removeEventListener(event, listener);
}

export function normalizeDesktopCdpEndpoint(value) {
  const endpoint = new URL(value || DEFAULT_ENDPOINT);
  if (
    endpoint.protocol !== 'http:' ||
    !['127.0.0.1', 'localhost', '[::1]'].includes(endpoint.hostname)
  ) {
    throw new Error('Desktop CDP endpoint must use loopback HTTP');
  }
  endpoint.pathname = endpoint.pathname.replace(/\/$/u, '');
  endpoint.search = '';
  endpoint.hash = '';
  return endpoint.toString().replace(/\/$/u, '');
}

export function normalizeDesktopHostname(value) {
  try {
    return new URL(String(value || '').includes('://') ? value : `https://${value}`).hostname
      .toLowerCase()
      .replace(/^www\./u, '');
  } catch {
    return '';
  }
}

export function desktopHostnamesMatch(left, right) {
  const leftHostname = normalizeDesktopHostname(left);
  const rightHostname = normalizeDesktopHostname(right);
  return Boolean(
    leftHostname &&
      rightHostname &&
      (leftHostname === rightHostname ||
        leftHostname.endsWith(`.${rightHostname}`) ||
        rightHostname.endsWith(`.${leftHostname}`)),
  );
}

export async function loadDesktopWebSocket() {
  try {
    const require = createRequire(path.join(repositoryDirectory, 'package.json'));
    return require('ws');
  } catch {
    if (typeof globalThis.WebSocket === 'function') return globalThis.WebSocket;
    throw new Error('A WebSocket implementation is unavailable; install repository dependencies');
  }
}

export class DesktopCdpClient {
  constructor(WebSocketImplementation, url, options = {}) {
    this.nextId = 1;
    this.pending = new Map();
    this.socket = new WebSocketImplementation(url);
    this.connected = false;
    this.listenersInstalled = false;
    this.listenerCleanup = [];
    this.signal = options.signal;
    this.connectTimeoutMs = normalizeTimeout(
      options.connectTimeoutMs,
      DESKTOP_CDP_CONNECT_TIMEOUT_MS,
      'Desktop CDP WebSocket connection timeout',
    );
    this.commandTimeoutMs = normalizeTimeout(
      options.commandTimeoutMs,
      DESKTOP_CDP_COMMAND_TIMEOUT_MS,
      'Desktop CDP command timeout',
    );
  }

  installListeners() {
    if (this.listenersInstalled) return;
    const onMessage = (event) => {
      const raw = event?.data ?? event;
      let message;
      try {
        message = JSON.parse(raw.toString());
      } catch {
        return;
      }
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
    };
    const onClose = () => {
      const error = new Error('Desktop CDP target closed');
      for (const pending of this.pending.values()) pending.reject(error);
      this.connected = false;
      for (const cleanup of this.listenerCleanup.splice(0)) cleanup();
      this.listenersInstalled = false;
    };
    const onError = (error) => {
      const connectionError =
        error instanceof Error ? error : new Error('Desktop CDP WebSocket transport failed');
      for (const pending of this.pending.values()) pending.reject(connectionError);
    };
    this.listenerCleanup.push(
      addSocketListener(this.socket, 'message', onMessage),
      addSocketListener(this.socket, 'error', onError),
      addSocketListener(this.socket, 'close', onClose, { once: true }),
    );
    this.listenersInstalled = true;
  }

  async connect(options = {}) {
    if (this.connected) return;
    const signal = options.signal || this.signal;
    if (signal?.aborted) throw abortError(signal, 'Desktop CDP WebSocket connection');
    this.installListeners();
    if (this.socket.readyState === 1) {
      this.connected = true;
      return;
    }
    if (this.socket.readyState === 2 || this.socket.readyState === 3) {
      throw new Error('Desktop CDP WebSocket is closed');
    }
    const timeoutMs = normalizeTimeout(
      options.timeoutMs,
      this.connectTimeoutMs,
      'Desktop CDP WebSocket connection timeout',
    );
    try {
      await new Promise((resolve, reject) => {
        let settled = false;
        const finish = (callback, value) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          removeOpen();
          removeError();
          signal?.removeEventListener('abort', onAbort);
          callback(value);
        };
        const onOpen = () => finish(resolve);
        const onError = (error) =>
          finish(
            reject,
            error instanceof Error ? error : new Error('Desktop CDP WebSocket connection failed'),
          );
        const onAbort = () => finish(reject, abortError(signal, 'Desktop CDP WebSocket connection'));
        const removeOpen = addSocketListener(this.socket, 'open', onOpen, { once: true });
        const removeError = addSocketListener(this.socket, 'error', onError, { once: true });
        const timer = setTimeout(
          () => finish(reject, timeoutError('Desktop CDP WebSocket connection', timeoutMs)),
          timeoutMs,
        );
        signal?.addEventListener('abort', onAbort, { once: true });
      });
    } catch (error) {
      this.close();
      throw error;
    }
    this.connected = true;
  }

  send(method, params = {}, options = {}) {
    if (!this.connected || this.socket.readyState !== 1) {
      return Promise.reject(new Error('Desktop CDP WebSocket is not connected'));
    }
    const timeoutMs = normalizeTimeout(
      options.timeoutMs,
      this.commandTimeoutMs,
      'Desktop CDP command timeout',
    );
    const signal = options.signal || this.signal;
    if (signal?.aborted) {
      return Promise.reject(abortError(signal, `Desktop CDP command ${method}`));
    }
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      let settled = false;
      const finish = (callback, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        signal?.removeEventListener('abort', onAbort);
        this.pending.delete(id);
        callback(value);
      };
      const onAbort = () => finish(reject, abortError(signal, `Desktop CDP command ${method}`));
      const timer = setTimeout(
        () => finish(reject, timeoutError(`Desktop CDP command ${method}`, timeoutMs)),
        timeoutMs,
      );
      this.pending.set(id, {
        resolve: (value) => finish(resolve, value),
        reject: (error) => finish(reject, error),
      });
      signal?.addEventListener('abort', onAbort, { once: true });
      try {
        this.socket.send(JSON.stringify({ id, method, params }));
      } catch (error) {
        finish(reject, error);
      }
    });
  }

  async evaluate(expression, options = {}) {
    const response = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    }, options);
    if (response.exceptionDetails) {
      throw new Error(
        response.exceptionDetails.exception?.description ||
          response.exceptionDetails.text ||
          'Runtime evaluation failed',
      );
    }
    return response.result?.value;
  }

  close() {
    const error = new Error('Desktop CDP target closed');
    for (const pending of this.pending.values()) pending.reject(error);
    this.connected = false;
    for (const cleanup of this.listenerCleanup.splice(0)) cleanup();
    this.listenersInstalled = false;
    try {
      this.socket.close();
    } catch {
      // Closing an already failed transport is best effort.
    }
  }
}

export async function fetchDesktopCdpTargets(
  endpoint,
  fetchImplementation = globalThis.fetch,
  options = {},
) {
  const normalizedEndpoint = normalizeDesktopCdpEndpoint(endpoint);
  if (typeof fetchImplementation !== 'function') throw new Error('fetch is unavailable');
  const timeoutMs = normalizeTimeout(
    options.fetchTimeoutMs,
    DESKTOP_CDP_FETCH_TIMEOUT_MS,
    'Desktop CDP target discovery timeout',
  );
  const signal = options.signal;
  if (signal?.aborted) throw abortError(signal, 'Desktop CDP target discovery');
  const controller = new AbortController();
  let rejectAborted;
  const aborted = new Promise((_, reject) => {
    rejectAborted = reject;
  });
  const onAbort = () => {
    const error = abortError(signal, 'Desktop CDP target discovery');
    controller.abort(error);
    rejectAborted(error);
  };
  signal?.addEventListener('abort', onAbort, { once: true });
  let timer;
  let discoveryTimeoutError;
  try {
    const operation = Promise.resolve().then(async () => {
      const response = await fetchImplementation(`${normalizedEndpoint}/json/list`, {
        signal: controller.signal,
      });
      if (!response.ok) {
        const error = new Error(`OneKey Desktop CDP returned HTTP ${response.status}`);
        error.code = 'ERR_DESKTOP_CDP_HTTP';
        throw error;
      }
      return response.json();
    });
    const timedOut = new Promise((_, reject) => {
      timer = setTimeout(() => {
        const error = timeoutError('Desktop CDP target discovery', timeoutMs);
        discoveryTimeoutError = error;
        controller.abort(error);
        reject(error);
      }, timeoutMs);
    });
    return await Promise.race([operation, timedOut, aborted]);
  } catch (error) {
    if (discoveryTimeoutError) throw discoveryTimeoutError;
    if (error?.code === 'ETIMEDOUT' || error?.code === 'ERR_DESKTOP_CDP_HTTP') throw error;
    if (signal?.aborted) throw abortError(signal, 'Desktop CDP target discovery');
    throw new Error(
      `Cannot reach OneKey Desktop CDP at ${normalizedEndpoint}. Start Desktop with --remote-debugging-port=9222. ${error.message}`,
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

export function findOneKeyDesktopHostPage(targets) {
  const hostPages = targets.filter((target) => target.type === 'page');
  return (
    hostPages.find((target) => /onekey/iu.test(`${target.title || ''} ${target.url || ''}`)) ||
    hostPages.find((target) => /localhost|127\.0\.0\.1/iu.test(target.url || '')) ||
    null
  );
}

export async function withOneKeyDesktopHost(
  options,
  callback,
) {
  const endpoint = normalizeDesktopCdpEndpoint(options?.endpoint);
  const fetchImplementation = options?.fetchImplementation || globalThis.fetch;
  const WebSocketImplementation =
    options?.WebSocketImplementation || (await loadDesktopWebSocket());
  const targets = await fetchDesktopCdpTargets(endpoint, fetchImplementation, options);
  const host = findOneKeyDesktopHostPage(targets);
  if (!host?.webSocketDebuggerUrl) {
    throw new Error('No OneKey Desktop host page CDP target was found');
  }
  const client = new DesktopCdpClient(WebSocketImplementation, host.webSocketDebuggerUrl, options);
  await client.connect();
  try {
    return await callback({ client, endpoint, host, targets });
  } finally {
    client.close();
  }
}
