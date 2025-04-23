import { hexToBytes } from '@onekeyfe/cross-inpage-provider-core';
import mitt, { Emitter } from 'mitt';
import {
  IdentifierArray,
  IdentifierString,
  ReadonlyWalletAccount,
  registerWallet,
  StandardConnectFeature,
  StandardConnectMethod,
  StandardDisconnectFeature,
  StandardDisconnectMethod,
  StandardEventsFeature,
  StandardEventsListeners,
  StandardEventsOnMethod,
  BFC_DEVNET_CHAIN,
  BFC_TESTNET_CHAIN,
  BenfenSignAndExecuteTransactionBlockFeature,
  BenfenSignAndExecuteTransactionBlockMethod,
  BenfenSignMessageFeature,
  BenfenSignMessageMethod,
  BenfenSignPersonalMessageFeature,
  BenfenSignPersonalMessageMethod,
  BenfenSignTransactionBlockFeature,
  BenfenSignTransactionBlockMethod,
  Wallet,
} from '@benfen/bfc.js/wallet-standard';
import { ProviderBfc } from './OnekeyBfcProvider';
import { AccountInfo, ALL_PERMISSION_TYPES, PermissionType, WalletInfo } from './types';

type WalletEventsMap = {
  [E in keyof StandardEventsListeners]: Parameters<StandardEventsListeners[E]>[0];
};

type Features = StandardConnectFeature &
  StandardDisconnectFeature &
  StandardEventsFeature &
  BenfenSignAndExecuteTransactionBlockFeature &
  BenfenSignTransactionBlockFeature &
  BenfenSignMessageFeature &
  BenfenSignPersonalMessageFeature;

enum Feature {
  STANDARD__CONNECT = 'standard:connect',
  STANDARD__DISCONNECT = 'standard:disconnect',
  STANDARD__EVENTS = 'standard:events',
  BFC__SIGN_AND_EXECUTE_TRANSACTION_BLOCK = 'bfc:signAndExecuteTransactionBlock',
  BFC__SIGN_TRANSACTION_BLOCK = 'bfc:signTransactionBlock',
  BFC__SIGN_MESSAGE = 'bfc:signMessage',
  BFC__SIGN_PERSONAL_MESSAGE = 'bfc:signPersonalMessage',
}

class OnekeyBfcStandardWallet implements Wallet {
  readonly version = '1.0.0' as const;
  readonly _name = 'OneKey Wallet' as const;
  readonly provider: ProviderBfc;
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
    return [BFC_DEVNET_CHAIN, BFC_TESTNET_CHAIN] as IdentifierArray;
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
      [Feature.BFC__SIGN_AND_EXECUTE_TRANSACTION_BLOCK]: {
        version: '1.0.0',
        signAndExecuteTransactionBlock: this.$signAndExecuteTransactionBlock,
      },
      [Feature.BFC__SIGN_TRANSACTION_BLOCK]: {
        version: '1.0.0',
        signTransactionBlock: this.$signTransactionBlock,
      },
      [Feature.BFC__SIGN_MESSAGE]: {
        version: '1.0.0',
        signMessage: this.$signMessage,
      },
      [Feature.BFC__SIGN_PERSONAL_MESSAGE]: {
        version: '1.0.0',
        signPersonalMessage: this.$signPersonalMessage,
      },
    };
  }

  constructor(provider: ProviderBfc, options?: WalletInfo) {
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

  $signAndExecuteTransactionBlock: BenfenSignAndExecuteTransactionBlockMethod = async (input) => {
    return this.provider.signAndExecuteTransactionBlock(input);
  };

  $signTransactionBlock: BenfenSignTransactionBlockMethod = async (input) => {
    return this.provider.signTransactionBlock(input);
  };

  $signMessage: BenfenSignMessageMethod = async (input) => {
    return this.provider.signMessage(input);
  };

  $signPersonalMessage: BenfenSignPersonalMessageMethod = async (input) => {
    return this.provider.signPersonalMessage(input);
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
        Feature.BFC__SIGN_AND_EXECUTE_TRANSACTION_BLOCK,
        Feature.BFC__SIGN_TRANSACTION_BLOCK,
        Feature.BFC__SIGN_MESSAGE,
        Feature.BFC__SIGN_PERSONAL_MESSAGE,
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

export function registerBfcWallet(provider: ProviderBfc, options?: WalletInfo) {
  try {
    registerWallet(new OnekeyBfcStandardWallet(provider, options));
  } catch (error) {
    console.error(error);
  }
}
