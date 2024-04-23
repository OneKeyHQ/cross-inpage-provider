import {
  consts,
  isLegacyExtMessage,
  appDebugLogger,
  injectedFactory,
} from '@onekeyfe/cross-inpage-provider-core';
import {
  IPostMessageEventData,
  IOptionsWithDebugLogger,
} from '@onekeyfe/cross-inpage-provider-types';

import messagePort from '../extensionMessagePort';
import { commonLogger } from '@onekeyfe/cross-inpage-provider-core';

const { EXT_PORT_CS_TO_BG, JS_BRIDGE_MESSAGE_DIRECTION, JS_BRIDGE_MESSAGE_EXT_CHANNEL } = consts;

// TODO one-time only
function inject({
  file,
  code,
  remove = true,
}: {
  file?: string;
  code?: string;
  remove?: boolean;
}) {
  // Manifest V2 Only
  if (code) {
    injectedFactory.injectCodeWithScriptTag({
      code,
      remove,
    });
  }

  // Manifest V3 & V2
  if (file) {
    injectedFactory.injectCodeWithScriptTag({
      file: chrome.runtime.getURL(file),
      remove,
    });
  }
}

// TODO one-time only
function setupMessagePort(options: IOptionsWithDebugLogger = {}) {
  const debugLogger = options.debugLogger || appDebugLogger;
  messagePort.connect({
    name: EXT_PORT_CS_TO_BG,
    // #### background -> content-script
    onMessage(payload: unknown) {
      // ignore legacy Ext publicConfig message
      if (isLegacyExtMessage(payload)) {
        return;
      }
      // #### content-script -> injected
      window.postMessage({
        channel: JS_BRIDGE_MESSAGE_EXT_CHANNEL,
        direction: JS_BRIDGE_MESSAGE_DIRECTION.HOST_TO_INPAGE,
        payload,
      });
    },
    onConnect(port) {
      // #### injected -> content-script
      const onWindowPostMessage = (event: MessageEvent) => {
        // We only accept messages from ourselves
        if (event.source !== window) {
          return;
        }
        const eventData = event.data as IPostMessageEventData;
        // only accept extension messages
        if (
          eventData.channel === JS_BRIDGE_MESSAGE_EXT_CHANNEL &&
          eventData.direction === JS_BRIDGE_MESSAGE_DIRECTION.INPAGE_TO_HOST
        ) {
          debugLogger.extContentScripts('onWindowPostMessage', event.data);
          // #### content-script -> background
          port.postMessage(eventData.payload);
        }
      };
      window.addEventListener('message', onWindowPostMessage, false);
      return () => {
        commonLogger.error(
          'ONEKEY: lost connection to hosted bridge. You should reload page to establish a new connection.',
        );
        window.dispatchEvent(new Event('onekey_bridge_disconnect'));
        window.removeEventListener('message', onWindowPostMessage, false);
      };
    },
  });
}

//  -> inpage -> dapp injected jsBridge -> bridge.request()
//      -> window.postMessage
//  -> contentScript -> on message -> chrome.runtime.connect port
//      -> port.postMessage
//  -> background -> createJsBridgeHost -> chrome.runtime.onConnect.addListener -> bridge.receive()
//      -> port.postMessage
//  -> ui -> createJsBridgeInpage -> chrome.runtime.connect port -> bridge.receive()

export default {
  inject,
  setupMessagePort,
};
