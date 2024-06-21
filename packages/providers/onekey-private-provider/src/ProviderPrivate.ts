import {
  IInjectedProviderNames,
  IInjectedProviderNamesStrings,
} from '@onekeyfe/cross-inpage-provider-types';

import { IInpageProviderConfig, ProviderBase, switchDefaultWalletNotification, switchNetworkNotification } from '@onekeyfe/cross-inpage-provider-core';
import { consts } from '@onekeyfe/cross-inpage-provider-core';

export interface IOneKeyWalletInfo {
  enableExtContentScriptReloadButton?: boolean;
  platform?: string;
  version?: string;
  buildNumber?: string;
  disableExt: boolean;
  isDefaultWallet?: boolean;
  excludedDappList: string[];
  isLegacy: boolean;
  platformEnv: {
    isRuntimeBrowser?: boolean;
    isRuntimeChrome?: boolean;
    isRuntimeFirefox?: boolean;

    isWeb?: boolean;

    isNative?: boolean;
    isNativeIOS?: boolean;
    isNativeAndroid?: boolean;

    isExtension?: boolean;
    isExtChrome?: boolean;
    isExtFirefox?: boolean;

    isDesktop?: boolean;
    isDesktopWin?: boolean;
    isDesktopLinux?: boolean;
    isDesktopMac?: boolean;
  };
}

const { WALLET_INFO_LOACAL_KEY_V5 } = consts;

const PROVIDER_EVENTS = {
  'message_low_level': 'message_low_level',
} as const;

const METHODS = {
  wallet_events_ext_switch_changed: 'wallet_events_ext_switch_changed',
  wallet_events_dapp_network_changed: 'wallet_events_dapp_network_changed'
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
      const walletInfoLocalStr = localStorage.getItem(WALLET_INFO_LOACAL_KEY_V5);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const walletInfoLocal = walletInfoLocalStr ? JSON.parse(walletInfoLocalStr) : null;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (!walletInfoLocal || (walletInfoLocal && walletInfoLocal.platformEnv.isExtension)) {
        this.on(PROVIDER_EVENTS.message_low_level, (payload) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const { method, params } = payload;
          if (method === METHODS.wallet_events_ext_switch_changed) {
            try {
              localStorage.setItem(WALLET_INFO_LOACAL_KEY_V5, JSON.stringify(params));
              this.notifyDefaultWalletChanged(params as IOneKeyWalletInfo)
            } catch (e) {
              console.error(e);
            }
          } else if (method === METHODS.wallet_events_dapp_network_changed) {
            console.log('=====>METHODS.wallet_events_dapp_network_changed')
            this.notifyNetworkChanged(params as {networkChangedText: string})
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

  notifyDefaultWalletChanged(params: IOneKeyWalletInfo) {
    let isDefaultWallet = !!params.isDefaultWallet
    if (isDefaultWallet) {
      const isExcludedWebsite = params.excludedDappList.some(i => i.startsWith(window.location.origin));
      isDefaultWallet = !isExcludedWebsite;
    }
    switchDefaultWalletNotification(isDefaultWallet);
  }

  notifyNetworkChanged(params: {networkChangedText: string}) {
    if (!params.networkChangedText) return
    switchNetworkNotification(params.networkChangedText)
  }
}

export { ProviderPrivate };
