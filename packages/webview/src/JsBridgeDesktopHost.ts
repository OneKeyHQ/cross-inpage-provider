import React from 'react';

import {
  IElectronWebView,
  IJsBridgeConfig,
  IJsBridgeMessagePayload,
} from '@onekeyfe/cross-inpage-provider-types';
import { IWebViewWrapperRef } from './useWebViewBridge';

import {
  JsBridgeBase,
  injectedFactory,
  appDebugLogger,
} from '@onekeyfe/cross-inpage-provider-core';

class JsBridgeDesktopHost extends JsBridgeBase {
  constructor(config: IJsBridgeConfig) {
    super(config);
    this.webviewRef = config.webviewRef as React.RefObject<IElectronWebView>;
  }

  sendAsString = true;

  webviewRef?: React.RefObject<IElectronWebView>;

  webviewWrapper?: IWebViewWrapperRef;

  sendPayload(payload: IJsBridgeMessagePayload | string) {
    if (this.webviewRef && this.webviewRef.current) {
      const payloadStr: string = payload as string;
      const inpageReceiveCode = injectedFactory.createCodeJsBridgeReceive(payloadStr);

      if (this.webviewRef.current && this.webviewRef.current.executeJavaScript) {
        appDebugLogger.webview('executeJavaScript', inpageReceiveCode, payload);
        this.webviewRef.current?.executeJavaScript?.(inpageReceiveCode);
      } else {
        throw new Error('JsBridgeDesktopHost executeJavaScript failed: webview ref not ready yet');
      }
    }
  }
}

export { JsBridgeDesktopHost };
