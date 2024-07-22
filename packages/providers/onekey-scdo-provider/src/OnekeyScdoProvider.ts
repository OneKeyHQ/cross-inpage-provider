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
  hash?: string;
  signature?: {
    Sig: string;
  }
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
  [ScdoRequestMethods.scdo_requestAccounts]: () => string[];
  [ScdoRequestMethods.scdo_disconnect]: () => void;
  [ScdoRequestMethods.scdo_getAccounts]: () => string[];
  [ScdoRequestMethods.scdo_getBalance]: (address: string, blockHash?: string, blockHeight?: number) => string;
  [ScdoRequestMethods.scdo_signTransaction]: (tx: Tx) => SignedTx;
  [ScdoRequestMethods.scdo_estimateGas]: (tx: Tx) => string;
  [ScdoRequestMethods.scdo_sendTransaction]: (tx: Tx) => SignedTx;
}

type ScdoRequestParams = Parameters<ScdoRequest[ScdoRequestMethods]>;
type ScdoRequestResponse = ReturnType<ScdoRequest[ScdoRequestMethods]>;

interface ScdoRequestProps {
  method: ScdoRequestMethods;
  params: ScdoRequestParams;
}

export type IProviderScdo = {
  on: <E extends keyof ScdoProviderEventsMap>(event: E, cb: ScdoProviderEventsMap[E]) => void;
  removeListener: <E extends keyof ScdoProviderEventsMap>(event: E, cb: ScdoProviderEventsMap[E]) => void;
  request: (props: ScdoRequestProps) => Promise<ScdoRequestResponse>;
};

type JsBridgeRequest = {
  [K in keyof ScdoRequest]: (
    ...params: [void|string|RawTransaction|undefined|SignedTx]
  ) => Promise<TypeUtils.WireStringified<TypeUtils.ResolvePromise<ReturnType<ScdoRequest[K]>>>>;
};

type JsBridgeRequestResponse<T extends keyof JsBridgeRequest> = ReturnType<JsBridgeRequest[T]>;

export type OneKeyScdoProviderProps = IInpageProviderConfig & {
  timeout?: number;
};

function isWalletEventMethodMatch({ method, name }: { method: string; name: string }) {
  return method === `wallet_events_${name}`;
}

export class ProviderScdo extends ProviderScdoBase implements IProviderScdo {
  private _account?: string;
  public accounts: string[] = [];

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
    params: (void|string|RawTransaction|undefined|SignedTx)[];
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

  private _transformTx(tx: Tx): RawTransaction {
    return {
      Type: 0,
      From: tx.from,
      To: tx.to,
      Amount: tx.amount ?? 0,
      AccountNonce: tx.accountNonce ?? 0,
      GasPrice: tx.gasPrice ?? 1,
      GasLimit: tx.gasLimit ?? 0,
      Timestamp: tx.timestamp ?? 0,
      Payload: tx.payload ?? '',
    };
  }

  async request(props: ScdoRequestProps) {
    const reqParams = props.params as (void|string|undefined|Tx)[];
    let params;
    if (props.method === ScdoRequestMethods.scdo_estimateGas) {
      const tx = reqParams[0] as Tx;
      params = [{
        Data: this._transformTx(tx),
        Hash: tx.hash ?? '',
        Signature: tx.signature ?? { Sig: '' },
      }] as [SignedTx];
    } else if (props.method === ScdoRequestMethods.scdo_signTransaction || props.method === ScdoRequestMethods.scdo_sendTransaction) {
      params = [this._transformTx(props.params[0] as Tx)];
    } else {
      params = reqParams as [string];
    }
    const res = await this._callBridge({
      method: props.method,
      params,
    });
    if (props.method === ScdoRequestMethods.scdo_getAccounts) {
      this.accounts.length = 0;
      this.accounts.push(...res as string[]);
    }
    return res;
  }
}
