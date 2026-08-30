jest.mock('lodash-es', () => require('lodash'));

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

  test('falls back, clears the callback, and ignores a duplicate response', async () => {
    jest.spyOn(providerErrors, 'toNativeErrorObject').mockImplementationOnce(() => {
      throw new Error('Error reconstruction failed');
    });
    const bridge = new TestBridge({ timeout: 1000 });
    const rejectCallbackSpy = jest.spyOn(bridge, 'rejectCallback');
    const clearCallbackSpy = jest.spyOn(bridge, 'clearCallbackCache');
    const requestPromise = bridge.request({ data: { method: 'test_method' } });
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

    await expect(requestPromise).rejects.toMatchObject({
      message: 'Original remote message',
    });
    expect(rejectCallbackSpy).toHaveBeenCalledTimes(1);
    expect(clearCallbackSpy).toHaveBeenCalledTimes(1);
  });
});
