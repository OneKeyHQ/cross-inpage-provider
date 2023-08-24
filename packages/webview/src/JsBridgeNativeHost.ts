import React from 'react';

import { WebView } from 'react-native-webview';

import { injectedFactory, JsBridgeBase } from '@onekeyfe/cross-inpage-provider-core';
import { IJsBridgeConfig, IJsBridgeMessagePayload } from '@onekeyfe/cross-inpage-provider-types';
import { IWebViewWrapperRef } from './useWebViewBridge';

class JsBridgeNativeHost extends JsBridgeBase {
  constructor(config: IJsBridgeConfig) {
    super(config);
    this.webviewRef = config.webviewRef as React.RefObject<WebView>;
  }

  sendAsString = true;

  webviewRef?: React.RefObject<WebView>;

  webviewWrapper?: IWebViewWrapperRef;

  sendPayload(payload: IJsBridgeMessagePayload | string) {
    if (this.webviewRef && this.webviewRef.current) {
      const payloadStr: string = payload as string;
      const inpageReceiveCode = injectedFactory.createCodeJsBridgeReceive(payloadStr);

      // TODO origin check, remoteId check
      this.webviewRef.current?.injectJavaScript?.(inpageReceiveCode);
    }
  }
}

export { JsBridgeNativeHost };
