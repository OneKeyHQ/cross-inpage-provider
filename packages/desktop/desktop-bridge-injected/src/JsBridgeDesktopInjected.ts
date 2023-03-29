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

    // 这段代码将Webview中的alert()、confirm()和prompt()方法覆盖为自定义的函数，
    // 并使用Electron的ipcRenderer模块将事件发送给主进程进行处理。
    // alert()函数仅发送消息，而confirm()和prompt()函数通过ipcRenderer.sendSync()方法发送消息，
    // 并等待主进程返回结果。
    window.alert = function (message) {
      ipcRenderer.send('webview_alert', message);
    };

    window.confirm = function (message) {
      return ipcRenderer.sendSync('webview_confirm', message);
    };

    window.prompt = function (message, defaultValue) {
      return ipcRenderer.sendSync('webview_prompt', message, defaultValue);
    };
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
