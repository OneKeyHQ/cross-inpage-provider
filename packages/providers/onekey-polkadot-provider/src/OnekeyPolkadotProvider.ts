/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable tsdoc/syntax */
import type { IInpageProviderConfig } from '@onekeyfe/cross-inpage-provider-core';
import { getOrCreateExtInjectedJsBridge } from '@onekeyfe/extension-bridge-injected';
import { ProviderPolkadotBase } from './ProviderPolkadotBase';
import type * as TypeUtils from './type-utils';
import type { IJsonRpcRequest } from '@onekeyfe/cross-inpage-provider-types';
import type { JsonRpcResponse } from '@polkadot/rpc-provider/types';

import {
  Unsubcall,
  Injected,
  InjectedAccount,
  ProviderList,
  ProviderMeta,
} from '@polkadot/extension-inject/types';
import { injectExtension } from '@polkadot/extension-inject';
import {
  RequestRpcSend,
  RequestRpcSubscribe,
  RequestRpcUnsubscribe,
  SignerPayloadJSON,
  SignerPayloadRaw,
  SignerResult,
} from './types';
import OneKeyInjected from './inject/Injected';

const PROVIDER_EVENTS = {
  'connect': 'connect',
  'disconnect': 'disconnect',
  'accountChanged': 'accountChanged',
  'message_low_level': 'message_low_level',
} as const;

interface IMessagePayload {
  request?: unknown;
  response?: unknown;
  error?: string;
}

interface IPostMessage extends IMessagePayload {
  id: number;
  origin: string;
}

type CosmosProviderEventsMap = {
  [PROVIDER_EVENTS.connect]: (account: string) => void;
  [PROVIDER_EVENTS.disconnect]: () => void;
  [PROVIDER_EVENTS.accountChanged]: (account: InjectedAccount[]) => void;
  [PROVIDER_EVENTS.message_low_level]: (payload: IJsonRpcRequest) => void;
};

export type PolkadotRequest = {
  'web3Enable': (dappName: string) => Promise<boolean>;

  'web3Accounts': (anyType?: boolean) => Promise<InjectedAccount[]>;

  'web3AccountsSubscribe': (cb: (accounts: InjectedAccount[]) => any) => Promise<Unsubcall>;

  'web3SignPayload': (payload: SignerPayloadJSON) => Promise<SignerResult>;

  'web3SignRaw': (payload: SignerPayloadRaw) => Promise<SignerResult>;

  'web3RpcSubscribe': (
    payload: RequestRpcSubscribe,
    cb: (cb: JsonRpcResponse<unknown>) => void,
  ) => Promise<string | number>;

  'web3RpcUnSubscribe': () => Promise<boolean>;

  'web3RpcSubscribeConnected': (cb: (connected: boolean) => void) => boolean;

  'web3RpcSend': (payload: RequestRpcSend) => Promise<JsonRpcResponse<unknown>>;

  'web3RpcListProviders': () => Promise<ProviderList>;

  'web3RpcStartProvider': (payload: string) => Promise<ProviderMeta>;
};

type JsBridgeRequest = {
  [K in keyof PolkadotRequest]: (
    params: Parameters<PolkadotRequest[K]>[0],
  ) => Promise<TypeUtils.WireStringified<TypeUtils.ResolvePromise<ReturnType<PolkadotRequest[K]>>>>;
};

type JsBridgeRequestParams<T extends keyof JsBridgeRequest> = Parameters<JsBridgeRequest[T]>[0];

type JsBridgeRequestResponse<T extends keyof JsBridgeRequest> = ReturnType<JsBridgeRequest[T]>;

export type PROVIDER_EVENTS_STRINGS = keyof typeof PROVIDER_EVENTS;

export interface IProviderPolkadot {
  isWeb3Injected: boolean;

  web3Enable: (dappName: string) => Promise<boolean>;

  web3Accounts: (anyType?: boolean) => Promise<InjectedAccount[]>;

  web3AccountsSubscribe: (cb: (accounts: InjectedAccount[]) => any) => Unsubcall;

  web3SignPayload: (payload: SignerPayloadJSON) => Promise<SignerResult>;

  web3SignRaw: (payload: SignerPayloadRaw) => Promise<SignerResult>;

  web3RpcSubscribe: (
    payload: RequestRpcSubscribe,
    cb: (accounts: JsonRpcResponse<unknown>) => void,
  ) => Promise<string | number>;

  web3RpcUnSubscribe: (payload: RequestRpcUnsubscribe) => Promise<boolean>;

  web3RpcSubscribeConnected: (cb: (connected: boolean) => void) => boolean;

  web3RpcSend: (payload: RequestRpcSend) => Promise<JsonRpcResponse<unknown>>;

  web3RpcListProviders: () => Promise<ProviderList>;

  web3RpcStartProvider: (payload: string) => Promise<ProviderMeta>;
}

export type OneKeyPolkadotProviderProps = IInpageProviderConfig & {
  timeout?: number;
};

function isWalletEventMethodMatch({ method, name }: { method: string; name: string }) {
  return method === `wallet_events_${name}`;
}

class ProviderPolkadot extends ProviderPolkadotBase implements IProviderPolkadot {
  _account: string | null = null;

  constructor(props: OneKeyPolkadotProviderProps) {
    super({
      ...props,
      bridge: props.bridge || getOrCreateExtInjectedJsBridge({ timeout: props.timeout }),
    });

    this._registerEvents();
  }

  isWeb3Injected = true;

  private _registerEvents() {
    window.addEventListener('onekey_bridge_disconnect', () => {
      this._handleDisconnected();
    });

    this.on(PROVIDER_EVENTS.message_low_level, (payload) => {
      if (!payload) return;
      const { method, params } = payload;

      if (isWalletEventMethodMatch({ method, name: PROVIDER_EVENTS.accountChanged })) {
        let temp: InjectedAccount | undefined = undefined;
        if (typeof params === 'string') {
          temp = JSON.parse(params) as InjectedAccount;
        } else if (typeof params === 'object') {
          temp = params as InjectedAccount | undefined;
        }
        this._handleAccountChange(temp);
      }
    });
  }

  private _callBridge<T extends keyof JsBridgeRequest>(params: {
    method: T;
    params: JsBridgeRequestParams<T>;
  }): JsBridgeRequestResponse<T> {
    return this.bridgeRequest(params) as JsBridgeRequestResponse<T>;
  }

  private _handleConnected(account: string, options: { emit: boolean } = { emit: true }) {
    this._account = account;
    if (options.emit && this.isConnectionStatusChanged('connected')) {
      this.connectionStatus = 'connected';
      const address = account ?? null;
      this.emit('connect', address);
      // this.emit('keplr_keystorechange');
    }
  }

  private _handleDisconnected(options: { emit: boolean } = { emit: true }) {
    this._account = null;

    if (options.emit && this.isConnectionStatusChanged('disconnected')) {
      this.connectionStatus = 'disconnected';
      this.emit('disconnect');
      // this.emit('keplr_keystorechange');
    }
  }

  // trigger by bridge account change event
  private _handleAccountChange(payload: InjectedAccount | undefined) {
    const account = payload ? [payload] : [];
    this.emit('accountChanged', account);
    if (!account) {
      this._handleDisconnected();
      return;
    }
  }

  private _network: string | null | undefined;
  isNetworkChanged(network: string) {
    return this._network === undefined || network !== this._network;
  }

  isConnected() {
    return this._account !== null;
  }

  on<E extends keyof CosmosProviderEventsMap>(
    event: E,
    listener: CosmosProviderEventsMap[E],
  ): this {
    return super.on(event, listener);
  }

  emit<E extends keyof CosmosProviderEventsMap>(
    event: E,
    ...args: Parameters<CosmosProviderEventsMap[E]>
  ): boolean {
    return super.emit(event, ...args);
  }

  private createMessage(payload: IMessagePayload): IPostMessage {
    return {
      id: 2,
      origin: 'OneKey Polkadot Provider',
      ...payload,
    };
  }

  private _postMessage(payload: IMessagePayload) {
    try {
      const message = this.createMessage(payload);
      window.postMessage(message);
    } catch (error) {
      // ignore
    }
  }

  postRequest(payload: any) {
    this._postMessage({
      request: payload,
    });
  }

  postResponse(payload: any) {
    this._postMessage({
      response: payload,
    });
  }

  postError(payload: string) {
    this._postMessage({
      error: payload,
    });
  }

  web3Enable(dappName: string): Promise<boolean> {
    return this._callBridge({
      method: 'web3Enable',
      params: dappName,
    });
  }

  web3Accounts(anyType?: boolean): Promise<InjectedAccount[]> {
    return this._callBridge({
      method: 'web3Accounts',
      params: anyType ?? false,
    });
  }

  web3AccountsSubscribe(cb: (accounts: InjectedAccount[]) => any): Unsubcall {
    super.on(PROVIDER_EVENTS.accountChanged, cb);
    return () => {
      super.off(PROVIDER_EVENTS.accountChanged, cb);
    };
  }

  async web3SignPayload(payload: SignerPayloadJSON): Promise<SignerResult> {
    try {
      this.postRequest(payload);

      const result = await this._callBridge({
        method: 'web3SignPayload',
        params: payload,
      });

      this.postResponse({
        id: 1,
        origin: 'OneKey Polkadot Provider',
        signature: result.signature,
      });

      return result;
    } catch (error) {
      this.postError('Cancelled');
      return Promise.reject('Cancelled');
    }
  }

  async web3SignRaw(payload: SignerPayloadRaw): Promise<SignerResult> {
    try {
      this.postRequest(payload);

      const result = await this._callBridge({
        method: 'web3SignRaw',
        params: payload,
      });

      this.postResponse({
        id: 1,
        origin: 'OneKey Polkadot Provider',
        signature: result.signature,
      });

      return result;
    } catch (error) {
      this.postError('Cancelled');
      return Promise.reject('Cancelled');
    }
  }

  web3RpcSubscribe(
    payload: RequestRpcSubscribe,
    cb: (accounts: JsonRpcResponse<unknown>) => void,
  ): Promise<string | number> {
    return this._callBridge({
      method: 'web3RpcSubscribe',
      params: payload,
    });
  }

  web3RpcUnSubscribe(): Promise<boolean> {
    super.removeAllListeners();
    return this._callBridge({
      method: 'web3RpcUnSubscribe',
      params: undefined,
    });
  }

  web3RpcSubscribeConnected(cb: (connected: boolean) => void): boolean {
    cb(this.isConnected());
    super.on(PROVIDER_EVENTS.connect, cb);
    super.on(PROVIDER_EVENTS.disconnect, cb);
    return true;
  }

  web3RpcSend(payload: RequestRpcSend): Promise<JsonRpcResponse<unknown>> {
    return this._callBridge({
      method: 'web3RpcSend',
      params: payload,
    });
  }

  web3RpcListProviders(): Promise<ProviderList> {
    return this._callBridge({
      method: 'web3RpcListProviders',
      params: undefined,
    });
  }

  web3RpcStartProvider(payload: string): Promise<ProviderMeta> {
    return this._callBridge({
      method: 'web3RpcStartProvider',
      params: payload,
    });
  }
}

const registerPolkadot = (provider: ProviderPolkadot, name = 'OneKey', version = '1.0.0') => {
  try {
    const enableFn = async (originName: string): Promise<Injected> => {
      await provider.web3Enable(originName);
      return new OneKeyInjected(provider);
    };

    injectExtension(enableFn, { name: name ?? 'OneKey', version: version ?? '1.0.0' });
  } catch (error) {
    console.error(error);
  }
};

export { ProviderPolkadot, registerPolkadot };
