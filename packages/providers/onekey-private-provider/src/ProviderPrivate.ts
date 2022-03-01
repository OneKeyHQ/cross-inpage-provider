import {
  IInjectedProviderNames,
  IInjectedProviderNamesStrings,
} from '@onekeyfe/cross-inpage-provider-types';

import { ProviderBase } from '@onekeyfe/cross-inpage-provider-core';

class ProviderPrivate extends ProviderBase {
  protected providerName: IInjectedProviderNamesStrings =
    IInjectedProviderNames.$private;

  request(data: unknown) {
    return this.bridgeRequest(data);
  }
}

export { ProviderPrivate };
