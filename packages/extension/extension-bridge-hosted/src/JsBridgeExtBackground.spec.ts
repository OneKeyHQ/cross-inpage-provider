import { consts } from '@onekeyfe/cross-inpage-provider-core';

import { JsBridgeExtBackground } from './JsBridgeExtBackground';

const { EXT_PORT_CS_TO_BG, EXT_PORT_OFFSCREEN_TO_BG } = consts;

type IPortMessageListener = (payload: unknown, port: chrome.runtime.Port) => void;

function createPort(name: string, origin: string) {
  const messageListeners: IPortMessageListener[] = [];
  const port = {
    name,
    sender: { origin, url: `${origin}/` },
    postMessage: jest.fn(),
    onMessage: {
      addListener: (listener: IPortMessageListener) => messageListeners.push(listener),
      removeListener: jest.fn(),
    },
    onDisconnect: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  } as unknown as chrome.runtime.Port;
  const emit = (payload: unknown) => {
    messageListeners.forEach((listener) => listener(payload, port));
  };
  return { port, emit };
}

describe('JsBridgeExtBackground offscreen requests', () => {
  let connectListeners: Array<(port: chrome.runtime.Port) => void> = [];

  beforeEach(() => {
    jest.useFakeTimers();
    connectListeners = [];
    (globalThis as { chrome?: unknown }).chrome = {
      runtime: {
        onConnect: {
          addListener: (listener: (port: chrome.runtime.Port) => void) =>
            connectListeners.push(listener),
        },
      },
    };
  });

  afterEach(() => {
    delete (globalThis as { chrome?: unknown }).chrome;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('settles an offscreen request only with the offscreen response', async () => {
    const bridge = new JsBridgeExtBackground({ timeout: 1000 });
    const offscreen = createPort(EXT_PORT_OFFSCREEN_TO_BG, 'chrome-extension://wallet');
    const contentScript = createPort(EXT_PORT_CS_TO_BG, 'https://dapp.example');
    connectListeners.forEach((listener) => {
      listener(offscreen.port);
      listener(contentScript.port);
    });

    const promise = bridge.requestToOffscreen({ method: 'offscreen_method' });
    const postMessage = offscreen.port.postMessage as jest.Mock;
    const request = postMessage.mock.calls[0][0] as { id: number };

    contentScript.emit({ id: request.id, type: 'RESPONSE', scope: 'ethereum', data: 'dapp' });
    offscreen.emit({ id: request.id, type: 'RESPONSE', data: 'offscreen' });

    await expect(promise).resolves.toBe('offscreen');
  });
});
