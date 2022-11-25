import mitt, { Emitter } from 'mitt';
import { registerWallet } from '@mysten/wallet-standard';
import {
    SUI_CHAINS,
    ReadonlyWalletAccount,
    type SuiSignAndExecuteTransactionFeature,
    type SuiSignAndExecuteTransactionMethod,
    type ConnectFeature,
    type ConnectMethod,
    type DisconnectFeature,
    type DisconnectMethod,
    type Wallet,
    type EventsFeature,
    type EventsOnMethod,
    type EventsListeners,
} from '@mysten/wallet-standard';
import {  ProviderSui } from './OnekeySuiProvider';
import { ALL_PERMISSION_TYPES, LOGO_BASE64, PermissionType } from './types';

type WalletEventsMap = {
    [E in keyof EventsListeners]: Parameters<EventsListeners[E]>[0];
  };

type Features = ConnectFeature &
  DisconnectFeature &
  EventsFeature &
  SuiSignAndExecuteTransactionFeature;

enum Feature {
  STANDARD__CONNECT = 'standard:connect',
  STANDARD__DISCONNECT = 'standard:disconnect',
  STANDARD__EVENTS = 'standard:events',
  SUI__SIGN_AND_EXECUTE_TRANSACTION = 'sui:signAndExecuteTransaction',
}

class OnekeySuiStandardWallet implements Wallet{
  readonly version = '1.0.0' as const;
  readonly _name = 'OneKey Wallet' as const;
  readonly provider:ProviderSui;

  _events: Emitter<WalletEventsMap>;
  _account: ReadonlyWalletAccount | null;

  get name() {
    return this._name;
  }

  get icon() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return LOGO_BASE64 as any;
  }

  get chains() {
    // TODO: Extract chain from wallet:
    return SUI_CHAINS;
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
      [Feature.SUI__SIGN_AND_EXECUTE_TRANSACTION]: {
        version: '1.0.0',
        signAndExecuteTransaction: this.$signAndExecuteTransaction,
      },
    };
  }
 
  constructor(provider: ProviderSui) {
    this.provider = provider;
    this._events = mitt();
    this._account = null;
    void this.$connected();
  }

  $on: EventsOnMethod = (event, listener) => {
    this._events.on(event, listener);
    return () => this._events.off(event, listener);
  };

  $connected = async () => {
    if (!(await this.$hasPermissions(['viewAccount']))) {
      return;
    }
    const accounts =await this.provider.getAccounts()

    const [address] = accounts;

    if (address) {
        const account = this._account;
        if (!account || account.address !== address) {
            this._account = new ReadonlyWalletAccount({
                address,
                // TODO: Expose public key instead of address:
                publicKey: new Uint8Array(),
                chains: SUI_CHAINS,
                features: [Feature.SUI__SIGN_AND_EXECUTE_TRANSACTION],
            });
            this._events.emit('change', { accounts: this.accounts });
        }
    }
  };

  $connect: ConnectMethod = async (input) => {
    if (!input?.silent) {
      await this.provider.requestPermissions();
    }

    await this.$connected();

    return { accounts: this.accounts };
  };

  $disconnect: DisconnectMethod = async () => {
    await this.provider.disconnect();
    this._account = null;
    this._events.all.clear();
  };


  $hasPermissions(permissions: readonly PermissionType[] = ALL_PERMISSION_TYPES) {
    return  this.provider.hasPermissions(permissions);
  }

  $signAndExecuteTransaction: SuiSignAndExecuteTransactionMethod = async (input) => {
    return this.provider.signAndExecuteTransaction(input.transaction);
  };
}

export function registerSuiWallet(provider: ProviderSui){
  try {
    registerWallet(new OnekeySuiStandardWallet(provider));  
  } catch (error) {
    console.error(error);
  }
}