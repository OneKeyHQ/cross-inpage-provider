import { PublicKey, VersionedTransaction } from '@solana/web3.js';
import type { SendOptions, Transaction } from '@solana/web3.js';
import { IInpageProviderConfig } from '@onekeyfe/cross-inpage-provider-core';
import { getOrCreateExtInjectedJsBridge } from '@onekeyfe/extension-bridge-injected';
import { IJsonRpcRequest } from '@onekeyfe/cross-inpage-provider-types';
import base58 from 'bs58';

import { ProviderSolanaBase } from './ProviderSolanaBase';
import {
  decodeSignedTransaction,
  encodeTransaction,
  isWalletEventMethodMatch,
  normalizeRequiredSigners,
} from './utils';
import type { IRequiredSigner } from './utils';
import type * as TypeUtils from './type-utils';

export type DisplayEncoding = 'utf8' | 'hex';

/**
 * Offchain message specification version carried over the bridge.
 *
 * Version 0 is intentionally absent: it carries a message format enum that cannot be determined
 * at the protocol level, a redundant u16 length prefix, an unordered/non-unique signer list and a
 * spoofable application domain — all removed by version 1.
 * See https://github.com/solana-foundation/SRFCs/discussions/3
 */
export type OffchainMessageVersion = 1;

export const OFFCHAIN_MESSAGE_VERSION_V1: OffchainMessageVersion = 1;

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

  /**
   * Sign an offchain message conforming to version 1 of the Solana offchain message
   * specification (https://github.com/solana-foundation/SRFCs/discussions/3).
   *
   * Version 0 is intentionally not supported: it carries a message format enum that cannot be
   * determined at the protocol level, a redundant u16 length prefix, an unordered/non-unique
   * signer list and a spoofable application domain — all removed by version 1.
   *
   * The wallet is responsible for building the preamble (signing domain, version byte and the
   * lexicographically sorted, de-duplicated signer list) and returns the exact bytes it signed.
   */
  'solSignOffchainMessage': (params: {
    /**
     * Offchain message specification version, the discriminant the wallet dispatches on.
     * Only 1 is accepted today; the wallet must reject any other value rather than guess.
     */
    version: OffchainMessageVersion;
    /** UTF-8 message body, verbatim. The wallet encodes it, not the dapp. */
    message: string;
    /** Base58 encoded 32-byte signer public keys. The wallet sorts and de-duplicates them. */
    requiredSigners: string[];
  }) => Promise<{
    signature: string;
    publicKey: string;
    /** Base58 encoded preamble + body bytes the wallet actually signed. */
    signedOffchainMessage: string;
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
  readonly isSolflare: true;
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
  signAllTransactions(
    transactions: (Transaction | VersionedTransaction)[],
  ): Promise<(Transaction | VersionedTransaction)[]>;

  /**
   * @deprecated
   * Sign one transaction
   * @returns Transaction
   */
  signTransaction(
    transaction: Transaction | VersionedTransaction,
  ): Promise<Transaction | VersionedTransaction>;

  /**
   * Sign and send a transaction
   * @returns {Object} Signature and public key
   */
  signAndSendTransaction(
    transaction: Transaction | VersionedTransaction,
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

  /** Sign a version 1 Solana offchain message
   * @param message - UTF-8 message body. The wallet wraps it with the specified preamble.
   * @param requiredSigners - 32-byte signer public keys, base58 encoded or raw bytes.
   */
  solSignOffchainMessage(
    message: string,
    requiredSigners: readonly IRequiredSigner[],
  ): Promise<{
    signature: Uint8Array;
    publicKey: PublicKey;
    signedOffchainMessage: Uint8Array;
  }>;
}

type OneKeySolanaProviderProps = IInpageProviderConfig & {
  timeout?: number;
};

class ProviderSolana extends ProviderSolanaBase implements IProviderSolana {
  public readonly isPhantom = true;
  public readonly isSolflare = true;

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
    this._registerEvents = this._registerEvents.bind(this);
    this._callBridge = this._callBridge.bind(this);
    this._handleAccountChange = this._handleAccountChange.bind(this);
    this._handleConnected = this._handleConnected.bind(this);
    this._handleDisconnected = this._handleDisconnected.bind(this);
    this._handleSignAndSendTransaction = this._handleSignAndSendTransaction.bind(this);
    this._handleSignTransaction = this._handleSignTransaction.bind(this);
    this._handleSignAllTransactions = this._handleSignAllTransactions.bind(this);
    this._handleSignMessage = this._handleSignMessage.bind(this);

    this.request = this.request.bind(this);
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.signAndSendTransaction = this.signAndSendTransaction.bind(this);
    this.signTransaction = this.signTransaction.bind(this);
    this.signAllTransactions = this.signAllTransactions.bind(this);
    this.signMessage = this.signMessage.bind(this);
    this.solSignOffchainMessage = this.solSignOffchainMessage.bind(this);
    this.isAccountsChanged = this.isAccountsChanged.bind(this);
    this.bridgeRequest = this.bridgeRequest.bind(this);

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

  private postMessage(param: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this._callBridge(param);
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
    this._handleConnected(publicKey, { emit: true });
    return { publicKey };
  }

  private _handleConnected(publicKey: PublicKey, options: { emit: boolean } = { emit: true }) {
    this._publicKey = publicKey;
    if (options.emit && this.isConnectionStatusChanged('connected')) {
      this.connectionStatus = 'connected';
      this.emit('connect', publicKey);
      this.emit('accountChanged', publicKey);
    }
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
    if (options.emit && this.isConnectionStatusChanged('disconnected')) {
      this.connectionStatus = 'disconnected';
      this.emit('disconnect');
      this.emit('accountChanged', null);
    }
  }

  override isAccountsChanged(account: SolanaAccountInfo | undefined) {
    return account?.publicKey !== this._publicKey?.toBase58();
  }

  // trigger by bridge account change event
  private _handleAccountChange(payload: SolanaAccountChangedPayload) {
    const account = payload.accounts[0];
    let publicKey: PublicKey | undefined;
    try {
      publicKey = new PublicKey(account.publicKey);
    } catch (error) {
      // noop
    }
    if (this.isAccountsChanged(account)) {
      this.emit('accountChanged', publicKey || null);
    }
    if (!account) {
      this._handleDisconnected();
      return;
    }
    if (publicKey) {
      this._handleConnected(publicKey, { emit: false });
    }
  }

  async signAndSendTransaction(
    transaction: Transaction | VersionedTransaction,
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

  async signTransaction(
    transaction: Transaction | VersionedTransaction,
  ): Promise<Transaction | VersionedTransaction> {
    const hasVersionedTx = 'version' in transaction;
    return this._handleSignTransaction(
      {
        message: encodeTransaction(transaction),
      },
      {
        onlyVersionedTx: hasVersionedTx,
      },
    );
  }

  private async _handleSignTransaction(
    params: {
      message: string;
    },
    options?: { onlyVersionedTx?: boolean },
  ) {
    const { onlyVersionedTx } = options || {};

    const result = await this._callBridge({
      method: 'signTransaction',
      params,
    });
    return decodeSignedTransaction({
      message: result,
      onlyVersionedTx,
    });
  }

  async signAllTransactions(
    transactions: (Transaction | VersionedTransaction)[],
  ): Promise<(Transaction | VersionedTransaction)[]> {
    return this._handleSignAllTransactions({
      message: transactions.map(encodeTransaction),
    });
  }

  private async _handleSignAllTransactions(params: { message: string[] }) {
    const result = await this._callBridge({
      method: 'signAllTransactions',
      params,
    });
    return result.map((message) => decodeSignedTransaction({ message }));
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

  async solSignOffchainMessage(
    message: string,
    requiredSigners: readonly IRequiredSigner[],
  ): Promise<{
    signature: Uint8Array;
    publicKey: PublicKey;
    signedOffchainMessage: Uint8Array;
  }> {
    if (typeof message !== 'string') {
      throw new Error('solSignOffchainMessage: message must be a UTF-8 string');
    }
    if (message.length === 0) {
      throw new Error('solSignOffchainMessage: message must not be empty');
    }

    const encodedSigners = normalizeRequiredSigners(requiredSigners);

    const result = await this._callBridge({
      method: 'solSignOffchainMessage',
      params: {
        version: OFFCHAIN_MESSAGE_VERSION_V1,
        message,
        requiredSigners: encodedSigners,
      },
    });

    // A wallet that predates offchain message v1 answers the v0 shape, without the bytes it
    // signed. Say so plainly instead of letting bs58 throw "Expected String" on undefined.
    if (typeof result?.signedOffchainMessage !== 'string') {
      throw new Error(
        'solSignOffchainMessage: the wallet did not return signedOffchainMessage, it does not support offchain message v1',
      );
    }

    return {
      signature: base58.decode(result.signature),
      publicKey: new PublicKey(result.publicKey),
      signedOffchainMessage: base58.decode(result.signedOffchainMessage),
    };
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
      case 'solSignOffchainMessage': {
        // Routed through the typed method so `version` is always set. Passing these params
        // straight to the bridge would let a caller omit it, and the wallet would then treat a
        // UTF-8 body as a base58 version 0 message.
        const offchainParams = params as {
          version?: number;
          message: string;
          requiredSigners: readonly IRequiredSigner[];
        };
        // Reject an unknown version rather than silently signing it as v1.
        if (
          offchainParams?.version !== undefined &&
          offchainParams.version !== OFFCHAIN_MESSAGE_VERSION_V1
        ) {
          throw new Error(
            `solSignOffchainMessage: unsupported offchain message version ${offchainParams.version}, only version ${OFFCHAIN_MESSAGE_VERSION_V1} is supported`,
          );
        }
        return this.solSignOffchainMessage(
          offchainParams?.message,
          offchainParams?.requiredSigners,
        );
      }
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
