import type { IInpageProviderConfig } from '@onekeyfe/cross-inpage-provider-core';
import { getOrCreateExtInjectedJsBridge } from '@onekeyfe/extension-bridge-injected';
import { ProviderScdoBase } from './ProviderScdoBase';
import type { IJsonRpcRequest } from '@onekeyfe/cross-inpage-provider-types';
import type * as TypeUtils from './type-utils';

export enum PROVIDER_EVENTS {
  accountsChanged = 'accountsChanged',
  disconnect = 'disconnect',
  message_low_level = 'message_low_level',
}

type ScdoProviderEventsMap = {
  [PROVIDER_EVENTS.accountsChanged]: (accounts: string[]) => void;
  [PROVIDER_EVENTS.disconnect]: () => void;
  [PROVIDER_EVENTS.message_low_level]: (payload: IJsonRpcRequest) => void;
};

export enum ScdoRequestMethods {
  scdo_requestAccounts = 'scdo_requestAccounts',
  scdo_disconnect = 'scdo_disconnect',
  scdo_getAccounts = 'scdo_getAccounts',
  scdo_getBalance = 'scdo_getBalance',
  scdo_signTransaction = 'scdo_signTransaction',
  scdo_estimateGas = 'scdo_estimateGas',
  scdo_sendTransaction = 'scdo_sendTransaction',
}

export interface Tx {
  from: string;
  to: string;
  amount?: number;
  accountNonce?: number;
  gasPrice?: number;
  gasLimit?: number;
  timestamp?: number;
  payload?: string;
}

export interface RawTransaction {
  Type: number;
  From: string;
  To: string;
  Amount: number;
  AccountNonce: number;
  GasPrice: number;
  GasLimit: number;
  Timestamp: number;
  Payload: string;
}

export interface SignedTx {
  Data: RawTransaction;
  Hash: string;
  Signature: {
    Sig: string;
  };
}

type ScdoRequest = {
  [ScdoRequestMethods.scdo_requestAccounts]: () => Promise<string[]>;
  [ScdoRequestMethods.scdo_disconnect]: () => Promise<void>;
  [ScdoRequestMethods.scdo_getAccounts]: () => Promise<string[]>;
  [ScdoRequestMethods.scdo_getBalance]: (address: string) => Promise<string>;
  [ScdoRequestMethods.scdo_signTransaction]: (tx: Tx) => Promise<SignedTx>;
  [ScdoRequestMethods.scdo_estimateGas]: (tx: Tx) => Promise<string>;
  [ScdoRequestMethods.scdo_sendTransaction]: (tx: Tx) => Promise<SignedTx>;
}

type ScdoRequestParams = Parameters<ScdoRequest[ScdoRequestMethods]>;

interface ScdoRequestProps {
  method: ScdoRequestMethods;
  params: ScdoRequestParams;
}

export type IProviderScdo = {
  on: <E extends keyof ScdoProviderEventsMap>(event: E, cb: ScdoProviderEventsMap[E]) => void;
  removeListener: <E extends keyof ScdoProviderEventsMap>(event: E, cb: ScdoProviderEventsMap[E]) => void;
  request: (props: ScdoRequestProps) => ReturnType<ScdoRequest[ScdoRequestMethods]>;
};

type JsBridgeRequest = {
  [K in keyof ScdoRequest]: (
    ...params: Parameters<ScdoRequest[K]>
  ) => Promise<TypeUtils.WireStringified<TypeUtils.ResolvePromise<ReturnType<ScdoRequest[K]>>>>;
};

type JsBridgeRequestParams<T extends keyof JsBridgeRequest> = Parameters<JsBridgeRequest[T]>;

type JsBridgeRequestResponse<T extends keyof JsBridgeRequest> = ReturnType<JsBridgeRequest[T]>;

export type OneKeyScdoProviderProps = IInpageProviderConfig & {
  timeout?: number;
};

function isWalletEventMethodMatch({ method, name }: { method: string; name: string }) {
  return method === `wallet_events_${name}`;
}

export class ProviderScdo extends ProviderScdoBase implements IProviderScdo {
  private _account?: string;

  constructor(props: OneKeyScdoProviderProps) {
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

      if (isWalletEventMethodMatch({ method, name: PROVIDER_EVENTS.accountsChanged })) {
        this._handleAccountChange(params as string | undefined);
      }
    });
  }

  private _callBridge<T extends keyof JsBridgeRequest>(params: {
    method: T;
    params: JsBridgeRequestParams<T>;
  }): JsBridgeRequestResponse<T> {
    return this.bridgeRequest(params) as JsBridgeRequestResponse<T>;
  }

  private _handleDisconnected(options: { emit: boolean } = { emit: true }) {
    this._account = undefined;

    if (options.emit && this.isConnectionStatusChanged('disconnected')) {
      this.connectionStatus = 'disconnected';
      this.emit(PROVIDER_EVENTS.disconnect);
    }
  }

  isAccountsChanged(account: string | undefined) {
    if (!account) return false;
    if (!this._account) return true;

    return account !== this._account;
  }

  // trigger by bridge account change event
  private _handleAccountChange(payload: string | undefined) {
    const account = payload;
    if (this.isAccountsChanged(account) && account) {
      this.emit(PROVIDER_EVENTS.accountsChanged, [account]);
    }
    if (!account) {
      this._handleDisconnected();
      return;
    }
  }

  on<E extends keyof ScdoProviderEventsMap>(
    event: E,
    listener: ScdoProviderEventsMap[E],
  ): this {
    return super.on(event, listener);
  }

  emit<E extends keyof ScdoProviderEventsMap>(
    event: E,
    ...args: Parameters<ScdoProviderEventsMap[E]>
  ): boolean {
    return super.emit(event, ...args);
  }

  removeListener<E extends keyof ScdoProviderEventsMap>(eventName: E, listener: ScdoProviderEventsMap[E]): this {
    return super.removeListener(eventName, listener);
  }

  request(props: ScdoRequestProps): ReturnType<ScdoRequest[ScdoRequestMethods]> {
    return this._callBridge(props);
  }
}
