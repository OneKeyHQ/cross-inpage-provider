import { BITCOIN_CHAINS } from '@exodus/bitcoin-wallet-standard-chains';

import type { Wallet } from '@wallet-standard/base';
import { registerWallet } from '@wallet-standard/wallet';
import type { StandardEventsListeners, StandardEventsNames } from '@wallet-standard/features';
import { SatoshiWalletAccount } from './SatoshiWalletAccount.js';
import { ProviderBtc, ProviderEvents } from '../ProviderBtc.js';

import { ProviderBtcSatsConnect } from '../ProviderBtcSatsConnect';

export const SatsConnectNamespace = 'sats-connect:';

export type SatsConnectFeature = {
  [SatsConnectNamespace]: {
    provider: ProviderBtcSatsConnect;
  };
};

export type WalletInfo = {
  name?: string;
  logo: string;
};

class OnekeySatsConnectStandardWallet implements Wallet {
  readonly version = '1.0.0' as const;
  readonly _name = 'OneKey' as const;
  readonly provider: ProviderBtcSatsConnect;
  readonly options?: WalletInfo;

  get name() {
    return this.options?.name ?? this._name;
  }

  get icon() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
    return (this.options?.logo || '') as any;
  }

  get accounts() {
    return [];
  }

  _accounts: SatoshiWalletAccount[] = [];

  readonly _listeners: { [E in StandardEventsNames]?: StandardEventsListeners[E][] } = {};

  constructor(provider: ProviderBtcSatsConnect, options?: WalletInfo) {
    this.provider = provider;
    this.options = options;
  }

  get chains() {
    return BITCOIN_CHAINS.slice();
  }

  get features(): SatsConnectFeature {
    return {
      [SatsConnectNamespace]: {
        provider: this.provider,
      },
    };
  }
}

export function registerSatsConnectWallet(provider: ProviderBtcSatsConnect, options?: WalletInfo) {
  try {
    registerWallet(new OnekeySatsConnectStandardWallet(provider, options));
  } catch (error) {
    console.error(error);
  }
}
