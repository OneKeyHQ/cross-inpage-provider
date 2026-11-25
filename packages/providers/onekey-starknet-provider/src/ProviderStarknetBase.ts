import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { ProviderBase, IInpageProviderConfig } from '@onekeyfe/cross-inpage-provider-core';

class ProviderStarknetBase extends ProviderBase {
  constructor(props: IInpageProviderConfig) {
    super(props);
  }

  protected providerName = IInjectedProviderNames.starknet;
}

export { ProviderStarknetBase };
