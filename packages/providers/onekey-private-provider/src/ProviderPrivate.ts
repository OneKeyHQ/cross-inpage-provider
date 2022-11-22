import {
  IInjectedProviderNames,
  IInjectedProviderNamesStrings,
} from '@onekeyfe/cross-inpage-provider-types';

import { IInpageProviderConfig, ProviderBase } from '@onekeyfe/cross-inpage-provider-core';
import { consts } from '@onekeyfe/cross-inpage-provider-core';

const { WALLET_INFO_LOACAL_KEY } = consts;

const PROVIDER_EVENTS = {
  'message_low_level': 'message_low_level',
} as const;

const METHODS = {
  wallet_getConnectWalletInfo: 'wallet_getConnectWalletInfo',
};

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
    this._registerEvents();
  }

  private _registerEvents() {
    // platform check
    const walletInfoLocalStr = localStorage.getItem(WALLET_INFO_LOACAL_KEY);
    const walletInfoLocal = walletInfoLocalStr ? JSON.parse(walletInfoLocalStr) : null;
    if (!walletInfoLocal || (walletInfoLocal && walletInfoLocal.platformEnv.isExtension)) {
      this.on(PROVIDER_EVENTS.message_low_level, (payload) => {
        const { method } = payload;
        if (method === METHODS.wallet_getConnectWalletInfo) {
          void this.getConnectWalletInfo();
        }
      });
    }
  }

  protected providerName: IInjectedProviderNamesStrings = IInjectedProviderNames.$private;

  request(data: unknown) {
    return this.bridgeRequest(data);
  }
}

export { ProviderPrivate };
