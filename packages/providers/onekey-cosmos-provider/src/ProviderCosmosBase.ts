import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';

import { ProviderBase, IInpageProviderConfig } from '@onekeyfe/cross-inpage-provider-core';

class ProviderCosmosBase extends ProviderBase {
  constructor(props: IInpageProviderConfig) {
    super(props);
  }

  protected providerName = IInjectedProviderNames.cosmos;

  request(data: unknown) {
    return this.bridgeRequest(data);
  }
}

export { ProviderCosmosBase };
