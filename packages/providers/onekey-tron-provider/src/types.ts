import { IJsonRpcRequest } from '@onekeyfe/cross-inpage-provider-types';
import TronWeb, { UnsignedTransaction, SignedTransaction } from 'tronweb';

import { ProviderTronBase } from './ProviderTronBase';

export enum ProviderEvents {
  TAB_REPLY = 'tabReply',
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  ACCOUNTS_CHANGED = 'accountsChanged',
  SET_ACCOUNT = 'setAccount',
  SET_NODE = 'setNode',
  NODES_CHANGED = 'nodesChanged',
  MESSAGE = 'message',
  MESSAGE_LOW_LEVEL = 'message_low_level',
  CHAIN_CHANGED = 'chainChanged',
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

export type Callback = false | ((err: Error | null, info: any) => any);

export interface IProviderTron extends ProviderTronBase {
  readonly isTronLink: true;
  tronWeb: TronWeb | null;
  sunWeb: any;
  ready: boolean;
  request<T>(args: RequestArguments): Promise<T>;
  sign(transaction: UnsignedTransaction): Promise<SignedTransaction>;
  getNodeInfo(callback?: Callback): Promise<any>;
}

export interface requestAccountsResponse {
  // 200: ok, 4000: in queue, 4001: user rejected
  code: 200 | 4000 | 4001;
  message: string;
}
