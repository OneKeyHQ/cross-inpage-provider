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
  wallet_events_ext_switch_changed: 'wallet_events_ext_switch_changed',
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
    try {
      // platform check
      const walletInfoLocalStr = localStorage.getItem(WALLET_INFO_LOACAL_KEY);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const walletInfoLocal = walletInfoLocalStr ? JSON.parse(walletInfoLocalStr) : null;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (!walletInfoLocal || (walletInfoLocal && walletInfoLocal.platformEnv.isExtension)) {
        this.on(PROVIDER_EVENTS.message_low_level, (payload) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const { method, params } = payload;
          if (method === METHODS.wallet_events_ext_switch_changed) {
            try {
              localStorage.setItem(WALLET_INFO_LOACAL_KEY, JSON.stringify(params));
            } catch (e) {
              console.error(e);
            }
          }
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  protected providerName: IInjectedProviderNamesStrings = IInjectedProviderNames.$private;

  request(data: unknown) {
    return this.bridgeRequest(data);
  }
}

export { ProviderPrivate };
