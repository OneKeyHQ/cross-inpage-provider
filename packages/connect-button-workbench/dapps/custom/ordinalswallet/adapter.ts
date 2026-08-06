import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';

import { hackConnectButton } from '../../../../providers/inpage-providers-hub/src/connectButtonHack/hackConnectButton';
import { replaceOrdinalsWalletUnisat } from './adapter.dom';

export default () =>
  hackConnectButton({
    urls: ['ordinalswallet.com', 'www.ordinalswallet.com'],
    providers: [IInjectedProviderNames.btc],
    replaceMethod(options) {
      if (!options?.providers?.includes(IInjectedProviderNames.btc)) {
        return;
      }

      replaceOrdinalsWalletUnisat();
    },
  });
