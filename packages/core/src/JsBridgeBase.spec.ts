jest.mock('lodash-es', () => require('lodash'));

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
