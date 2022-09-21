import { IInpageProviderConfig } from '@onekeyfe/cross-inpage-provider-core';
import { getOrCreateExtInjectedJsBridge } from '../../../extension/extension-bridge-injected/dist';
import { ProviderAptosBase } from './ProviderAptosBase';
import { AptosAccountInfo, SignMessagePayload, SignMessageResponse } from './types';
import type * as TypeUtils from './type-utils';
import { IJsonRpcRequest } from '@onekeyfe/cross-inpage-provider-types';
import { web3Errors } from '@onekeyfe/cross-inpage-provider-errors';

const PROVIDER_EVENTS = {
  'connect': 'connect',
  'disconnect': 'disconnect',
  'accountChanged': 'accountChanged',
  'networkChange': 'networkChange',
  'message_low_level': 'message_low_level',
} as const;

type AptosProviderEventsMap = {
  [PROVIDER_EVENTS.connect]: (address: string) => void;
  [PROVIDER_EVENTS.disconnect]: () => void;
  [PROVIDER_EVENTS.accountChanged]: (address: string | null) => void;
  [PROVIDER_EVENTS.networkChange]: (name: string | null) => void;
  [PROVIDER_EVENTS.message_low_level]: (payload: IJsonRpcRequest) => void;
};

export type AptosRequest = {
  'connect': () => Promise<AptosAccountInfo>;

  'disconnect': () => Promise<void>;

  'account': () => Promise<AptosAccountInfo>;

  'network': () => Promise<string>;

  'getNetworkURL': () => Promise<string>;

  'signMessage': (payload: SignMessagePayload) => Promise<SignMessageResponse>;

  'signAndSubmitTransaction': (transactions: any) => Promise<string>;
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
  protected _account: AptosAccountInfo | null = null;

  get publicKey() {
    return this._account?.publicKey ?? null;
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
  }): JsBridgeRequestResponse<T> {
    return this.bridgeRequest(params) as JsBridgeRequestResponse<T>;
  }

  async connect(): Promise<AptosAccountInfo> {
    if (this._account) {
      return Promise.resolve(this._account);
    }

    const result = await this._callBridge({
      method: 'connect',
      params: undefined,
    });

    if (!result) throw web3Errors.provider.unauthorized();

    this._handleConnected(result, { emit: true });

    return result;
  }

  isConnected() {
    return this._account !== null;
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
    const res = await this._callBridge({
      method: 'signAndSubmitTransaction',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      params: transactions,
    });
    if (!res) throw web3Errors.provider.unauthorized();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return JSON.parse(res);
  }

  signMessage(payload: SignMessagePayload): Promise<SignMessageResponse> {
    return this._callBridge({
      method: 'signMessage',
      params: payload,
    });
  }

  network(): Promise<string> {
    return this._callBridge({
      method: 'network',
      params: undefined,
    });
  }

  getNetworkURL(): Promise<string> {
    return this._callBridge({
      method: 'getNetworkURL',
      params: undefined,
    });
  }

  private _handleConnected(account: AptosAccountInfo, options: { emit: boolean } = { emit: true }) {
    this._account = account;
    options.emit && this.emit('connect', account?.address);
  }

  async disconnect(): Promise<void> {
    await this._callBridge({
      method: 'disconnect',
      params: void 0,
    });
    this._handleDisconnected();
  }

  private _handleDisconnected(options: { emit: boolean } = { emit: true }) {
    this._account = null;
    options.emit && this.emit('disconnect');
  }

  // trigger by bridge account change event
  private _handleAccountChange(payload: AptosAccountInfo) {
    const account = payload;
    if (!account) {
      this._handleDisconnected();
      return this.emit('accountChanged', null);
    }

    this._handleConnected(account, { emit: false });
    this.emit('accountChanged', account.address ?? null);
  }

  private _handleNetworkChange(payload: string) {
    const network = payload;

    this.emit('networkChange', network ?? null);
  }

  onNetworkChange(listener: AptosProviderEventsMap['networkChange']): this {
    return super.on(PROVIDER_EVENTS.networkChange, listener);
  }

  onAccountChange(listener: AptosProviderEventsMap['accountChanged']): this {
    return super.on(PROVIDER_EVENTS.networkChange, listener);
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
