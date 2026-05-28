/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  defineWindowProperty,
  injectedProviderReceiveHandler,
  injectJsBridge,
} from '@onekeyfe/cross-inpage-provider-core';
import { JsBridgeNativeInjected } from '@onekeyfe/native-bridge-injected';
import { ProviderPrivate } from '@onekeyfe/onekey-private-provider';

const bridge = () =>
  new JsBridgeNativeInjected({
    receiveHandler: injectedProviderReceiveHandler,
  });
const jsBridge = injectJsBridge(bridge);

const $private = new ProviderPrivate({
  bridge: jsBridge,
});

defineWindowProperty(
  '$onekey',
  {
    ...window.$onekey,
    jsBridge,
    $private,
  },
  { enumerable: true, alwaysInject: true },
);

// eslint-disable-next-line no-void
void 0;
