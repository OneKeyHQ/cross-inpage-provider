import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';

import { ProviderBase, IInpageProviderConfig } from '@onekeyfe/cross-inpage-provider-core';

class ProviderStellarBase extends ProviderBase {
  constructor(props: IInpageProviderConfig) {
    super(props);
  }

  protected providerName = IInjectedProviderNames.stellar;

  request(data: unknown) {
    return this.bridgeRequest(data);
  }
}

export { ProviderStellarBase };
