import { IJsonRpcRequest } from '@onekeyfe/cross-inpage-provider-types';
import TronWeb from 'tronweb';

import { ProviderTronBase } from './ProviderTronBase';

export enum DeprecatedType {
  EVENT = 'EVENT',
  METHOD = 'METHOD',
  PROPERTY = 'PROPERTY',
}

export enum ProviderEvents {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  ACCOUNTS_CHANGED = 'accountsChanged',
  SET_ACCOUNT = 'setAccount',
  SET_NODE = 'setNode',
  NODES_CHANGED = 'nodesChanged',
  MESSAGE = 'message',
  MESSAGE_LOW_LEVEL = 'message_low_level',
}

export interface Nodes {
  fullHost: string;
  fullNode: string;
  solidityNode: string;
  eventServer: string;
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
  [ProviderEvents.NODES_CHANGED]: (nodes: Nodes) => void;
  [ProviderEvents.MESSAGE_LOW_LEVEL]: (payload: IJsonRpcRequest) => void;
  [ProviderEvents.MESSAGE]: (message: string) => void;
}

export interface RequestArguments {
  id?: number | string;
  method: string;
  params?: unknown[] | Record<string, unknown>;
}

export interface IProviderTron extends ProviderTronBase {
  readonly isTronLink: true;
  tronWeb: TronWeb | null;
  sunWeb: any;
  ready: boolean;
  request<T>(args: RequestArguments): Promise<T>;
}

export interface requestAccountsResponse {
  // 200: ok, 4000: in queue, 4001: user rejected
  code: 200 | 4000 | 4001;
  message: string;
}
