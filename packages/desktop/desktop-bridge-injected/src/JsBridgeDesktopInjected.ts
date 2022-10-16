import { ipcRenderer } from 'electron';

import {
  appDebugLogger as debugLogger,
  JsBridgeBase,
  consts,
} from '@onekeyfe/cross-inpage-provider-core';

import { IJsBridgeConfig, IJsBridgeMessagePayload } from '@onekeyfe/cross-inpage-provider-types';

class JsBridgeDesktopInjected extends JsBridgeBase {
  constructor(config: IJsBridgeConfig) {
    super(config);
    ipcRenderer.on('JsBridgeDesktopHostToInjected', (event, data) => {
      // console.log('JsBridgeDesktopInjected', event, data);

      // window.$onekey.jsBridge.receive
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      window?.$onekey?.jsBridge?.receive?.(data);
    });
  }

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
