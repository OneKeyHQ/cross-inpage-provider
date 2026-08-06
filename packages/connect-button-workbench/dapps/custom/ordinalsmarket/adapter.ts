import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';

import { hackConnectButton } from '../../../../providers/inpage-providers-hub/src/connectButtonHack/hackConnectButton';
import { replaceSatflowUnisat } from './adapter.dom';

export default () =>
  hackConnectButton({
    urls: ['satflow.com', 'www.satflow.com'],
    providers: [IInjectedProviderNames.btc],
    replaceMethod(options) {
      if (!options?.providers?.includes(IInjectedProviderNames.btc)) {
        return;
      }

      replaceSatflowUnisat();
    },
  });
