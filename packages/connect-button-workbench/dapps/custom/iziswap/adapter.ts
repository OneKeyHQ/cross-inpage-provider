import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';

import { hackConnectButton } from '../../../../providers/inpage-providers-hub/src/connectButtonHack/hackConnectButton';
import { createWalletId } from '../../../../providers/inpage-providers-hub/src/connectButtonHack/universal/utils';
import { promoteOneKeyWalletItem } from './adapter.dom';

const ONEKEY_WALLET_ID_NAME = 'OneKey Wallet';

export function promoteOneKeyWallet() {
  const item = promoteOneKeyWalletItem();
  if (!item) {
    return null;
  }

  createWalletId(IInjectedProviderNames.ethereum, ONEKEY_WALLET_ID_NAME).updateFlag(item);
  return item;
}

export default () =>
  hackConnectButton({
    urls: ['izumi.finance'],
    providers: [IInjectedProviderNames.ethereum],
    replaceMethod(options) {
      if (!options?.providers?.includes(IInjectedProviderNames.ethereum)) {
        return;
      }
      promoteOneKeyWallet();
    },
  });
