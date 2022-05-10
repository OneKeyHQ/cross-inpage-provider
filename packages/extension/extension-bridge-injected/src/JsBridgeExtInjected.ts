/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { fakeDebugLogger, consts } from '@onekeyfe/cross-inpage-provider-core';

import {
  IJsBridgeConfig,
  IJsBridgeMessagePayload,
  IPostMessageEventData,
  IOptionsWithDebugLogger,
} from '@onekeyfe/cross-inpage-provider-types';

import {
  JsBridgeBase,
  injectedProviderReceiveHandler,
  injectJsBridge,
} from '@onekeyfe/cross-inpage-provider-core';

const { JS_BRIDGE_MESSAGE_DIRECTION, JS_BRIDGE_MESSAGE_EXT_CHANNEL } = consts;

function getOrCreateExtInjectedJsBridge(options: IJsBridgeConfig = {}): JsBridgeBase {
  // create ext bridge by default
  const bridgeCreator = () =>
    new JsBridgeExtInjected({
      ...options,
      receiveHandler: injectedProviderReceiveHandler,
    }) as unknown;
  const bridge = injectJsBridge(bridgeCreator);
  return bridge;
}

let postMessageListenerAdded = false;
export type ISetupPostMessageListenerOptions = IOptionsWithDebugLogger & {
  bridge?: JsBridgeBase;
};
function setupPostMessageListener(options: ISetupPostMessageListenerOptions = {}) {
  const debugLogger = options.debugLogger || fakeDebugLogger;
  if (postMessageListenerAdded) {
    return;
  }
  postMessageListenerAdded = true;
  // - receive
  // #### content-script -> injected
  window.addEventListener(
    'message',
    (event: MessageEvent) => {
      // We only accept messages from ourselves
      if (event.source !== window) {
        return;
      }

      const eventData = event.data as IPostMessageEventData;
      // only accept extension messages
      if (
        eventData.channel === JS_BRIDGE_MESSAGE_EXT_CHANNEL &&
        eventData.direction === JS_BRIDGE_MESSAGE_DIRECTION.HOST_TO_INPAGE
      ) {
        debugLogger.extInjected('onWindowPostMessage', eventData);

        const payload = eventData.payload as IJsBridgeMessagePayload;
        const jsBridge = options.bridge ?? (window?.$onekey?.jsBridge as JsBridgeBase);
        if (jsBridge) {
          jsBridge.receive(payload);
        }
      }
    },
    false,
  );
}

class JsBridgeExtInjected extends JsBridgeBase {
  constructor(config: IJsBridgeConfig) {
    super(config);
    // receive message
    setupPostMessageListener({
      debugLogger: this.debugLogger,
      bridge: this,
    });
  }

  sendAsString = false;

  isInjected = true;

  // send message
  sendPayload(payloadObj: IJsBridgeMessagePayload | string) {
    window.postMessage({
      channel: JS_BRIDGE_MESSAGE_EXT_CHANNEL,
      direction: JS_BRIDGE_MESSAGE_DIRECTION.INPAGE_TO_HOST,
      payload: payloadObj,
    });
  }
}

export { JsBridgeExtInjected, getOrCreateExtInjectedJsBridge };
