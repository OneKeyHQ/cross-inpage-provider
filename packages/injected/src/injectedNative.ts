import { JsBridgeNativeInjected } from '@onekeyfe/native-bridge-injected';
import { injectWeb3Provider } from '@onekeyfe/inpage-providers-hub';

import {
  injectedProviderReceiveHandler,
  injectJsBridge,
} from '@onekeyfe/cross-inpage-provider-core';

const bridge = () =>
  new JsBridgeNativeInjected({
    receiveHandler: injectedProviderReceiveHandler,
  });
injectJsBridge(bridge);

injectWeb3Provider();
console.log('=======>>>>>>>>>>>: inject web3Provider', )
throw new Error('=======>>>>>>>>>>>: inject web3Provider error')
alert('====>>>>!!!')

// eslint-disable-next-line no-void
void 0;
