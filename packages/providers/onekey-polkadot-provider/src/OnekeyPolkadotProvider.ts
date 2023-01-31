/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable tsdoc/syntax */
import type { IInpageProviderConfig } from '@onekeyfe/cross-inpage-provider-core';
import { getOrCreateExtInjectedJsBridge } from '@onekeyfe/extension-bridge-injected';
import { ProviderPolkadotBase } from './ProviderPolkadotBase';
import type * as TypeUtils from './type-utils';
import type { IJsonRpcRequest } from '@onekeyfe/cross-inpage-provider-types';

import {
  InjectedAccountWithMeta,
  Unsubcall,
  Injected,
  InjectedAccount,
} from '@polkadot/extension-inject/types';
import { injectExtension } from '@polkadot/extension-inject';
import { SignerPayloadJSON, SignerPayloadRaw, SignerResult } from './types';

const PROVIDER_EVENTS = {
  'connect': 'connect',
  'disconnect': 'disconnect',
  'accountChanged': 'accountChanged',
  'message_low_level': 'message_low_level',
} as const;

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
      const { method, params } = payload;

      if (isWalletEventMethodMatch({ method, name: PROVIDER_EVENTS.accountChanged })) {
        this._handleAccountChange(params as string);
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
  private _handleAccountChange(payload: string) {
    const account = JSON.parse(payload) as InjectedAccount[];
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

  web3SignPayload(payload: SignerPayloadJSON): Promise<SignerResult> {
    return this._callBridge({
      method: 'web3SignPayload',
      params: payload,
    });
  }

  web3SignRaw(payload: SignerPayloadRaw): Promise<SignerResult> {
    return this._callBridge({
      method: 'web3SignRaw',
      params: payload,
    });
  }
}

const registerPolkadot = (provider: ProviderPolkadot) => {
  try {
    const enableFn = (originName: string): Promise<Injected> => {
      return provider.web3Enable(originName).then((res) => {
        if (!res) {
          throw new Error('not support');
        }

        return {
          accounts: {
            get: (anyType?: boolean): Promise<InjectedAccount[]> => {
              return provider.web3Accounts(anyType);
            },
            subscribe: (cb: (accounts: InjectedAccount[]) => void | Promise<void>): Unsubcall => {
              return provider.web3AccountsSubscribe(cb);
            },
          },
          metadata: undefined,
          provider: undefined,
          signer: {
            signPayload: (message: SignerPayloadJSON): Promise<SignerResult> => {
              return provider.web3SignPayload(message);
            },
            signRaw: (message: SignerPayloadRaw): Promise<SignerResult> => {
              return provider.web3SignRaw(message);
            },
          },
        };
      });
    };

    injectExtension(enableFn, { name: 'OneKey', version: '1.0.0' });
  } catch (error) {
    console.error(error);
  }
};

export { ProviderPolkadot, registerPolkadot };
