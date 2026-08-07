import { hackConnectButton } from '../../../../providers/inpage-providers-hub/src/connectButtonHack/hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';

import { replaceDydxMetaMaskWallet } from './adapter.dom';

export default () =>
  hackConnectButton({
    urls: ['dydx.exchange', 'trade.dydx.exchange', 'www.dydx.exchange'],
    providers: [IInjectedProviderNames.ethereum],
    replaceMethod(options) {
      if (!options?.providers?.includes(IInjectedProviderNames.ethereum)) {
        return;
      }
      replaceDydxMetaMaskWallet();
    },
  });
