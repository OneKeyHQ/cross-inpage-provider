/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import {
  IJsBridgeConfig,
  IJsBridgeMessagePayload,
  IPostMessageEventData,
  IOptionsWithDebugLogger,
} from '@onekeyfe/cross-inpage-provider-types';
import { JsBridgeBase } from './JsBridgeBase';
import { fakeDebugLogger } from './index';

let postMessageListenerAdded = false;
export type ISetupPostMessageListenerOptions = IOptionsWithDebugLogger & {
  bridge?: JsBridgeIframe;
};

export type IPostMessageEventDataIframe = IPostMessageEventData & {
  frameName: string;
};
function setupPostMessageListener(options: ISetupPostMessageListenerOptions = {}) {
  const debugLogger = options.debugLogger || fakeDebugLogger;
  if (postMessageListenerAdded) {
    return;
  }
  postMessageListenerAdded = true;
  // - receive
  window.addEventListener(
    'message',
    (event: MessageEvent) => {
      // TODO source whitelist
      if (event.source !== window) {
        // return;
      }

      const eventData = event.data as IPostMessageEventDataIframe;
      const config = options.bridge?.bridgeConfig;
      if (
        config &&
        eventData.channel === config.channel &&
        eventData.frameName === config.remoteFrameName
      ) {
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

export type IJsBridgeIframeConfig = IJsBridgeConfig & {
  remoteFrame: Window;
  selfFrameName: string;
  remoteFrameName: string;
  channel: string;
};
class JsBridgeIframe extends JsBridgeBase {
  constructor(config: IJsBridgeIframeConfig) {
    super(config);
    this.bridgeConfig = config;
    // receive message
    setupPostMessageListener({
      debugLogger: this.debugLogger,
      bridge: this,
    });
  }

  bridgeConfig: IJsBridgeIframeConfig;

  sendAsString = false;

  isInjected = true;

  // send message
  sendPayload(payloadObj: IJsBridgeMessagePayload | string) {
    const eventData: IPostMessageEventDataIframe = {
      channel: this.bridgeConfig.channel,
      frameName: this.bridgeConfig.selfFrameName,
      payload: payloadObj,
      direction: '',
    };
    this.bridgeConfig.remoteFrame.postMessage(eventData);
  }
}

export { JsBridgeIframe };
