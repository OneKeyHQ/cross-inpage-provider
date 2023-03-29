import {
  IElectronWebView,
  IJsBridgeConfig,
  IJsBridgeMessagePayload,
} from '@onekeyfe/cross-inpage-provider-types';
import { IWebViewWrapperRef } from './useWebViewBridge';

import {
  JsBridgeBase,
} from '@onekeyfe/cross-inpage-provider-core';
import { RefObject } from 'react';

export class JsBridgeDesktopHost extends JsBridgeBase {
  constructor(config: IJsBridgeConfig) {
    super(config);
    this.webviewRef = config.webviewRef as RefObject<IElectronWebView>;
  }

  sendAsString = true;

  webviewRef?: RefObject<IElectronWebView>;

  webviewWrapper?: IWebViewWrapperRef;

  sendPayload(payload: IJsBridgeMessagePayload | string) {
    if (this.webviewRef && this.webviewRef.current) {
      const payloadStr: string = payload as string;

      if (this.webviewRef.current) {
        // *** executeJavaScript will be blocked by head script loading
        // const inpageReceiveCode = injectedFactory.createCodeJsBridgeReceive(payloadStr);
        // appDebugLogger.webview('executeJavaScript', inpageReceiveCode, payload);
        // this.webviewRef.current?.executeJavaScript?.(inpageReceiveCode);

        // *** use ipcRenderer.on instead
        this.webviewRef.current?.send('JsBridgeDesktopHostToInjected', payloadStr);
      } else {
        throw new Error('JsBridgeDesktopHost executeJavaScript failed: webview ref not ready yet.');
      }
    }
  }
}
