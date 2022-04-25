import {
  IInjectedProviderNames,
  IInjectedProviderNamesStrings,
} from '@onekeyfe/cross-inpage-provider-types';

import { IInpageProviderConfig, ProviderBase } from '@onekeyfe/cross-inpage-provider-core';

class ProviderPrivate extends ProviderBase {
  constructor(props: IInpageProviderConfig) {
    super(props);
    try {
      void this.getConnectWalletInfo();
    } catch (error) {
      console.error(error);
    }
    try {
      void this.sendSiteMetadataDomReady();
    } catch (error) {
      console.error(error);
    }
  }

  protected providerName: IInjectedProviderNamesStrings = IInjectedProviderNames.$private;

  request(data: unknown) {
    return this.bridgeRequest(data);
  }
}

export { ProviderPrivate };
