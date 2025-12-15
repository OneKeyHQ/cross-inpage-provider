/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { ProviderBase } from '@onekeyfe/cross-inpage-provider-core'
import { ProviderCardanoBase } from './ProviderCardanoBase'
import { IInpageProviderConfig } from '@onekeyfe/cross-inpage-provider-core';
import { getOrCreateExtInjectedJsBridge } from '@onekeyfe/extension-bridge-injected';
import { isWalletEventMethodMatch } from './utils'
import { IJsonRpcRequest } from '@onekeyfe/cross-inpage-provider-types';
import { Cbor, Bytes, Cip30DataSignature, Cip30Wallet, NetworkId, Paginate, WalletApi } from './types'
import * as TypeUtils from './type-utils'


export const NAMI_TARGET = 'nami-wallet';

export type CardanoRequest = WalletApi & {
  connect: () => Promise<{ account: string }>
  // override the type of the request method
  getUtxos: (params: {amount?: Cbor, paginate?: Paginate}) => Promise<Cbor[] | undefined>
  signTx: (params: {tx: Cbor, partialSign?: boolean}) => Promise<Cbor>
  signData: (params: {addr: Cbor, payload: Bytes}) => Promise<Cip30DataSignature>;
}

export type JsBridgeRequest = {
  [K in keyof CardanoRequest]: (params: Parameters<CardanoRequest[K]>[0]) => Promise<TypeUtils.WireStringified<TypeUtils.ResolvePromise<ReturnType<CardanoRequest[K]>>>>
}

type JsBridgeRequestParams<T extends keyof JsBridgeRequest> = Parameters<JsBridgeRequest[T]>[0]

type JsBridgeRequestResponse<T extends keyof JsBridgeRequest> = ReturnType<JsBridgeRequest[T]>

const PROVIDER_EVENTS = {
  'connect': 'connect',
  'disconnect': 'disconnect',
  'accountChanged': 'accountChanged',
  'message_low_level': 'message_low_level',
} as const;

type CardanoProviderEventsMap = {
  [PROVIDER_EVENTS.connect]: (account: string) => void;
  [PROVIDER_EVENTS.disconnect]: () => void;
  [PROVIDER_EVENTS.accountChanged]: (account: string | null) => void;
  [PROVIDER_EVENTS.message_low_level]: (payload: IJsonRpcRequest) => void;
};

interface IProviderCardano extends ProviderBase {
  isConnected: boolean;

  onekey: Cip30Wallet;

  getNetworkId(): Promise<NetworkId>;
}

type OneKeyCardanoProviderProps = IInpageProviderConfig & {
  timeout?: number;
};

type CardanoAccount = { accounts: {address: string} }

class ProviderCardano extends ProviderCardanoBase implements IProviderCardano {
  private _account: string | null = null;

  get account() {
    return this._account;
  }

  get isConnected() {
    return this._account !== null;
  }

  onekey: Cip30Wallet;

  nami: Cip30Wallet;

  yoroi: Cip30Wallet;

  constructor(props: OneKeyCardanoProviderProps) {
    super({
      ...props,
      bridge: props.bridge || getOrCreateExtInjectedJsBridge({ timeout: props.timeout }),
    });

    this._registerEvents();

    this.nami = {
      ...this.walletInfo(),
      name: 'Nami',
    };
    this.onekey = {
      ...this.walletInfo(),
    };
    this.yoroi = {
      ...this.walletInfo(),
      name: 'yoroi',
    };
  }

  private _registerEvents() {
    window.addEventListener('onekey_bridge_disconnect', () => {
      this._handleDisconnected();
    });

    this.on(PROVIDER_EVENTS.message_low_level, (payload) => {
      const { method, params } = payload;
      if (isWalletEventMethodMatch(method, PROVIDER_EVENTS.accountChanged)) {
        this._handleAccountChange(params as CardanoAccount);
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

  private _handleConnected(account: string, options: { emit: boolean }) {
    this._account = account;
    if (options.emit && this.isConnectionStatusChanged('connected')) {
      this.connectionStatus = 'connected';
      this.emit('connect', account);
      this.emit('accountChanged', account);
    }
  }

  private _handleDisconnected(options: { emit: boolean } = { emit: true }) {
    if (options.emit && this.isConnectionStatusChanged('disconnected')) {
      this.connectionStatus = 'disconnected';
      this.emit('disconnect');
      this.emit('accountChanged', null);
    }
  }

  override isAccountsChanged(address: string): boolean {
    return address !== this._account;
  }

  private _handleAccountChange(payload: CardanoAccount) {
    const account = payload.accounts?.address;
    if (this.isAccountsChanged(account)) {
      this.emit('accountChanged', account || null);
    }
    if (!account) {
      this._handleDisconnected();
      return;
    }
    if (account) {
      this._handleConnected(account, { emit: false });
    }
  }

  on<E extends keyof CardanoProviderEventsMap>(
    event: E,
    listener: CardanoProviderEventsMap[E],
  ): this {
    return super.on(event, listener);
  }

  emit<E extends keyof CardanoProviderEventsMap>(
    event: E,
    ...args: Parameters<CardanoProviderEventsMap[E]>
  ): boolean {
    return super.emit(event, ...args);
  }

  // CIP30 Wallet API 👇
  walletInfo(): Cip30Wallet {
    return {
      apiVersion: '0.1.0',
      name: 'OneKey',
      icon: 'https://theme.zdassets.com/theme_assets/10237731/cd8f795ce97bdd7657dd4fb4b19fde3f32b50349.png',
      isEnabled: () => Promise.resolve(true),
      enable: () => this.enable(),
    };
  }

  async enable() {
    const API = {
      getNetworkId: () => this.getNetworkId(),
      getUtxos: (amount?: Cbor, paginate?: Paginate) => this.getUtxos(amount, paginate),
      getBalance: () => this.getBalance(),
      getUsedAddresses: () => this.getUsedAddresses(),
      getUnusedAddresses: () => this.getUnUsedAddress(),

      getChangeAddress: () => this.getChangeAddress(),

      getRewardAddresses: () => this.getRewardAddresses(),

      signTx: (tx: Cbor, partialSign?: boolean) => this.signTx(tx, partialSign),

      signData: (addr: Cbor, payload: Bytes) => this.signData(addr, payload),

      submitTx: (tx: Cbor) => this.submitTx(tx),

      experimental: {
        on: (eventName: string, callback: (detail: any) => void) =>
          this.namiOn(eventName, callback),
        off: () => this.namiOff(),
        getCollateral: () => this.getCollateral(),
      },
    };

    if (!this.account) {
      const result = await this._callBridge({
        method: 'connect',
        params: undefined,
      });
      this._handleConnected(result.account, { emit: true });
      return API;
    }
    return Promise.resolve(API);
  }

  // CIP30 Dapp API 👇

  async getNetworkId(): Promise<NetworkId> {
    return this._callBridge({
      method: 'getNetworkId',
      params: undefined,
    });
  }

  async getUtxos(amount?: Cbor, paginate?: Paginate) {
    return this._callBridge({
      method: 'getUtxos',
      params: {
        amount,
        paginate,
      },
    });
  }

  async getCollateral() {
    return Promise.resolve([]);
  }

  async getBalance() {
    return this._callBridge({
      method: 'getBalance',
      params: undefined,
    });
  }

  async getUsedAddresses(): Promise<Cbor[]> {
    return this._callBridge({
      method: 'getUsedAddresses',
      params: undefined,
    });
  }

  async getUnUsedAddress() {
    return this._callBridge({
      method: 'getUnusedAddresses',
      params: undefined,
    });
  }

  async getChangeAddress() {
    return this._callBridge({
      method: 'getChangeAddress',
      params: undefined,
    });
  }

  async getRewardAddresses() {
    return this._callBridge({
      method: 'getRewardAddresses',
      params: undefined,
    });
  }

  async signTx(tx: Cbor, partialSign?: boolean) {
    return this._callBridge({
      method: 'signTx',
      params: {
        tx,
        partialSign,
      },
    });
  }

  async signData(addr: Cbor, payload: Bytes) {
    return this._callBridge({
      method: 'signData',
      params: {
        addr,
        payload,
      },
    });
  }

  async submitTx(tx: Cbor) {
    return this._callBridge({
      method: 'submitTx',
      params: tx,
    });
  }

  /**
   * @param {string} eventName
   * @param {Function} callback
   */
  namiOn(eventName: string, callback: (detail: any) => void) {
    const handler = (event: any) => callback(event.detail);

    // @ts-ignore
    const events = window.cardano.nami._events[eventName] || [];

    // @ts-ignore
    window.cardano.nami._events[eventName] = [...events, [callback, handler]];

    window.addEventListener(`${NAMI_TARGET}${eventName}`, handler);
  }

  namiOff() {
    // empty
  }
}

export {ProviderCardano}
