/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { IInpageProviderConfig } from '@onekeyfe/cross-inpage-provider-core';
import { getOrCreateExtInjectedJsBridge } from '@onekeyfe/extension-bridge-injected';
import { ProviderNeoBase } from './ProviderNeoBase';
import {
  INeoProviderMethods,
  INeoGetProviderResponse,
  NeoProviderEventsMap,
  JsBridgeRequest,
  JsBridgeRequestParams,
  JsBridgeRequestResponse,
  INeoNetworkResponse,
  IGetAccountResponse,
  IGetPublicKeyResponse,
  IGetBalanceParams, 
  IGetBalanceResponse, 
  IGetStorageParams, 
  IGetStorageResponse, 
  IVerifyMessageV2Params, 
  IVerifyMessageV2Response, 
  ISignMessageV2Params, 
  ISignMessageV2Response, 
  ISignMessageWithoutSaltV2Params, 
  ISignMessageWithoutSaltV2Response, 
  ISignTransactionParams, 
  ISignTransactionResponse
} from './types';
import { versionInfo } from '@onekeyfe/cross-inpage-provider-core'

const PROVIDER_EVENTS = {
  'connect': 'connect',
  'disconnect': 'disconnect',
  'accountChanged': 'accountChanged',
  'message_low_level': 'message_low_level',
} as const;

export type PROVIDER_EVENTS_STRINGS = keyof typeof PROVIDER_EVENTS;

function isWalletEventMethodMatch(method: string, name: string) {
  return method === `metamask_${name}` || method === `wallet_events_${name}`;
}

/**
 * send NEOLine.N3.EVENT.READY event to notify the page that Neo Provider is ready
 */
function emitNeoReadyEvent(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  const readyEvent = new Event('NEOLine.N3.EVENT.READY');
  window.dispatchEvent(readyEvent);
}

/**
 * NEOLineN3 is a class to provide compatibility with Neo dAPI
 */
class NEOLineN3 {
  static instance: ProviderNeo | null = null;

  static Init = class Init implements INeoProviderMethods {
    public provider: ProviderNeo;

    constructor() {
      if (!NEOLineN3.instance) {
        throw new Error('NEOLineN3 instance not available');
      }
      this.provider = NEOLineN3.instance;
    }

    async getProvider(): Promise<INeoGetProviderResponse> {
      return this.provider.getProvider();
    }

    async getNetworks(): Promise<INeoNetworkResponse> {
      return this.provider.getNetworks();
    }

    async getAccount(): Promise<IGetAccountResponse> {
      return this.provider.getAccount();
    }

    async getPublicKey(): Promise<IGetPublicKeyResponse> {
      return this.provider.getPublicKey();
    }

    async getBalance(params?: IGetBalanceParams): Promise<IGetBalanceResponse> {
      return this.provider.getBalance(params);
    }

    async getStorage(params?: IGetStorageParams): Promise<IGetStorageResponse> {
      return this.provider.getStorage(params);
    }

    async verifyMessageV2(params: IVerifyMessageV2Params): Promise<IVerifyMessageV2Response> {
      return this.provider.verifyMessageV2(params);
    }

    async signMessageV2(params: ISignMessageV2Params): Promise<ISignMessageV2Response> {
      return this.provider.signMessageV2(params);
    }

    async signMessageWithoutSaltV2(params: ISignMessageWithoutSaltV2Params): Promise<ISignMessageWithoutSaltV2Response> {
      return this.provider.signMessageWithoutSaltV2(params);
    }

    async signTransaction(params: ISignTransactionParams): Promise<ISignTransactionResponse> {
      return this.provider.signTransaction(params);
    }
  }
}

/**
 * ProviderNeo is the core implementation that communicates with OneKey Wallet
 */
class ProviderNeo extends ProviderNeoBase implements INeoProviderMethods {
  constructor(props: IInpageProviderConfig & { timeout?: number }) {
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
      const { method } = payload;
      if (isWalletEventMethodMatch(method, PROVIDER_EVENTS.accountChanged)) {
        this._handleAccountChange();
      }
    });
  }

  private _handleDisconnected(options: { emit: boolean } = { emit: true }) {
    if (options.emit && this.isConnectionStatusChanged('disconnected')) {
      this.emit('disconnect');
      this.emit('accountChanged');
    }
  }

  private _handleAccountChange() {
    this.emit('accountChanged');
  }

  on<E extends keyof NeoProviderEventsMap>(
    event: E,
    listener: NeoProviderEventsMap[E]
  ): this {
    return super.on(event, listener);
  }

  off<E extends keyof NeoProviderEventsMap>(
    event: E,
    listener: NeoProviderEventsMap[E]
  ): this {
    return super.off(event, listener);
  }

  emit<E extends keyof NeoProviderEventsMap>(
    event: E,
    ...args: Parameters<NeoProviderEventsMap[E]>
  ): boolean {
    return super.emit(event, ...args);
  }

  private _callBridge<T extends keyof JsBridgeRequest>(params: {
    method: T;
    params?: JsBridgeRequestParams<T>;
  }): JsBridgeRequestResponse<T> {
    return this.bridgeRequest(params) as JsBridgeRequestResponse<T>;
  }

  getProvider(): Promise<INeoGetProviderResponse> {
    return Promise.resolve({
      name: 'OneKey Wallet',
      website: 'https://onekey.so',
      version: versionInfo.version || '1.0.0',
      compatibility: [],
    });
  }

  async getNetworks(): Promise<INeoNetworkResponse> {
    return this._callBridge({ method: 'getNetworks' });
  }

  async getAccount(): Promise<IGetAccountResponse> {
    return this._callBridge({ method: 'getAccount' });
  }

  async getPublicKey(): Promise<IGetPublicKeyResponse> {
    return this._callBridge({ method: 'getPublicKey' });
  }

  async getBalance(params?: IGetBalanceParams): Promise<IGetBalanceResponse> {
    return this._callBridge({ method: 'getBalance', params });
  }

  async getStorage(params?: IGetStorageParams): Promise<IGetStorageResponse> {
    return this._callBridge({ method: 'getStorage', params });
  }

  async verifyMessageV2(params: IVerifyMessageV2Params): Promise<IVerifyMessageV2Response> {
    return this._callBridge({ method: 'verifyMessageV2', params });
  }

  async signMessageV2(params: ISignMessageV2Params): Promise<ISignMessageV2Response> {
    return this._callBridge({ method: 'signMessageV2', params });
  }

  async signMessageWithoutSaltV2(params: ISignMessageWithoutSaltV2Params): Promise<ISignMessageWithoutSaltV2Response> {
    return this._callBridge({ method: 'signMessageWithoutSaltV2', params });
  }

  async signTransaction(params: ISignTransactionParams): Promise<ISignTransactionResponse> {
    return this._callBridge({ method: 'signTransaction', params });
  }
}

export { NEOLineN3, ProviderNeo, emitNeoReadyEvent };
