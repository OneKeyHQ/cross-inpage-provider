import { IJsonRpcRequest } from '@onekeyfe/cross-inpage-provider-types';

import { ProviderConfluxBase } from './ProviderConfluxBase';

export enum DeprecatedType {
  EVENT = 'EVENT',
  METHOD = 'METHOD',
  PROPERTY = 'PROPERTY',
}

export enum ProviderEvents {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  ACCOUNTS_CHANGED = 'accountsChanged',
  CHAIN_CHANGED = 'chainChanged',
  MESSAGE = 'message',
  MESSAGE_LOW_LEVEL = 'message_low_level',

  // DEPRECATED
  NETWORK_CHANGED = 'networkChanged',
  CHAIN_ID_CHANGE = 'chainIdChanged',
}

export interface Network {
  chainId?: string;
  networkId?: string;
}

export type ConsoleLike = Pick<Console, 'log' | 'warn' | 'error' | 'debug' | 'info' | 'trace'>;

export interface ProviderEventsMap {
  [ProviderEvents.CONNECT]: (network: Network) => void;
  [ProviderEvents.DISCONNECT]: () => void;
  [ProviderEvents.ACCOUNTS_CHANGED]: (accounts: string[]) => void;
  [ProviderEvents.CHAIN_CHANGED]: (chainId: string) => void;
  [ProviderEvents.MESSAGE_LOW_LEVEL]: (payload: IJsonRpcRequest) => void;
  [ProviderEvents.MESSAGE]: (message: string) => void;

  // DEPRECATED
  [ProviderEvents.CHAIN_ID_CHANGE]: (chainId: string) => void;
  [ProviderEvents.NETWORK_CHANGED]: (networkId: string) => void;
}

export interface RequestArguments {
  id?: number | string;
  method: string;
  params?: unknown[] | Record<string, unknown>;
}

export interface IProviderConflux extends ProviderConfluxBase {
  readonly isConfluxPortal: true;
  readonly isFluent: true;
  readonly isOneKey: true;

  isConnected(): boolean;

  request<T>(args: RequestArguments): Promise<T>;

  /**
   * @deprecated use provider.request(\{method: "cfx_requestAccounts"\}) instead
   * @see request
   */
  enable(): Promise<unknown>;

  /**
   * @deprecated use provider.request instead
   * @see request
   */
  sendAsync(
    request: RequestArguments,
    callback: (err: Error | null | string, resp: unknown) => void,
  ): void;

  /**
   * @deprecated use provider.request instead
   * @see request
   */
  send<T>(args: RequestArguments): Promise<T>;
}
