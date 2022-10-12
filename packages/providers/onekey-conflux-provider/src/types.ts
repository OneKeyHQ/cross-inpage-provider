import { IJsonRpcRequest } from '@onekeyfe/cross-inpage-provider-types';

import { ProviderConfluxBase } from './ProviderConfluxBase';

export enum DeprecatedType {
  EVENT = 'EVENT',
  METHOD = 'METHOD',
}

export enum DeprecatedEvents {
  EVENT = 'EVENT',
  METHOD = 'METHOD',
}

export enum ProviderEvents {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  ACCOUNTS_CHANGED = 'accountsChanged',
  CHAIN_CHANGED = 'chainChanged',
  MESSAGE = 'message',
  MESSAGE_LOW_LEVEL = 'message_low_level',
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
}

interface RequestArguments {
  method: string;
  params?: unknown[] | object;
}

export interface IProviderConflux extends ProviderConfluxBase {
  readonly isConfluxPortal: true;
  readonly isFluent: true;
  readonly isOneKey: true;

  isConnected(): boolean;

  /**
   * @deprecated
   * use provider.request(\{method: "cfx_requestAccounts"\}) instead
   * @see request
   */
  enable(): Promise<any>;
}

export interface SolanaProviderEventsMap {}
