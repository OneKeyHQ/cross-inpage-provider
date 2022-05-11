import { PublicKey, Transaction, SendOptions } from '@solana/web3.js';
import { IInpageProviderConfig } from '@onekeyfe/cross-inpage-provider-core';
import { getOrCreateExtInjectedJsBridge } from '@onekeyfe/extension-bridge-injected';
import { IJsonRpcRequest } from '@onekeyfe/cross-inpage-provider-types';
import base58 from 'bs58';

import { ProviderSolanaBase } from './ProviderSolanaBase';
import { decodeSignedTransaction, encodeTransaction, isWalletEventMethodMatch } from './utils';
import type * as TypeUtils from './type-utils';

export type DisplayEncoding = 'utf8' | 'hex';

export type ConnectOptions = {
  // Only connect when user have connected before, otherwise would throw an error
  onlyIfTrusted?: boolean;
};

export type SolanaRequest = {
  'connect': (params: ConnectOptions | undefined) => Promise<{ publicKey: PublicKey }>;

  'disconnect': () => Promise<void>;

  'signMessage': (params: { message: string; display?: DisplayEncoding }) => Promise<{
    signature: string;
    publicKey: string;
  }>;

  'signTransaction': (params: { message: string }) => Promise<Transaction>;

  'signAllTransactions': (params: { message: string[] }) => Promise<Transaction[]>;

  'signAndSendTransaction': (params: { message: string; options?: SendOptions }) => Promise<{
    signature: string;
    publicKey: string;
  }>;
};

export type JsBridgeRequest = {
  [K in keyof SolanaRequest]: (
    params: Parameters<SolanaRequest[K]>[0],
  ) => Promise<TypeUtils.WireStringified<TypeUtils.ResolvePromise<ReturnType<SolanaRequest[K]>>>>;
};

type JsBridgeRequestParams<T extends keyof JsBridgeRequest> = Parameters<JsBridgeRequest[T]>[0];

type JsBridgeRequestResponse<T extends keyof JsBridgeRequest> = ReturnType<JsBridgeRequest[T]>;

type SolanaProviderState = {
  publicKey: string;
};

const PROVIDER_EVENTS = {
  'connect': 'connect',
  'disconnect': 'disconnect',
  'accountChanged': 'accountChanged',
  'message_low_level': 'message_low_level',
} as const;

type SolanaProviderEventsMap = {
  [PROVIDER_EVENTS.connect]: (publicKey: PublicKey) => void;
  [PROVIDER_EVENTS.disconnect]: () => void;
  [PROVIDER_EVENTS.accountChanged]: (publicKey: PublicKey | null) => void;
  [PROVIDER_EVENTS.message_low_level]: (payload: IJsonRpcRequest) => void;
};

type SolanaAccountInfo = {
  publicKey: string;
};

type SolanaAccountChangedPayload = {
  accounts: SolanaAccountInfo[];
};

interface IProviderSolana extends ProviderSolanaBase {
  readonly isPhantom: true;
  isConnected: boolean;
  publicKey: PublicKey | null;

  /**
   * Connect wallet, and get wallet public key
   * @param {Object} options - Connection options
   * @param {string} options.onlyIfTrusted - Only connect when user have connected before, otherwise would throw an error
   * @emits `connect` on success
   */
  connect(options?: ConnectOptions): Promise<{ publicKey: PublicKey }>;

  /**
   * Disconnect wallet
   */
  disconnect(): Promise<void>;

  /**
   * @deprecated
   * Sign multiple transactions
   * @returns Transaction[]
   */
  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;

  /**
   * @deprecated
   * Sign one transaction
   * @returns Transaction
   */
  signTransaction(transaction: Transaction): Promise<Transaction>;

  /**
   * Sign and send a transaction
   * @returns {Object} Signature and public key
   */
  signAndSendTransaction(
    transaction: Transaction,
    options?: SendOptions,
  ): Promise<{
    publicKey: string;
    signature: string;
  }>;

  /** Sign a message
   * @param message - The message to be signed.
   * @param {string} [display='utf8'] - Specify how the message should be displayed. (default: 'uft8')
   */
  signMessage(
    message: Uint8Array,
    display?: DisplayEncoding,
  ): Promise<{
    signature: Uint8Array;
    publicKey: PublicKey;
  }>;
}

type OneKeySolanaProviderProps = IInpageProviderConfig & {
  timeout?: number;
};

class ProviderSolana extends ProviderSolanaBase implements IProviderSolana {
  public readonly isPhantom = true;

  private _publicKey: PublicKey | null = null;

  get publicKey() {
    return this._publicKey;
  }

  get isConnected() {
    return this._publicKey !== null;
  }

  constructor(props: OneKeySolanaProviderProps) {
    super({
      ...props,
      bridge: props.bridge || getOrCreateExtInjectedJsBridge({ timeout: props.timeout }),
    });

    this._registerEvents();
  }

  private _registerEvents() {
    window.addEventListener('onekey_bridge_disconnect', () => {
      this._handleDisconnected();
    });

    this.on(PROVIDER_EVENTS.message_low_level, (payload) => {
      const { method, params } = payload;

      if (isWalletEventMethodMatch(method, PROVIDER_EVENTS.accountChanged)) {
        this._handleAccountChange(params as SolanaAccountChangedPayload);
      }
    });
  }

  private _callBridge<T extends keyof JsBridgeRequest>(params: {
    method: T;
    params: JsBridgeRequestParams<T>;
  }): JsBridgeRequestResponse<T> {
    return this.bridgeRequest(params) as JsBridgeRequestResponse<T>;
  }

  async connect(options?: ConnectOptions): Promise<{ publicKey: PublicKey }> {
    if (this.publicKey) {
      return { publicKey: this.publicKey };
    }

    // TODO: pass options to connect
    const result = await this._callBridge({
      method: 'connect',
      params: options,
    });

    const publicKey = new PublicKey(result.publicKey);
    this._handleConnected(publicKey);
    return { publicKey };
  }

  private _handleConnected(publicKey: PublicKey, options: { emit: boolean } = { emit: true }) {
    this._publicKey = publicKey;
    options.emit && this.emit('connect', publicKey);
  }

  async disconnect(): Promise<void> {
    await this._callBridge({
      method: 'disconnect',
      params: void 0,
    });
    this._handleDisconnected();
  }

  private _handleDisconnected(options: { emit: boolean } = { emit: true }) {
    this._publicKey = null;
    options.emit && this.emit('disconnect');
  }

  // trigger by bridge account change event
  private _handleAccountChange(payload: SolanaAccountChangedPayload) {
    const account = payload.accounts[0];
    if (!account) {
      return this.emit('accountChanged', null);
    }
    const publicKey = new PublicKey(account.publicKey);
    this._handleConnected(publicKey, { emit: false });
    this.emit('accountChanged', publicKey);
  }

  async signAndSendTransaction(
    transaction: Transaction,
    options?: Partial<SendOptions>,
  ): Promise<{
    publicKey: string;
    signature: string;
  }> {
    return this._handleSignAndSendTransaction({
      message: encodeTransaction(transaction),
      options,
    });
  }

  private async _handleSignAndSendTransaction(params: { message: string; options?: SendOptions }) {
    const result = await this._callBridge({
      method: 'signAndSendTransaction',
      params,
    });
    return result;
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    return this._handleSignTransaction({
      message: encodeTransaction(transaction),
    });
  }

  private async _handleSignTransaction(params: { message: string }) {
    const result = await this._callBridge({
      method: 'signTransaction',
      params,
    });
    return decodeSignedTransaction(result);
  }

  async signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
    return this._handleSignAllTransactions({
      message: transactions.map(encodeTransaction),
    });
  }

  private async _handleSignAllTransactions(params: { message: string[] }) {
    const result = await this._callBridge({
      method: 'signAllTransactions',
      params,
    });
    return result.map(decodeSignedTransaction);
  }

  async signMessage(
    message: Uint8Array,
    display?: DisplayEncoding,
  ): Promise<{
    signature: Uint8Array;
    publicKey: PublicKey;
  }> {
    return this._handleSignMessage({ message, display });
  }

  private async _handleSignMessage(params: {
    message: Uint8Array | string;
    display?: DisplayEncoding;
  }): Promise<{ signature: Uint8Array; publicKey: PublicKey }> {
    const { message, display } = params;

    const result = await this._callBridge({
      method: 'signMessage',
      params: {
        message: typeof message === 'string' ? message : base58.encode(message),
        display,
      },
    });

    return {
      signature: base58.decode(result.signature),
      publicKey: new PublicKey(result.publicKey),
    };
  }

  request<T extends keyof SolanaRequest>(
    method: T,
    params: Parameters<SolanaRequest[T]>[0],
  ): ReturnType<SolanaRequest[T]>;
  request<T extends keyof SolanaRequest>(payload: {
    method: T;
    params: Parameters<SolanaRequest[T]>[0];
  }): ReturnType<SolanaRequest[T]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request<T extends keyof SolanaRequest>(...args: any[]): any {
    let method: T;
    let params: Parameters<SolanaRequest[T]>[0];

    if (typeof args[0] === 'string') {
      method = args[0] as T;
      params = args[1] as Parameters<SolanaRequest[T]>[0];
    } else {
      const payload = args[0] as {
        method: T;
        params: Parameters<SolanaRequest[T]>[0];
      };
      method = payload.method;
      params = payload.params;
    }

    switch (method) {
      case 'connect':
        return this.connect(params as ConnectOptions);
      case 'disconnect':
        return this.disconnect();
      case 'signTransaction':
        return this._handleSignTransaction(params as { message: string });
      case 'signAllTransactions':
        return this._handleSignAllTransactions(params as { message: string[] });
      case 'signMessage':
        return this._handleSignMessage(params as { message: string; display?: DisplayEncoding });
      case 'signAndSendTransaction':
        return this._handleSignAndSendTransaction(
          params as { message: string; options?: SendOptions },
        );
    }
    return this._callBridge({ method, params });
  }

  on<E extends keyof SolanaProviderEventsMap>(
    event: E,
    listener: SolanaProviderEventsMap[E],
  ): this {
    return super.on(event, listener);
  }

  emit<E extends keyof SolanaProviderEventsMap>(
    event: E,
    ...args: Parameters<SolanaProviderEventsMap[E]>
  ): boolean {
    return super.emit(event, ...args);
  }
}

export { ProviderSolana };
