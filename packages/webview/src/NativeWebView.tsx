/* eslint-disable  @typescript-eslint/ban-ts-comment  */
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';

import type { ViewStyle } from 'react-native';

import { WebView, WebViewProps } from 'react-native-webview';

import { appDebugLogger } from '@onekeyfe/cross-inpage-provider-core';

import { JsBridgeNativeHost } from './JsBridgeNativeHost';
import { InpageProviderWebViewProps } from '@onekeyfe/cross-inpage-provider-types';

import { IWebViewWrapperRef } from './useWebViewBridge';

import type { WebViewMessageEvent } from 'react-native-webview/lib/WebViewTypes';

export type NativeWebViewProps = WebViewProps &
  InpageProviderWebViewProps & {
    style?: ViewStyle;
  };

// TODO rename to NativeWebViewLegacy
const NativeWebView = forwardRef(
  (
    {
      style,
      src,
      receiveHandler,
      onSrcChange,
      onLoadProgress,
      injectedJavaScriptBeforeContentLoaded,
      onMessage,
      ...props
    }: NativeWebViewProps,
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
      (event: WebViewMessageEvent) => {
        const { data } = event.nativeEvent;
        let origin = '';
        try {
          const uri = new URL(event.nativeEvent.url);
          origin = uri?.origin || '';
        } catch (err) {
          console.error(err);
        }
        appDebugLogger.webview('onMessage', origin, data);
        // - receive
        jsBridge.receive(data, { origin });
        onMessage?.(event);
      },
      [jsBridge, onMessage],
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
        // @ts-ignore
        style={[{ backgroundColor: 'transparent' }, style]}
        onLoadProgress={onLoadProgress}
        ref={webviewRef}
        // injectedJavaScript={injectedNative}
        injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded || ''}
        source={{ uri: src }}
        onMessage={webviewOnMessage}
        {...props}
      />
    );
  },
);
NativeWebView.displayName = 'NativeWebView';

export { NativeWebView };
