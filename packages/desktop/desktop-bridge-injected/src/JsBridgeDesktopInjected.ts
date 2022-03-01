import { ipcRenderer } from 'electron';

import {
  appDebugLogger as debugLogger,
  JsBridgeBase,
  consts,
} from '@onekeyfe/cross-inpage-provider-core';

import { IJsBridgeMessagePayload } from '@onekeyfe/cross-inpage-provider-types';

class JsBridgeDesktopInjected extends JsBridgeBase {
  sendAsString = true;

  isInjected = true;

  sendPayload(payload: IJsBridgeMessagePayload | string) {
    // send to renderer (webview host)
    ipcRenderer.sendToHost(consts.JS_BRIDGE_MESSAGE_IPC_CHANNEL, payload);
    debugLogger.desktopInjected(
      'ipcRenderer.sendToHost',
      consts.JS_BRIDGE_MESSAGE_IPC_CHANNEL,
      payload,
    );

    // send to main
    // ipcRenderer.send(JS_BRIDGE_MESSAGE_IPC_CHANNEL, payloadStr);
  }
}

export { JsBridgeDesktopInjected };
