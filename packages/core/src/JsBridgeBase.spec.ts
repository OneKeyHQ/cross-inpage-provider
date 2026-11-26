import * as providerErrors from '../../errors/src';

import { JsBridgeBase } from './JsBridgeBase';

class TestBridge extends JsBridgeBase {
  isInjected = true;

  lastPayload: any = null;

  sendPayload(payload: any): void {
    this.lastPayload = payload;
  }
}

describe('JsBridgeBase callback timeout lifecycle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('does not start callback-expire timer in constructor when idle', () => {
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');

    void new TestBridge({ timeout: 50 });

    expect(setTimeoutSpy).not.toHaveBeenCalled();
  });

  test('rejects pending callback by sweep timeout', async () => {
    const bridge = new TestBridge({ timeout: 50 });
    const requestPromise = bridge.request({
      data: {
        method: 'eth_chainId',
      },
    });

    expect(requestPromise).toBeDefined();

    jest.advanceTimersByTime(120);
    await Promise.resolve();

    await expect(requestPromise).rejects.toMatchObject({
      code: expect.any(Number),
    });
  });

  test('clears sweep timer when callback resolves', async () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const bridge = new TestBridge({ timeout: 1000 });
    const requestPromise = bridge.request({
      data: {
        method: 'eth_chainId',
      },
    });

    const requestPayload = JSON.parse(String(bridge.lastPayload));
    bridge.receive(
      {
        id: requestPayload.id,
        type: 'RESPONSE',
        data: { ok: true },
      },
      {
        origin: 'https://example.com',
        internal: true,
      },
    );

    await expect(requestPromise).resolves.toEqual({ ok: true });
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
  });

  test('keeps only one recursive sweep timer for multiple pending callbacks', () => {
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    const bridge = new TestBridge({ timeout: 1000 });
    void bridge.request({
      data: {
        method: 'eth_chainId',
      },
    });
    void bridge.request({
      data: {
        method: 'eth_accounts',
      },
    });

    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
  });
});

describe('JsBridgeBase response error lifecycle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('reconstructs an Error and preserves serialized metadata', async () => {
    const bridge = new TestBridge({ timeout: 1000 });
    const requestPromise = bridge.request({ data: { method: 'test_method' } });
    const requestPayload = JSON.parse(String(bridge.lastPayload));

    bridge.receive(
      {
        id: requestPayload.id,
        type: 'RESPONSE',
        error: {
          constructorName: 'OneKeyLocalError',
          name: 'OneKeyLocalError',
          message: 'Remote failure',
          code: 'REMOTE_FAILURE',
          className: 'OneKeyLocalError',
          autoToast: true,
        },
      },
      { origin: 'https://example.com', internal: true },
    );

    await expect(requestPromise).rejects.toMatchObject({
      constructorName: 'OneKeyLocalError',
      name: 'OneKeyLocalError',
      message: 'Remote failure',
      code: 'REMOTE_FAILURE',
      className: 'OneKeyLocalError',
      autoToast: true,
    });
  });

  test('rejects when one serialized metadata field cannot be restored', async () => {
    const originalDescriptor = Object.getOwnPropertyDescriptor(Error.prototype, 'constructorName');
    Object.defineProperty(Error.prototype, 'constructorName', {
      configurable: true,
      value: 'NativeError',
      writable: false,
    });

    try {
      const bridge = new TestBridge({ timeout: 1000 });
      const requestPromise = bridge.request({ data: { method: 'test_method' } });
      const requestPayload = JSON.parse(String(bridge.lastPayload));

      bridge.receive(
        {
          id: requestPayload.id,
          type: 'RESPONSE',
          error: {
            constructorName: 'OneKeyLocalError',
            message: 'Remote failure with protected metadata',
            className: 'OneKeyLocalError',
          },
        },
        { origin: 'https://example.com', internal: true },
      );

      await expect(requestPromise).rejects.toMatchObject({
        message: 'Remote failure with protected metadata',
        className: 'OneKeyLocalError',
      });
    } finally {
      if (originalDescriptor) {
        Object.defineProperty(Error.prototype, 'constructorName', originalDescriptor);
      } else {
        delete (Error.prototype as Error & { constructorName?: string }).constructorName;
      }
    }
  });

  test('keeps the native Error prototype when metadata contains unsafe keys', async () => {
    const bridge = new TestBridge({ timeout: 1000 });
    const requestPromise = bridge.request({ data: { method: 'test_method' } });
    if (!requestPromise) {
      throw new Error('Expected an asynchronous bridge request');
    }
    const rejectionPromise = requestPromise.catch((error: unknown) => error);
    const requestPayload = JSON.parse(String(bridge.lastPayload));
    const serializedError = JSON.parse(`{
      "message": "Remote failure with unsafe metadata",
      "className": "OneKeyLocalError",
      "__proto__": { "polluted": true },
      "constructor": { "name": "FakeError" },
      "prototype": { "polluted": true }
    }`);

    bridge.receive(
      {
        id: requestPayload.id,
        type: 'RESPONSE',
        error: serializedError,
      },
      { origin: 'https://example.com', internal: true },
    );

    const rejectedError = await rejectionPromise;
    expect(rejectedError).toBeInstanceOf(Error);
    expect(Object.getPrototypeOf(rejectedError)).toBe(Error.prototype);
    expect(rejectedError).toMatchObject({
      message: 'Remote failure with unsafe metadata',
      className: 'OneKeyLocalError',
    });
    expect(Object.prototype.hasOwnProperty.call(rejectedError, '__proto__')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(rejectedError, 'constructor')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(rejectedError, 'prototype')).toBe(false);
  });

  test('falls back, clears the callback, and ignores a duplicate response', async () => {
    const toNativeErrorObjectSpy = jest
      .spyOn(providerErrors, 'toNativeErrorObject')
      .mockImplementationOnce(() => {
        throw new Error('Error reconstruction failed');
      });
    const bridge = new TestBridge({ timeout: 1000 });
    const rejectCallbackSpy = jest.spyOn(bridge, 'rejectCallback');
    const clearCallbackSpy = jest.spyOn(bridge, 'clearCallbackCache');
    const requestPromise = bridge.request({ data: { method: 'test_method' } });
    if (!requestPromise) {
      throw new Error('Expected an asynchronous bridge request');
    }
    const rejectionPromise = requestPromise.catch((error: unknown) => error);
    const requestPayload = JSON.parse(String(bridge.lastPayload));
    const response = {
      id: requestPayload.id,
      type: 'RESPONSE' as const,
      error: {
        message: 'Original remote message',
        constructorName: 'OneKeyLocalError',
      },
    };

    bridge.receive(response, { origin: 'https://example.com', internal: true });
    bridge.receive(response, { origin: 'https://example.com', internal: true });

    const rejectedError = await rejectionPromise;
    expect(toNativeErrorObjectSpy).toHaveBeenCalledTimes(1);
    expect(rejectedError).toBeInstanceOf(Error);
    expect(rejectedError).toMatchObject({
      message: 'Original remote message',
    });
    expect(Object.prototype.hasOwnProperty.call(rejectedError, 'constructorName')).toBe(
      false,
    );
    expect(rejectCallbackSpy).toHaveBeenCalledTimes(1);
    expect(clearCallbackSpy).toHaveBeenCalledTimes(1);
  });
});

describe('JsBridgeBase callback ids and response routing', () => {
  const internalSender = { origin: 'https://example.com', internal: true };

  function sendRequest(bridge: TestBridge, remoteId?: string) {
    const promise = bridge.request({ data: { method: 'test_method' }, remoteId });
    if (!promise) {
      throw new Error('Expected an asynchronous bridge request');
    }
    const payload = JSON.parse(String(bridge.lastPayload)) as { id: number };
    return { promise, id: payload.id };
  }

  function mockGetRandomValues(implementation: (values: Uint32Array) => void) {
    const getRandomValues = jest.fn((values: Uint32Array) => {
      implementation(values);
      return values;
    });
    const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: { getRandomValues },
    });
    const restore = () => {
      if (originalDescriptor) {
        Object.defineProperty(globalThis, 'crypto', originalDescriptor);
      } else {
        delete (globalThis as { crypto?: unknown }).crypto;
      }
    };
    return { getRandomValues, restore };
  }

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('uses unique, non-sequential callback ids', () => {
    const bridge = new TestBridge({ timeout: 1000 });
    const ids = Array.from({ length: 50 }, () => sendRequest(bridge).id);

    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => {
      expect(Number.isSafeInteger(id)).toBe(true);
      expect(id).toBeGreaterThan(0);
    });
    expect(ids.slice(1).every((id, index) => id === ids[index] + 1)).toBe(false);
    expect(Math.max(...ids)).toBeGreaterThan(2 ** 32);
  });

  test('draws callback ids from crypto.getRandomValues and skips zero or taken ids', () => {
    const draws = [
      [0, 0],
      [0x1fffff, 7],
      [0x1fffff, 7],
      [0, 9],
    ];
    const { getRandomValues, restore } = mockGetRandomValues((values) => {
      const [high, low] = draws.shift() ?? [1, 1];
      values[0] = high;
      values[1] = low;
    });
    try {
      const bridge = new TestBridge({ timeout: 1000 });

      expect(sendRequest(bridge).id).toBe(0x1fffff * 2 ** 32 + 7);
      expect(sendRequest(bridge).id).toBe(9);
      expect(getRandomValues).toHaveBeenCalledTimes(4);
    } finally {
      restore();
    }
  });

  test('still finds a free id when the random source keeps repeating', () => {
    const { restore } = mockGetRandomValues((values) => {
      values[0] = 0;
      values[1] = 0;
    });
    try {
      const bridge = new TestBridge({ timeout: 1000 });

      expect(sendRequest(bridge).id).toBe(1);
      expect(sendRequest(bridge).id).toBe(2);
    } finally {
      restore();
    }
  });

  test('settles a request sent to a remote only with a response from that remote', async () => {
    const bridge = new TestBridge({ timeout: 1000 });
    const { promise, id } = sendRequest(bridge, 'remote-a');
    const settled = jest.fn();
    promise.then(settled, settled);

    bridge.receive(
      { id, type: 'RESPONSE', scope: 'ethereum', remoteId: 'remote-b', data: 'other remote' },
      { origin: 'https://other.example', internal: false },
    );
    bridge.receive(
      { id, type: 'RESPONSE', remoteId: 'remote-b', error: { message: 'other remote' } },
      internalSender,
    );
    bridge.receive({ id, type: 'RESPONSE', data: 'no remote' }, internalSender);
    await Promise.resolve();
    expect(settled).not.toHaveBeenCalled();

    bridge.receive({ id, type: 'RESPONSE', remoteId: 'remote-a', data: 'ok' }, internalSender);
    await expect(promise).resolves.toBe('ok');
  });

  test('keeps requests without a remote answerable as before', async () => {
    const bridge = new TestBridge({ timeout: 1000 });
    const first = sendRequest(bridge);
    const second = sendRequest(bridge);

    bridge.receive(
      { id: first.id, type: 'RESPONSE', remoteId: 'any-remote', data: 'first' },
      internalSender,
    );
    bridge.receive(
      JSON.stringify({ id: String(second.id), type: 'RESPONSE', data: 'second' }),
      internalSender,
    );

    await expect(first.promise).resolves.toBe('first');
    await expect(second.promise).resolves.toBe('second');
  });

  test('ignores responses with ids that are not callback ids', async () => {
    const bridge = new TestBridge({ timeout: 50 });
    const { promise } = sendRequest(bridge);
    const rejection = promise.catch((error: unknown) => error);

    ['constructor', '__proto__', 'hasOwnProperty', 'length', '0', '-1', '1.5'].forEach((id) => {
      bridge.receive(JSON.stringify({ id, type: 'RESPONSE', data: 'unexpected' }), internalSender);
    });
    jest.advanceTimersByTime(120);

    await expect(rejection).resolves.toMatchObject({ code: expect.any(Number) });
  });
});
