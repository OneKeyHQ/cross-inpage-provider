import {
  SolanaSignAndSendTransaction,
  type SolanaSignAndSendTransactionFeature,
  type SolanaSignAndSendTransactionMethod,
  type SolanaSignAndSendTransactionOutput,
  SolanaSignMessage,
  type SolanaSignMessageFeature,
  type SolanaSignMessageMethod,
  type SolanaSignMessageOutput,
  SolanaSignOffchainMessage,
  type SolanaSignOffchainMessageFeature,
  type SolanaSignOffchainMessageMethod,
  type SolanaSignOffchainMessageOutput,
  SolanaSignTransaction,
  type SolanaSignTransactionFeature,
  type SolanaSignTransactionMethod,
  type SolanaSignTransactionOutput,
} from '@solana/wallet-standard-features';
import type { Wallet, WalletIcon } from '@wallet-standard/base';
import {
  StandardConnect,
  type StandardConnectFeature,
  type StandardConnectMethod,
  StandardDisconnect,
  type StandardDisconnectFeature,
  type StandardDisconnectMethod,
  StandardEvents,
  type StandardEventsFeature,
  type StandardEventsListeners,
  type StandardEventsNames,
  type StandardEventsOnMethod,
} from '@wallet-standard/features';
import bs58 from 'bs58';

import {OneKeySolanaWalletAccount} from './account';
import {SOLANA_CHAINS, SolanaChain, isSolanaChain} from './solana'
import { bytesEqual, parseToNativeTx } from '../utils';

import {ProviderSolana } from '../ProviderSolana'
import { WalletInfo } from './types';

export const OneKeyNamespace = 'onekey:';

export type OneKeyFeature = {
    [OneKeyNamespace]: {
        onekey: ProviderSolana;
    };
};


export class OneKeySolanaStandardWallet implements Wallet {
  readonly #listeners: { [E in StandardEventsNames]?: StandardEventsListeners[E][] } = {};
  readonly #version = '1.0.0' as const;
  readonly #name: string;
  readonly #icon: WalletIcon;
  #account: OneKeySolanaWalletAccount | null = null;
  readonly #provider: ProviderSolana;

  get version() {
      return this.#version;
  }

  get name() {
      return this.#name;
  }

  get icon() {
      return this.#icon;
  }

  get chains() {
      return SOLANA_CHAINS.slice();
  }

  get features(): StandardConnectFeature &
      StandardDisconnectFeature &
      StandardEventsFeature &
      SolanaSignAndSendTransactionFeature &
      SolanaSignTransactionFeature &
      SolanaSignMessageFeature &
      SolanaSignOffchainMessageFeature &
      OneKeyFeature {
      return {
          [StandardConnect]: {
              version: '1.0.0',
              connect: this.#connect,
          },
          [StandardDisconnect]: {
              version: '1.0.0',
              disconnect: this.#disconnect,
          },
          [StandardEvents]: {
              version: '1.0.0',
              on: this.#on,
          },
          [SolanaSignAndSendTransaction]: {
              version: '1.0.0',
              supportedTransactionVersions: ['legacy', 0],
              signAndSendTransaction: this.#signAndSendTransaction,
          },
          [SolanaSignTransaction]: {
              version: '1.0.0',
              supportedTransactionVersions: ['legacy', 0],
              signTransaction: this.#signTransaction,
          },
          [SolanaSignMessage]: {
              version: '1.0.0',
              signMessage: this.#signMessage,
          },
          [SolanaSignOffchainMessage]: {
              version: '1.0.0',
              // Version 0 of the offchain message spec is deliberately unsupported.
              supportedMessageVersions: [1],
              signOffchainMessage: this.#signOffchainMessage,
          },
          [OneKeyNamespace]: {
              onekey: this.#provider,
          },
      };
  }

  get accounts() {
      return this.#account ? [this.#account] : [];
  }

  constructor(provider: ProviderSolana, options: WalletInfo) {
      if (new.target === OneKeySolanaStandardWallet) {
          Object.freeze(this);
      }

      this.#provider = provider;
      this.#icon = options.icon
      this.#name = options.name || 'OneKey'

      provider.on('connect', this.#connected,);
      provider.on('disconnect', this.#disconnected);
      provider.on('accountChanged', this.#reconnected);

      this.#connected();
  }

  #on: StandardEventsOnMethod = (event, listener) => {
      this.#listeners[event]?.push(listener) || (this.#listeners[event] = [listener]);
      return (): void => this.#off(event, listener);
  };

  #emit<E extends StandardEventsNames>(event: E, ...args: Parameters<StandardEventsListeners[E]>): void {
      // eslint-disable-next-line prefer-spread
      this.#listeners[event]?.forEach((listener) => listener.apply(null, args));
  }

  #off<E extends StandardEventsNames>(event: E, listener: StandardEventsListeners[E]): void {
      this.#listeners[event] = this.#listeners[event]?.filter((existingListener) => listener !== existingListener);
  }

  #connected = () => {
      const address = this.#provider.publicKey?.toBase58();
      if (address) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const publicKey = this.#provider.publicKey!.toBytes();

          const account = this.#account;
          if (!account || account.address !== address || !bytesEqual(account.publicKey, publicKey)) {
              this.#account = new OneKeySolanaWalletAccount({ address, publicKey });
              this.#emit('change', { accounts: this.accounts });
          }
      }
  };

  #disconnected = () => {
      if (this.#account) {
          this.#account = null;
          this.#emit('change', { accounts: this.accounts });
      }
  };

  #reconnected = () => {
      if (this.#provider.publicKey) {
          this.#connected();
      } else {
          this.#disconnected();
      }
  };

  #connect: StandardConnectMethod = async ({ silent } = {}) => {
      if (!this.#account) {
          await this.#provider.connect(silent ? { onlyIfTrusted: true } : undefined);
      }

      this.#connected();

      return { accounts: this.accounts };
  };

  #disconnect: StandardDisconnectMethod = async () => {
      await this.#provider.disconnect();
  };

  #signAndSendTransaction: SolanaSignAndSendTransactionMethod = async (...inputs) => {
      if (!this.#account) throw new Error('not connected');

      const outputs: SolanaSignAndSendTransactionOutput[] = [];

      if (inputs.length === 1) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const { transaction, account, chain, options } = inputs[0]!;
          const { minContextSlot, preflightCommitment, skipPreflight, maxRetries } = options || {};
          if (account !== this.#account) throw new Error('invalid account');
          if (!isSolanaChain(chain)) throw new Error('invalid chain');

          const { signature } = await this.#provider.signAndSendTransaction(
            parseToNativeTx(transaction),
              {
                  preflightCommitment,
                  minContextSlot,
                  maxRetries,
                  skipPreflight,
              }
          );

          outputs.push({ signature: bs58.decode(signature) });
      } else if (inputs.length > 1) {
          for (const input of inputs) {
              outputs.push(...(await this.#signAndSendTransaction(input)));
          }
      }

      return outputs;
  };

  #signTransaction: SolanaSignTransactionMethod = async (...inputs) => {
      if (!this.#account) throw new Error('not connected');

      const outputs: SolanaSignTransactionOutput[] = [];

      if (inputs.length === 1) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const { transaction, account, chain } = inputs[0]!;
          if (account !== this.#account) throw new Error('invalid account');
          if (chain && !isSolanaChain(chain)) throw new Error('invalid chain');

          const signedTransaction = await this.#provider.signTransaction(parseToNativeTx(transaction));

          outputs.push({ signedTransaction: signedTransaction.serialize({ requireAllSignatures:false }) });
      } else if (inputs.length > 1) {
          let chain: SolanaChain | undefined = undefined;
          for (const input of inputs) {
              if (input.account !== this.#account) throw new Error('invalid account');
              if (input.chain) {
                  if (!isSolanaChain(input.chain)) throw new Error('invalid chain');
                  if (chain) {
                      if (input.chain !== chain) throw new Error('conflicting chain');
                  } else {
                      chain = input.chain;
                  }
              }
          }

          const transactions = inputs.map(({ transaction }) => parseToNativeTx(transaction));

          const signedTransactions = await this.#provider.signAllTransactions(transactions);

          outputs.push(
              ...signedTransactions.map((signedTransaction) => ({ signedTransaction: signedTransaction.serialize({ requireAllSignatures: false }) }))
          );
      }

      return outputs;
  };

  #signMessage: SolanaSignMessageMethod = async (...inputs) => {
      if (!this.#account) throw new Error('not connected');

      const outputs: SolanaSignMessageOutput[] = [];

      if (inputs.length === 1) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const { message, account } = inputs[0]!;
          if (account !== this.#account) throw new Error('invalid account');

          const { signature } = await this.#provider.signMessage(message);

          outputs.push({ signedMessage: message, signature });
      } else if (inputs.length > 1) {
          for (const input of inputs) {
              outputs.push(...(await this.#signMessage(input)));
          }
      }

      return outputs;
  };

  #signOffchainMessage: SolanaSignOffchainMessageMethod = async (...inputs) => {
      if (!this.#account) throw new Error('not connected');

      const outputs: SolanaSignOffchainMessageOutput[] = [];

      if (inputs.length === 1) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const { account, message, messageVersion, requiredSigners } = inputs[0]!;
          if (account !== this.#account) throw new Error('invalid account');
          // Only version 1 of the offchain message spec is supported.
          if (messageVersion !== 1) throw new Error('invalid message version');
          if (!requiredSigners?.length) throw new Error('requiredSigners must not be empty');
          if (!requiredSigners.some((signer) => bytesEqual(signer, account.publicKey))) {
              throw new Error('requiredSigners must contain the public key of account');
          }

          const { signature, signedOffchainMessage, publicKey } =
              await this.#provider.solSignOffchainMessage(
                  message,
                  requiredSigners.map((signer) => Uint8Array.from(signer)),
              );

          // The dapp verifies against the account it named, so a wallet that signed with a
          // different key must fail here rather than return an unverifiable signature.
          if (!bytesEqual(publicKey.toBytes(), account.publicKey)) {
              throw new Error('wallet signed with a different account');
          }

          outputs.push({ signedOffchainMessage, signature, signatureType: 'ed25519' });
      } else if (inputs.length > 1) {
          for (const input of inputs) {
              outputs.push(...(await this.#signOffchainMessage(input)));
          }
      }

      return outputs;
  };
}
