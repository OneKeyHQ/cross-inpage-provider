import { JsBridgeDesktopInjected } from '@onekeyfe/desktop-bridge-injected';
import {
  injectedProviderReceiveHandler,
  injectJsBridge,
} from '@onekeyfe/cross-inpage-provider-core';

import { injectWeb3Provider } from '@onekeyfe/inpage-providers-hub';

import { installCustomInjectionDevIndicator } from './customInjectionDevIndicator';

declare const __ONEKEY_CUSTOM_INJECTION_DEV__: boolean;
declare const __ONEKEY_CUSTOM_INJECTION_BUILD_LABEL__: string;

const bridge = () =>
  new JsBridgeDesktopInjected({
    receiveHandler: injectedProviderReceiveHandler,
  });
injectJsBridge(bridge);

injectWeb3Provider();

if (__ONEKEY_CUSTOM_INJECTION_DEV__) {
  installCustomInjectionDevIndicator({
    buildLabel: __ONEKEY_CUSTOM_INJECTION_BUILD_LABEL__,
  });
}

// eslint-disable-next-line no-void
void 0;
