import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';

import { hackConnectButton } from '../../../../providers/inpage-providers-hub/src/connectButtonHack/hackConnectButton';
import { replaceDegenSwapWallets } from './adapter.dom';

export default () =>
  hackConnectButton({
    urls: ['dex.swapdegen.tips'],
    providers: [IInjectedProviderNames.ethereum],
    replaceMethod(options) {
      if (!options?.providers?.includes(IInjectedProviderNames.ethereum)) {
        return;
      }
      replaceDegenSwapWallets();
    },
  });
