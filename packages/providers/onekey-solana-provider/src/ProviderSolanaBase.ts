import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { ProviderBase, IInpageProviderConfig } from '@onekeyfe/cross-inpage-provider-core';

class ProviderSolanaBase extends ProviderBase {
  constructor(props: IInpageProviderConfig) {
    super(props);
  }

  protected providerName = IInjectedProviderNames.solana;

  request(data: unknown) {
    return this.bridgeRequest(data);
  }
}

export { ProviderSolanaBase };
