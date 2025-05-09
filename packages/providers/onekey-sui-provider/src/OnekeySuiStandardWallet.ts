import {
  ReadonlyWalletAccount,
  SUI_DEVNET_CHAIN,
  SUI_TESTNET_CHAIN,
  registerWallet,
} from '@mysten/wallet-standard';
import mitt from 'mitt';

import { hexToBytes } from '@onekeyfe/cross-inpage-provider-core';

import { ALL_PERMISSION_TYPES } from './types';

import type { ProviderSui } from './OnekeySuiProvider';
import type { AccountInfo, PermissionType, WalletInfo } from './types';
import type {
  IdentifierArray,
  IdentifierString,
  StandardConnectFeature,
  StandardConnectMethod,
  StandardDisconnectFeature,
  StandardDisconnectMethod,
  StandardEventsFeature,
  StandardEventsListeners,
  StandardEventsOnMethod,
  SuiSignAndExecuteTransactionBlockFeature,
  SuiSignAndExecuteTransactionBlockMethod,
  SuiSignAndExecuteTransactionFeature,
  SuiSignAndExecuteTransactionMethod,
  SuiSignMessageFeature,
  SuiSignMessageMethod,
  SuiSignPersonalMessageFeature,
  SuiSignPersonalMessageMethod,
  SuiSignTransactionBlockFeature,
  SuiSignTransactionBlockMethod,
  SuiSignTransactionFeature,
  SuiSignTransactionMethod,
  Wallet,
} from '@mysten/wallet-standard';
import type { Emitter } from 'mitt';

type WalletEventsMap = {
  [E in keyof StandardEventsListeners]: Parameters<StandardEventsListeners[E]>[0];
};

type Features = StandardConnectFeature &
  StandardDisconnectFeature &
  StandardEventsFeature &
  SuiSignAndExecuteTransactionBlockFeature &
  SuiSignTransactionBlockFeature &
  SuiSignMessageFeature &
  // standard features 1.1
  SuiSignPersonalMessageFeature &
  // standard features 2.0
  SuiSignAndExecuteTransactionFeature &
  SuiSignTransactionFeature;

enum Feature {
  STANDARD__CONNECT = 'standard:connect',
  STANDARD__DISCONNECT = 'standard:disconnect',
  STANDARD__EVENTS = 'standard:events',
  SUI__SIGN_AND_EXECUTE_TRANSACTION_BLOCK = 'sui:signAndExecuteTransactionBlock',
  SUI__SIGN_TRANSACTION_BLOCK = 'sui:signTransactionBlock',
  SUI__SIGN_MESSAGE = 'sui:signMessage',
  SUI__SIGN_PERSONAL_MESSAGE = 'sui:signPersonalMessage',
  SUI__SIGN_AND_EXECUTE_TRANSACTION = 'sui:signAndExecuteTransaction',
  SUI__SIGN_TRANSACTION = 'sui:signTransaction',
}

class OnekeySuiStandardWallet implements Wallet {
  readonly version = '1.0.0' as const;
  readonly _name = 'OneKey Wallet' as const;
  readonly provider: ProviderSui;
  readonly options?: WalletInfo;

  _events: Emitter<WalletEventsMap>;
  _account: ReadonlyWalletAccount | null;

  get name() {
    return this.options?.name ?? this._name;
  }

  get icon() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
    return (this.options?.logo || '') as any;
  }

  get chains() {
    return [SUI_DEVNET_CHAIN, SUI_TESTNET_CHAIN] as IdentifierArray;
  }

  get accounts() {
    return this._account ? [this._account] : [];
  }

  get features(): Features {
    return {
      [Feature.STANDARD__CONNECT]: {
        version: '1.0.0',
        connect: this.$connect,
      },
      [Feature.STANDARD__DISCONNECT]: {
        version: '1.0.0',
        disconnect: this.$disconnect,
      },
      [Feature.STANDARD__EVENTS]: {
        version: '1.0.0',
        on: this.$on,
      },
      [Feature.SUI__SIGN_AND_EXECUTE_TRANSACTION_BLOCK]: {
        version: '1.0.0',
        signAndExecuteTransactionBlock: this.$signAndExecuteTransactionBlock,
      },
      [Feature.SUI__SIGN_TRANSACTION_BLOCK]: {
        version: '1.0.0',
        signTransactionBlock: this.$signTransactionBlock,
      },
      [Feature.SUI__SIGN_MESSAGE]: {
        version: '1.0.0',
        signMessage: this.$signMessage,
      },
      [Feature.SUI__SIGN_PERSONAL_MESSAGE]: {
        version: '1.1.0',
        signPersonalMessage: this.$signPersonalMessage,
      },
      [Feature.SUI__SIGN_AND_EXECUTE_TRANSACTION]: {
        version: '2.0.0',
        signAndExecuteTransaction: this.$signAndExecuteTransaction,
      },
      [Feature.SUI__SIGN_TRANSACTION]: {
        version: '2.0.0',
        signTransaction: this.$signTransaction,
      },
    };
  }

  constructor(provider: ProviderSui, options?: WalletInfo) {
    this.provider = provider;
    this._events = mitt();
    this._account = null;
    this.options = options;
    this.subscribeEventFromBackend();
    void this.$connected();
  }

  $on: StandardEventsOnMethod = (event, listener) => {
    this._events.on(event, listener);
    return () => this._events.off(event, listener);
  };

  $connected = async () => {
    if (!(await this.$hasPermissions(['viewAccount']))) {
      return;
    }
    const accounts = await this.provider.getAccounts();
    const [account] = accounts;

    const activateAccount = this._account;
    if (activateAccount && activateAccount.address === account.address) {
      return { accounts: this.accounts };
    }

    if (account) {
      await this.handleAccountSwitch(account);
      return { accounts: this.accounts };
    }
  };

  $connect: StandardConnectMethod = async (input) => {
    if (!input?.silent) {
      await this.provider.requestPermissions();
    }

    await this.$connected();

    return { accounts: this.accounts };
  };

  $disconnect: StandardDisconnectMethod = async () => {
    await this.provider.disconnect();
    this._account = null;
    this._events.all.clear();
  };

  getActiveChain() {
    return this.provider.getActiveChain();
  }

  $hasPermissions(permissions: readonly PermissionType[] = ALL_PERMISSION_TYPES) {
    return this.provider.hasPermissions(permissions);
  }

  $signAndExecuteTransactionBlock: SuiSignAndExecuteTransactionBlockMethod = async (input) => {
    return this.provider.signAndExecuteTransactionBlock(input);
  };

  $signTransactionBlock: SuiSignTransactionBlockMethod = async (input) => {
    return this.provider.signTransactionBlock(input);
  };

  $signMessage: SuiSignMessageMethod = async (input) => {
    return this.provider.signMessage(input);
  };

  $signPersonalMessage: SuiSignPersonalMessageMethod = async (input) => {
    return this.provider.signPersonalMessage(input);
  };

  $signAndExecuteTransaction: SuiSignAndExecuteTransactionMethod = async (input) => {
    return this.provider.signAndExecuteTransaction(input);
  };

  $signTransaction: SuiSignTransactionMethod = async (input) => {
    return this.provider.signTransaction(input);
  };

  subscribeEventFromBackend() {
    this.provider.onNetworkChange((network) => {
      if (!network) {
        return;
      }
      this.handleNetworkSwitch({ network: network });
    });

    this.provider.onAccountChange((account) => {
      if (!account) {
        return;
      }
      void this.handleAccountSwitch(account);
    });
  }

  handleAccountSwitch = async (payload: AccountInfo) => {
    const { address, publicKey } = payload;

    const activateChain = await this.getActiveChain();
    this._account = new ReadonlyWalletAccount({
      address: address,
      publicKey: hexToBytes(publicKey),
      chains: activateChain ? [activateChain] : [],
      features: [
        Feature.STANDARD__CONNECT,
        Feature.SUI__SIGN_AND_EXECUTE_TRANSACTION_BLOCK,
        Feature.SUI__SIGN_TRANSACTION_BLOCK,
        Feature.SUI__SIGN_MESSAGE,
        Feature.SUI__SIGN_PERSONAL_MESSAGE,
        Feature.SUI__SIGN_AND_EXECUTE_TRANSACTION,
        Feature.SUI__SIGN_TRANSACTION,
      ],
    });

    this._events.emit('change', {
      accounts: this.accounts,
      chains: activateChain ? [activateChain] : [],
    });
  };

  handleNetworkSwitch = (payload: { network: string }) => {
    const { network } = payload;

    this._events.emit('change', {
      accounts: this.accounts,
      chains: [network as IdentifierString],
    });
  };
}

export function registerSuiWallet(provider: ProviderSui, options?: WalletInfo) {
  try {
    registerWallet(new OnekeySuiStandardWallet(provider, options));
  } catch (error) {
    console.error(error);
  }
}
