/* eslint-disable  @typescript-eslint/ban-ts-comment  */
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';

import { WebView, WebViewProps } from 'react-native-webview';

import { appDebugLogger } from '@onekeyfe/cross-inpage-provider-core';

import { JsBridgeNativeHost } from './JsBridgeNativeHost';
import { InpageProviderWebViewProps } from '@onekeyfe/cross-inpage-provider-types';

import { IWebViewWrapperRef } from './useWebViewBridge';

import type { WebViewMessageEvent } from 'react-native-webview/lib/WebViewTypes';

const NativeWebView = forwardRef(
  (
    {
      src,
      receiveHandler,
      onSrcChange,
      onLoadProgress,
      injectedJavaScriptBeforeContentLoaded,
      ...props
    }: WebViewProps & InpageProviderWebViewProps,
    ref,
  ) => {
    const webviewRef = useRef<WebView | null>(null);

    const jsBridge = useMemo(
      () =>
        new JsBridgeNativeHost({
          webviewRef,
          receiveHandler,
        }),
      [receiveHandler],
    );

    const webviewOnMessage = useCallback(
      (event) => {
        // as WebViewMessageEvent
        const event0 = event as {
          nativeEvent: {
            url: string;
            data: string;
          };
        };
        const { data } = event0.nativeEvent;
        const uri = new URL(event0.nativeEvent.url);
        const origin = uri?.origin || '';
        appDebugLogger.webview('onMessage', origin, data);
        // - receive
        jsBridge.receive(data, { origin });
      },
      [jsBridge],
    );

    useImperativeHandle(ref, (): IWebViewWrapperRef => {
      const wrapper = {
        innerRef: webviewRef.current,
        jsBridge,
        reload: () => webviewRef.current?.reload(),
        loadURL: (url: string) => {
          // ReactNativeWebview do not has method to loadURL
          // so we need src props change it
          if (onSrcChange) {
            onSrcChange(url);
          } else {
            console.warn(
              'NativeWebView: Please pass onSrcChange props to enable loadURL() working.',
            );
          }
        },
      };

      jsBridge.webviewWrapper = wrapper;

      return wrapper;
    });

    useEffect(() => {
      // console.log('NativeWebView injectedJavaScript \r\n', injectedNative);
    }, []);

    return (
      <WebView
        {...props}
        // @ts-ignore
        style={{ backgroundColor: 'transparent' }}
        onLoadProgress={onLoadProgress}
        ref={webviewRef}
        // injectedJavaScript={injectedNative}
        injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded || ''}
        source={{ uri: src }}
        onMessage={webviewOnMessage}
      />
    );
  },
);
NativeWebView.displayName = 'NativeWebView';

export { NativeWebView };
