import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import {
  BitcoinSignAndSendTransaction,
  BitcoinSignAndSendTransactionFeature,
  BitcoinSignAndSendTransactionInput,
  BitcoinSignAndSendTransactionMethod,
} from './signAndSendTransaction';
import { BITCOIN_CHAINS } from '@exodus/bitcoin-wallet-standard-chains';
import { BitcoinConnect, BitcoinAddressPurpose } from '@exodus/bitcoin-wallet-standard-features';
import type {
  BitcoinFeatures,
  BitcoinConnectMethod,
  BitcoinConnectInput,
} from '@exodus/bitcoin-wallet-standard-features';
import type { Wallet } from '@wallet-standard/base';
import { registerWallet } from '@wallet-standard/wallet';
import { StandardEvents } from '@wallet-standard/features';
import type {
  StandardEventsFeature,
  StandardEventsListeners,
  StandardEventsNames,
  StandardEventsOnMethod,
} from '@wallet-standard/features';
import { SatoshiWalletAccount } from './SatoshiWalletAccount.js';
import { ProviderBtc, ProviderEvents } from '../ProviderBtc.js';
import {
  BitcoinSignMessage,
  BitcoinSignMessageFeature,
  BitcoinSignMessageInput,
  BitcoinSignMessageMethod,
  BitcoinSignMessageOutput,
} from './signMessage';
import {
  BitcoinSignTransaction,
  BitcoinSignTransactionFeature,
  BitcoinSignTransactionInput,
  BitcoinSignTransactionMethod,
} from './signTransaction.js';
import { SignInputs } from '../types';

type Features = StandardEventsFeature &
  BitcoinFeatures &
  BitcoinSignAndSendTransactionFeature &
  BitcoinSignMessageFeature &
  BitcoinSignTransactionFeature;

export type WalletInfo = {
  name?: string;
  logo: string;
};

class OnekeySatoshiWallet implements Wallet {
  readonly version = '1.0.0' as const;
  readonly _name = 'OneKey Wallet' as const;
  readonly provider: ProviderBtc;
  readonly options?: WalletInfo;

  get name() {
    return this.options?.name ?? this._name;
  }

  get icon() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
    return (this.options?.logo || '') as any;
  }

  _accounts: SatoshiWalletAccount[] = [];

  readonly _listeners: { [E in StandardEventsNames]?: StandardEventsListeners[E][] } = {};

  get chains() {
    return BITCOIN_CHAINS.slice();
  }

  get features(): Features {
    return {
      [StandardEvents]: {
        version: '1.0.0',
        on: this._on,
      },
      [BitcoinConnect]: {
        version: '1.0.0',
        connect: this._connect,
      },
      [BitcoinSignAndSendTransaction]: {
        version: '1.0.0',
        signAndSendTransaction: this._signAndSendTransaction,
      },
      [BitcoinSignMessage]: {
        version: '1.0.0',
        signMessage: this._signMessage,
      },
      [BitcoinSignTransaction]: {
        version: '1.0.0',
        signTransaction: this._signTransaction,
      },
    };
  }

  get accounts() {
    return this._accounts.slice();
  }

  constructor(provider: ProviderBtc, options?: WalletInfo) {
    this.provider = provider;
    this.options = options;
    this.subscribeEventFromBackend();
  }

  subscribeEventFromBackend() {
    this.provider.on(ProviderEvents.ACCOUNTS_CHANGED, (accounts) => {
      if (!accounts || accounts.length < 1) return;
      const account = new SatoshiWalletAccount({
        purpose: 'payment',
        publicKey: Buffer.from(''),
        address: 'payment',
      });
      this._emit('change', { accounts: [account] });
    });
  }

  _on: StandardEventsOnMethod = (event, listener) => {
    this._listeners[event]?.push(listener) || (this._listeners[event] = [listener]);
    return (): void => this._off(event, listener);
  };

  _off<E extends StandardEventsNames>(event: E, listener: StandardEventsListeners[E]): void {
    this._listeners[event] = this._listeners[event]?.filter(
      (existingListener) => listener !== existingListener,
    );
  }

  _emit<E extends StandardEventsNames>(
    event: E,
    ...args: Parameters<StandardEventsListeners[E]>
  ): void {
    // eslint-disable-next-line prefer-spread
    this._listeners[event]?.forEach((listener) => listener.apply(null, args));
  }

  isTaprootAddress = (address: string) => {
    return address.startsWith('bc1p');
  };

  _connected = async (purposes: BitcoinAddressPurpose[]) => {
    const accounts = await this.provider.requestAccountsSatsConnect(purposes);

    if (accounts?.length === 0) {
      throw new Error('No accounts found');
    }

    if (accounts && accounts.length > 0) {
      this._accounts = accounts.map((account) => {
        return new SatoshiWalletAccount({
          purpose: account.purpose === 'payment' ? 'payment' : 'ordinals',
          publicKey: Buffer.from(account.pubkey, 'hex'),
          address: account.address,
        });
      });
      this._emit('change', { accounts: this.accounts });
    }
  };

  _connect: BitcoinConnectMethod = async ({ purposes }: BitcoinConnectInput) => {
    console.log('=====>>>>> _connect', purposes);

    await this._connected(purposes);

    return { accounts: this.accounts };
  };

  _signTransaction: BitcoinSignTransactionMethod = async (
    ...inputs: BitcoinSignTransactionInput[]
  ) => {
    console.log('=====>>>>> _signTransaction', inputs);
    const psbts = inputs.map((item) => {
      return bytesToHex(item.psbt);
    });

    const options = inputs.map((item) => ({
      toSignInputs: item.inputsToSign.map((input) => ({
        index: input.signingIndexes[0] ?? 0,
        address: input.account.address,
        publicKey: bytesToHex(input.account.publicKey),
        sighashTypes: [input.sigHash],
      })),
    }));

    // @ts-expect-error
    const result = await this.provider.signPsbts(psbts, options);

    return result.map((item) => ({
      signedPsbt: hexToBytes(item),
    }));
  };

  _signAndSendTransaction: BitcoinSignAndSendTransactionMethod = async (
    inputs: BitcoinSignAndSendTransactionInput,
  ) => {
    console.log('=====>>>>> _signAndSendTransaction', inputs);
    const results = await this._signTransaction(inputs);
    const txIds = [];
    for (const result of results) {
      const txId = await this.provider.pushPsbt(bytesToHex(result.signedPsbt));
      txIds.push(txId);
    }
    return txIds.map((txId) => ({ txId }));
  };

  _signMessage: BitcoinSignMessageMethod = async (...inputs: BitcoinSignMessageInput[]) => {
    console.log('=====>>>>> _signMessage', inputs);
    const signatures: BitcoinSignMessageOutput[] = [];
    for (const input of inputs) {
      const signType = this.isTaprootAddress(input.account.address) ? 'bip322-simple' : 'ecdsa';
      const signature = await this.provider._signMessageSatsConnect(
        bytesToHex(input.message),
        input.account.address,
        signType,
      );
      signatures.push({
        signature: Buffer.from(signature, 'base64'),
        signedMessage: input.message,
      });
    }
    console.log('=====>>>>> _signMessage result', signatures);

    return signatures;
  };
}

export function registerSatoshiWallet(provider: ProviderBtc, options?: WalletInfo) {
  try {
    registerWallet(new OnekeySatoshiWallet(provider, options));
  } catch (error) {
    console.error(error);
  }
}
