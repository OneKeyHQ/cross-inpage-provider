/* eslint-disable @typescript-eslint/no-explicit-any */
import { IInpageProviderConfig } from '@onekeyfe/cross-inpage-provider-core';
import { getOrCreateExtInjectedJsBridge } from '@onekeyfe/extension-bridge-injected';
import { ProviderAptosBase } from './ProviderAptosBase';
import {
  AptosAccountInfo,
  ProviderState,
  SignMessagePayload,
  SignMessagePayloadCompatible,
  SignMessageResponse,
  SignMessageResponseCompatible,
} from './types';
import type * as TypeUtils from './type-utils';
import { IJsonRpcRequest } from '@onekeyfe/cross-inpage-provider-types';
import { web3Errors } from '@onekeyfe/cross-inpage-provider-errors';
import type { Types } from 'aptos';
import type { AccountAuthenticator, PendingTransactionResponse } from '@aptos-labs/ts-sdk';
import {
  AccountAuthenticatorEd25519,
  Ed25519PublicKey,
  Ed25519Signature,
} from '@aptos-labs/ts-sdk';
import {
  AptosSignAndSubmitTransactionInput,
  AptosSignAndSubmitTransactionOutput,
} from '@aptos-labs/wallet-standard';
import { serializeTransactionPayload } from '@onekeyfe/onekey-aptos-provider-utils';
import type { TransactionPayloadV1SDK } from '@onekeyfe/onekey-aptos-provider-utils';

export type AptosProviderType = 'petra' | 'martian';

type SignTransactionV2Params = {
  transaction: string;
  transactionType: 'simple' | 'multi_agent';
  asFeePayer?: boolean;
};

const PROVIDER_EVENTS = {
  'connect': 'connect',
  'disconnect': 'disconnect',
  'accountChanged': 'accountChanged',
  'networkChange': 'networkChange',
  'accountChangedV2': 'accountChangedV2',
  'message_low_level': 'message_low_level',
} as const;

type AptosProviderEventsMap = {
  [PROVIDER_EVENTS.connect]: (account: string) => void;
  [PROVIDER_EVENTS.disconnect]: () => void;
  [PROVIDER_EVENTS.accountChanged]: (account: string | null) => void;
  [PROVIDER_EVENTS.networkChange]: (name: string | null) => void;
  [PROVIDER_EVENTS.accountChangedV2]: (account: AptosAccountInfo | null) => void;
  [PROVIDER_EVENTS.message_low_level]: (payload: IJsonRpcRequest) => void;
};

export type AptosRequest = {
  'connect': () => Promise<AptosAccountInfo>;

  'disconnect': () => Promise<void>;

  'account': () => Promise<AptosAccountInfo>;

  'network': () => Promise<string>;

  'getNetworkURL': () => Promise<string>;

  'signMessage': (payload: SignMessagePayloadCompatible) => Promise<SignMessageResponseCompatible>;

  'signAndSubmitTransaction': (transactions: string) => Promise<string>;

  'signTransaction': (transactions: string) => Promise<string>;

  'signTransactionV2': (params: SignTransactionV2Params) => Promise<{
    type: 'ed25519' | 'multi_ed25519' | 'secp256k1';
    signature: string;
    publicKey: string;
  }>;

  // Standard Wallet V1.1.0
  'signAndSubmitTransactionV2': (params: string) => Promise<AptosSignAndSubmitTransactionOutput>;
  // Standard Wallet V1.0.0
  'signAndSubmitTransactionStandardV1': (params: string) => Promise<string>;
};

type JsBridgeRequest = {
  [K in keyof AptosRequest]: (
    params: Parameters<AptosRequest[K]>[0],
  ) => Promise<TypeUtils.WireStringified<TypeUtils.ResolvePromise<ReturnType<AptosRequest[K]>>>>;
};

type JsBridgeRequestParams<T extends keyof JsBridgeRequest> = Parameters<JsBridgeRequest[T]>[0];

type JsBridgeRequestResponse<T extends keyof JsBridgeRequest> = ReturnType<JsBridgeRequest[T]>;

export type PROVIDER_EVENTS_STRINGS = keyof typeof PROVIDER_EVENTS;

export interface IProviderAptos extends ProviderAptosBase {
  publicKey: string | null;

  /**
   * Connect wallet, and get wallet info
   * @emits `connect` on success
   */
  connect(): Promise<AptosAccountInfo>;

  isConnected(): boolean;

  /**
   * Disconnect wallet
   */
  disconnect(): Promise<void>;

  /**
   * Connect wallet, and get wallet info
   */
  account(): Promise<AptosAccountInfo>;

  /**
   * Sign and submit transactions
   * @returns Transaction
   */
  signAndSubmitTransaction(transactions: any): Promise<any>;

  signTransaction(transactions: any): Promise<any>;

  signTransactionV2(params: SignTransactionV2Params): Promise<AccountAuthenticator>;
  signAndSubmitTransactionV2(
    params: AptosSignAndSubmitTransactionInput,
  ): Promise<AptosSignAndSubmitTransactionOutput>;

  signAndSubmitTransactionStandardV1(params: string): Promise<PendingTransactionResponse>;

  /**
   * Sign message
   * @returns Transaction
   */
  signMessage(payload: SignMessagePayload): Promise<SignMessageResponse>;

  network(): Promise<string>;

  getNetworkURL(): Promise<string>;
}

type OneKeyAptosProviderProps = IInpageProviderConfig & {
  timeout?: number;
};

function isWalletEventMethodMatch({ method, name }: { method: string; name: string }) {
  return method === `wallet_events_${name}`;
}

class ProviderAptos extends ProviderAptosBase implements IProviderAptos {
  readonly isAIP62Standard = true;
  readonly isSignTransactionV1_1 = false;

  protected _state: ProviderState = {
    account: null,
  };

  protected aptosProviderType: AptosProviderType = 'petra';

  get publicKey() {
    return this._state?.account?.publicKey ?? null;
  }

  get accountInfoOneKey() {
    return this._state?.account ?? null;
  }

  constructor(props: OneKeyAptosProviderProps) {
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
      if (!payload) return;
      const { method, params } = payload;

      if (isWalletEventMethodMatch({ method, name: PROVIDER_EVENTS.accountChanged })) {
        this._handleAccountChange(params as AptosAccountInfo);
      }

      if (isWalletEventMethodMatch({ method, name: PROVIDER_EVENTS.networkChange })) {
        this._handleNetworkChange(params as string);
      }
    });
  }

  private _callBridge<T extends keyof JsBridgeRequest>(params: {
    method: T;
    params: JsBridgeRequestParams<T>;
    aptosProviderType?: AptosProviderType;
  }): JsBridgeRequestResponse<T> {
    params.aptosProviderType = this.aptosProviderType;
    return this.bridgeRequest(params) as JsBridgeRequestResponse<T>;
  }

  private _handleConnected(account: AptosAccountInfo, options: { emit: boolean } = { emit: true }) {
    this._state.account = {
      publicKey: account.publicKey,
      address: account.address,
    };
    if (this.isConnectionStatusChanged('connected')) {
      this.connectionStatus = 'connected';
      if (options.emit) {
        const address = account?.address ?? null;
        this.emit('connect', address);
        this.emit('accountChanged', address);
        this.emit('accountChangedV2', account);
      }
    }
  }

  private _handleDisconnected(options: { emit: boolean } = { emit: true }) {
    this._state.account = null;
    if (this.isConnectionStatusChanged('disconnected')) {
      this.connectionStatus = 'disconnected';
      if (options.emit) {
        this.emit('disconnect');
        this.emit('accountChanged', null);
        this.emit('accountChangedV2', null);
      }
    }
  }

  override isAccountsChanged(account: AptosAccountInfo | undefined) {
    return account?.address !== this._state.account?.address;
  }

  // trigger by bridge account change event
  private _handleAccountChange(payload: AptosAccountInfo) {
    const account = payload;
    if (this.isAccountsChanged(account)) {
      this.emit('accountChanged', account?.address ?? null);
      this.emit('accountChangedV2', account);
    }
    if (!account) {
      this._handleDisconnected();
      return;
    }

    this._handleConnected(account, { emit: false });
  }

  private _network: string | null | undefined;
  override isNetworkChanged(network: string) {
    return this._network === undefined || network !== this._network;
  }

  private _handleNetworkChange(payload: string) {
    const network = payload;
    if (this.isNetworkChanged(network)) {
      this.emit('networkChange', network || null);
    }
    this._network = network;
  }

  async connect(): Promise<AptosAccountInfo> {
    if (this._state.account) {
      return Promise.resolve(this._state.account);
    }

    const result = await this._callBridge({
      method: 'connect',
      params: undefined,
    });

    if (!result) throw web3Errors.provider.unauthorized();

    this._handleConnected(result, { emit: false });

    return result;
  }

  isConnected() {
    return !!this._state.account;
  }

  async account(): Promise<AptosAccountInfo> {
    const res = await this._callBridge({
      method: 'account',
      params: undefined,
    });

    if (!res) throw web3Errors.provider.unauthorized();

    return Promise.resolve(res);
  }

  async signAndSubmitTransaction(transactions: any): Promise<any> {
    const serialize = serializeTransactionPayload(transactions as TransactionPayloadV1SDK);
    const res = await this._callBridge({
      method: 'signAndSubmitTransaction',
      params: serialize,
    });
    if (!res) throw web3Errors.provider.unauthorized();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return JSON.parse(res);
  }

  async signTransaction(transactions: Types.TransactionPayload): Promise<any> {
    const serialize = serializeTransactionPayload(transactions);

    const res = await this._callBridge({
      method: 'signTransaction',
      params: serialize,
    });
    if (!res) throw web3Errors.provider.unauthorized();

    return new Uint8Array(Buffer.from(res, 'hex'));
  }

  async signTransactionV2(params: SignTransactionV2Params): Promise<AccountAuthenticator> {
    const res = await this._callBridge({
      method: 'signTransactionV2',
      params: {
        transaction: params.transaction,
        transactionType: params.transactionType,
        asFeePayer: params.asFeePayer,
      },
    });
    if (!res) throw web3Errors.provider.unauthorized();

    if (res.type === 'ed25519') {
      return new AccountAuthenticatorEd25519(
        new Ed25519PublicKey(res.publicKey),
        new Ed25519Signature(res.signature),
      );
    }

    throw new Error('Unsupported sign type');
  }

  async signAndSubmitTransactionV2(
    params: AptosSignAndSubmitTransactionInput,
  ): Promise<AptosSignAndSubmitTransactionOutput> {
    const serialize = serializeTransactionPayload(params.payload);
    const param = {
      gasUnitPrice: params.gasUnitPrice,
      maxGasAmount: params.maxGasAmount,
      payload: serialize,
    };
    return this._callBridge({
      method: 'signAndSubmitTransactionV2',
      params: JSON.stringify(param),
    });
  }

  async signAndSubmitTransactionStandardV1(params: string): Promise<PendingTransactionResponse> {
    const res = await this._callBridge({
      method: 'signAndSubmitTransactionStandardV1',
      params,
    });
    if (!res) throw web3Errors.provider.unauthorized();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return JSON.parse(res);
  }

  async signMessageCompatible(
    payload: SignMessagePayloadCompatible,
  ): Promise<SignMessageResponseCompatible> {
    return this._callBridge({
      method: 'signMessage',
      params: payload,
    });
  }

  async signMessage(payload: SignMessagePayload): Promise<SignMessageResponse> {
    const payloadCompatible: SignMessagePayloadCompatible = {
      ...payload,
      nonce: payload.nonce.toString(),
    };

    const signMessageCompatible = await this.signMessageCompatible(payloadCompatible);

    return {
      ...signMessageCompatible,
      nonce: parseInt(signMessageCompatible.nonce),
    };
  }

  network(): Promise<string> {
    return this._callBridge({
      method: 'network',
      params: undefined,
    });
  }

  async getNetwork(): Promise<{
    name: string;
    url: string;
    chainId: number;
  }> {
    const name = await this._callBridge({
      method: 'network',
      params: undefined,
    });

    const url = await this._callBridge({
      method: 'getNetworkURL',
      params: undefined,
    });

    // see more chainID https://aptos.dev/nodes/networks
    const chainId = name === 'Mainnet' ? 1 : 2;

    return {
      name,
      url,
      chainId,
    };
  }

  getNetworkURL(): Promise<string> {
    return this._callBridge({
      method: 'getNetworkURL',
      params: undefined,
    });
  }

  async disconnect(): Promise<void> {
    await this._callBridge({
      method: 'disconnect',
      params: void 0,
    });
    this._handleDisconnected();
  }

  onNetworkChange(listener: AptosProviderEventsMap['networkChange']): this {
    return super.on(PROVIDER_EVENTS.networkChange, listener);
  }

  onAccountChange(listener: AptosProviderEventsMap['accountChanged']): this {
    return super.on(PROVIDER_EVENTS.accountChanged, listener);
  }

  onAccountChangeStandardV2(listener: AptosProviderEventsMap['accountChangedV2']): this {
    return super.on(PROVIDER_EVENTS.accountChangedV2, listener);
  }

  onDisconnect(listener: AptosProviderEventsMap['disconnect']): this {
    return super.on(PROVIDER_EVENTS.disconnect, listener);
  }

  on<E extends keyof AptosProviderEventsMap>(event: E, listener: AptosProviderEventsMap[E]): this {
    return super.on(event, listener);
  }

  emit<E extends keyof AptosProviderEventsMap>(
    event: E,
    ...args: Parameters<AptosProviderEventsMap[E]>
  ): boolean {
    return super.emit(event, ...args);
  }
}

export { ProviderAptos };
