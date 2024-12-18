import { JsBridgeExtInjected } from '@onekeyfe/extension-bridge-injected';
import {
  injectedProviderReceiveHandler,
  injectJsBridge,
} from '@onekeyfe/cross-inpage-provider-core';

import { injectWeb3Provider } from '@onekeyfe/inpage-providers-hub';

// - send
const bridge = (): JsBridgeExtInjected =>
  new JsBridgeExtInjected({
    receiveHandler: injectedProviderReceiveHandler,
  });
injectJsBridge(bridge);

injectWeb3Provider({ showFloatingButton: true });

console.log('OneKey Provider Ready ', performance.now());

// FIX: Error evaluating injectedJavaScript: This is possibly due to an unsupported return type. Try adding true to the end of your injectedJavaScript string.
// eslint-disable-next-line no-void
void 0;
