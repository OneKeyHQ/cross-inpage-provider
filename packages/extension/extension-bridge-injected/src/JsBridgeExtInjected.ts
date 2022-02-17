/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { debugLogger, consts } from '@onekeyfe/cross-inpage-provider-core';

import {
  IJsBridgeConfig,
  IJsBridgeMessagePayload,
  IPostMessageEventData,
} from '@onekeyfe/cross-inpage-provider-types';

import {
  JsBridgeBase,
  injectedProviderReceiveHandler,
  injectJsBridge,
} from '@onekeyfe/cross-inpage-provider-core';

const { JS_BRIDGE_MESSAGE_DIRECTION, JS_BRIDGE_MESSAGE_EXT_CHANNEL } = consts;

function getOrCreateExtInjectedJsBridge(): JsBridgeBase {
  // create ext bridge by default
  const bridgeCreator = () =>
    new JsBridgeExtInjected({
      receiveHandler: injectedProviderReceiveHandler,
    }) as unknown;
  const bridge = injectJsBridge(bridgeCreator);
  return bridge;
}

class JsBridgeExtInjected extends JsBridgeBase {
  constructor(config: IJsBridgeConfig) {
    super(config);
    this.setupPostMessageListener();
  }

  sendAsString = false;

  isInjected = true;

  sendPayload(payloadObj: IJsBridgeMessagePayload | string) {
    window.postMessage({
      channel: JS_BRIDGE_MESSAGE_EXT_CHANNEL,
      direction: JS_BRIDGE_MESSAGE_DIRECTION.INPAGE_TO_HOST,
      payload: payloadObj,
    });
  }

  setupPostMessageListener() {
    // TODO off event
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
          debugLogger.extInjected('window on message', eventData);

          const payload = eventData.payload as IJsBridgeMessagePayload;
          const jsBridge = window?.$onekey?.jsBridge as JsBridgeBase;
          if (jsBridge) {
            jsBridge.receive(payload);
          }
        }
      },
      false
    );
  }
}

export { JsBridgeExtInjected, getOrCreateExtInjectedJsBridge };
