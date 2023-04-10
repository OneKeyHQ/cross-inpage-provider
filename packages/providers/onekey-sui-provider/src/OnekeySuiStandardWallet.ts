import { hexToBytes } from '@noble/hashes/utils';
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
  SUI_DEVNET_CHAIN,
  SUI_TESTNET_CHAIN,
  SuiSignAndExecuteTransactionBlockFeature,
  SuiSignAndExecuteTransactionBlockMethod,
  SuiSignMessageFeature,
  SuiSignMessageMethod,
  SuiSignTransactionBlockFeature,
  SuiSignTransactionBlockMethod,
  Wallet,
} from '@mysten/wallet-standard';
import { ProviderSui } from './OnekeySuiProvider';
import { ALL_PERMISSION_TYPES, PermissionType, WalletInfo } from './types';

type WalletEventsMap = {
  [E in keyof StandardEventsListeners]: Parameters<StandardEventsListeners[E]>[0];
};

type Features = StandardConnectFeature &
  StandardDisconnectFeature &
  StandardEventsFeature &
  SuiSignAndExecuteTransactionBlockFeature &
  SuiSignTransactionBlockFeature &
  SuiSignMessageFeature;

enum Feature {
  STANDARD__CONNECT = 'standard:connect',
  STANDARD__DISCONNECT = 'standard:disconnect',
  STANDARD__EVENTS = 'standard:events',
  SUI__SIGN_AND_EXECUTE_TRANSACTION_BLOCK = 'sui:signAndExecuteTransactionBlock',
  SUI__SIGN_TRANSACTION_BLOCK = 'sui:signTransactionBlock',
  SUI__SIGN_MESSAGE = 'sui:signMessage',
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
    const activeChain = await this.getActiveChain();
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
      this._account = new ReadonlyWalletAccount({
        address: account.address,
        publicKey: hexToBytes(account.publicKey),
        chains: activeChain ? [activeChain] : [],
        features: [
          Feature.STANDARD__CONNECT,
          Feature.SUI__SIGN_AND_EXECUTE_TRANSACTION_BLOCK,
          Feature.SUI__SIGN_TRANSACTION_BLOCK,
          Feature.SUI__SIGN_MESSAGE,
        ],
      });
      this._events.emit('change', { accounts: this.accounts });
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

  getActiveChain(){
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

  subscribeEventFromBackend() {
    this.provider.onNetworkChange((network) => {
      if (!network) return;
      return this.handleNetworkSwitch({ network });
    });
  }

  handleNetworkSwitch(payload: { network: string }) {
    const { network } = payload;

    this._events.emit('change', {
      chains: [network as IdentifierString],
    });
  }
}

export function registerSuiWallet(provider: ProviderSui, options?: WalletInfo) {
  try {
    registerWallet(new OnekeySuiStandardWallet(provider, options));
  } catch (error) {
    console.error(error);
  }
}
