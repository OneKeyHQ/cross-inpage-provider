import type { IInpageProviderConfig } from '@onekeyfe/cross-inpage-provider-core';
import { getOrCreateExtInjectedJsBridge } from '@onekeyfe/extension-bridge-injected';
import { ProviderSuiBase } from './ProviderSuiBase';
import type * as TypeUtils from './type-utils';
import type { IJsonRpcRequest } from '@onekeyfe/cross-inpage-provider-types';
import { web3Errors } from '@onekeyfe/cross-inpage-provider-errors';

import type {
  MoveCallTransaction,
  SignableTransaction,
  SuiAddress,
  SuiTransactionResponse,
} from '@mysten/sui.js';
import { ALL_PERMISSION_TYPES } from './types';
import type { PermissionType } from './types';

const PROVIDER_EVENTS = {
  'connect': 'connect',
  'disconnect': 'disconnect',
  'accountChanged': 'accountChanged',
  'networkChange': 'networkChange',
  'message_low_level': 'message_low_level',
} as const;

type SuiProviderEventsMap = {
  [PROVIDER_EVENTS.connect]: (account: string) => void;
  [PROVIDER_EVENTS.disconnect]: () => void;
  [PROVIDER_EVENTS.accountChanged]: (account: string | null) => void;
  [PROVIDER_EVENTS.networkChange]: (name: string | null) => void;
  [PROVIDER_EVENTS.message_low_level]: (payload: IJsonRpcRequest) => void;
};

export type SuiRequest = {
  'hasPermissions'(permissions: readonly PermissionType[]): Promise<boolean>;

  'requestPermissions'(permissions: readonly PermissionType[]): Promise<boolean>;

  'disconnect': () => Promise<void>;

  'getAccounts': () => Promise<SuiAddress[]>;

  'signAndExecuteTransaction': (
    transaction: SignableTransaction,
  ) => Promise<SuiTransactionResponse>;

  'executeMoveCall': (transaction: MoveCallTransaction) => Promise<SuiTransactionResponse>;

  'executeSerializedMoveCall': (
    transaction: string | Uint8Array,
  ) => Promise<SuiTransactionResponse>;
};

type JsBridgeRequest = {
  [K in keyof SuiRequest]: (
    params: Parameters<SuiRequest[K]>[0],
  ) => Promise<TypeUtils.WireStringified<TypeUtils.ResolvePromise<ReturnType<SuiRequest[K]>>>>;
};

type JsBridgeRequestParams<T extends keyof JsBridgeRequest> = Parameters<JsBridgeRequest[T]>[0];

type JsBridgeRequestResponse<T extends keyof JsBridgeRequest> = ReturnType<JsBridgeRequest[T]>;

export type PROVIDER_EVENTS_STRINGS = keyof typeof PROVIDER_EVENTS;

export interface IProviderSui {
  hasPermissions(permissions: readonly PermissionType[]): Promise<boolean>;

  requestPermissions(permissions: readonly PermissionType[]): Promise<boolean>;

  /**
   * Disconnect wallet
   */
  disconnect(): Promise<void>;

  /**
   * Connect wallet, and get wallet info
   * @emits `connect` on success
   */
  getAccounts(): Promise<SuiAddress[]>;

  signAndExecuteTransaction(transaction: SignableTransaction): Promise<SuiTransactionResponse>;

  executeMoveCall(transaction: MoveCallTransaction): Promise<SuiTransactionResponse>;

  executeSerializedMoveCall(transaction: string | Uint8Array): Promise<SuiTransactionResponse>;
}

type OneKeySuiProviderProps = IInpageProviderConfig & {
  timeout?: number;
};

function isWalletEventMethodMatch({ method, name }: { method: string; name: string }) {
  return method === `wallet_events_${name}`;
}

class ProviderSui extends ProviderSuiBase implements IProviderSui {
  protected _account: SuiAddress | null = null;

  constructor(props: OneKeySuiProviderProps) {
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
        this._handleAccountChange(params as SuiAddress);
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

  private _handleConnected(account: SuiAddress, options: { emit: boolean } = { emit: true }) {
    this._account = account;
    if (options.emit && this.isConnectionStatusChanged('connected')) {
      this.connectionStatus = 'connected';
      const address = account ?? null;
      this.emit('connect', address);
      this.emit('accountChanged', address);
    }
  }

  private _handleDisconnected(options: { emit: boolean } = { emit: true }) {
    this._account = null;

    if (options.emit && this.isConnectionStatusChanged('disconnected')) {
      this.connectionStatus = 'disconnected';
      this.emit('disconnect');
      this.emit('accountChanged', null);
    }
  }

  isAccountsChanged(account: SuiAddress | undefined) {
    return account !== this._account;
  }

  // trigger by bridge account change event
  private _handleAccountChange(payload: SuiAddress) {
    const account = payload;
    if (this.isAccountsChanged(account)) {
      this.emit('accountChanged', account || null);
    }
    if (!account) {
      this._handleDisconnected();
      return;
    }

    this._handleConnected(account, { emit: false });
  }

  private _network: string | null | undefined;
  isNetworkChanged(network: string) {
    return this._network === undefined || network !== this._network;
  }

  private _handleNetworkChange(payload: string) {
    const network = payload;
    if (this.isNetworkChanged(network)) {
      this.emit('networkChange', network || null);
    }
    this._network = network;
  }

  async hasPermissions(permissions: readonly PermissionType[] = ALL_PERMISSION_TYPES) {
    return this._callBridge({
      method: 'hasPermissions',
      params: permissions,
    });
  }

  async requestPermissions(permissions: readonly PermissionType[] = ALL_PERMISSION_TYPES) {
    return this._callBridge({
      method: 'requestPermissions',
      params: permissions,
    });
  }

  async disconnect(): Promise<void> {
    await this._callBridge({
      method: 'disconnect',
      params: void 0,
    });
    this._handleDisconnected();
  }

  async getAccounts() {
    const accounts = await this._callBridge({
      method: 'getAccounts',
      params: undefined,
    });
    if (accounts.length === 0) {
      this._handleDisconnected();
      throw web3Errors.provider.unauthorized();
    }
    this._handleConnected(accounts[0]);
    return accounts;
  }

  async signAndExecuteTransaction(transaction: SignableTransaction) {
    return this._callBridge({
      method: 'signAndExecuteTransaction',
      params: transaction,
    });
  }

  async executeMoveCall(transaction: MoveCallTransaction) {
    return this._callBridge({
      method: 'executeMoveCall',
      params: transaction,
    });
  }

  async executeSerializedMoveCall(transaction: string | Uint8Array) {
    return this._callBridge({
      method: 'executeSerializedMoveCall',
      params: transaction,
    });
  }

  isConnected() {
    return this._account !== null;
  }

  onNetworkChange(listener: SuiProviderEventsMap['networkChange']): this {
    return super.on(PROVIDER_EVENTS.networkChange, listener);
  }

  onAccountChange(listener: SuiProviderEventsMap['accountChanged']): this {
    return super.on(PROVIDER_EVENTS.accountChanged, listener);
  }

  on<E extends keyof SuiProviderEventsMap>(event: E, listener: SuiProviderEventsMap[E]): this {
    return super.on(event, listener);
  }

  emit<E extends keyof SuiProviderEventsMap>(
    event: E,
    ...args: Parameters<SuiProviderEventsMap[E]>
  ): boolean {
    return super.emit(event, ...args);
  }
}

export { ProviderSui };
