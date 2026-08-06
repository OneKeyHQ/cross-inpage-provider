import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';

import { hackConnectButton } from '../../../../providers/inpage-providers-hub/src/connectButtonHack/hackConnectButton';
import { replaceGammaUnisatWallet } from './adapter.dom';

export default () =>
  hackConnectButton({
    urls: ['gamma.io', 'www.gamma.io'],
    providers: [IInjectedProviderNames.btc],
    replaceMethod(options) {
      if (!options?.providers?.includes(IInjectedProviderNames.btc)) {
        return;
      }

      replaceGammaUnisatWallet();
    },
  });
