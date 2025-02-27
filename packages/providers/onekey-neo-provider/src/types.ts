import type * as TypeUtils from './type-utils';
export interface IAccount {
  address: string;
}

export interface INeoGetProviderResponse {
  name: string;
  website: string;
  version: string;
  compatibility: string[]
}

export interface INeoNetworkResponse {
  networks: string[];  // Array of network names the wallet provider has available
  chainId: number;     // ChainId the wallet is currently set to
  defaultNetwork: string; // Network the wallet is currently set to
}

export interface INeoProviderMethods {
  getProvider(): Promise<INeoGetProviderResponse>;
  getNetworks(): Promise<INeoNetworkResponse>;
}

export interface NeoProviderEventsMap {
  connect: () => void;
  disconnect: () => void;
  accountChanged: () => void;
  message_low_level: (payload: { method: string; [key: string]: any }) => void;
}

export type JsBridgeRequest = {
  [K in keyof INeoProviderMethods]: (params: Parameters<INeoProviderMethods[K]>[0]) => Promise<TypeUtils.WireStringified<TypeUtils.ResolvePromise<ReturnType<INeoProviderMethods[K]>>>>
}

export type JsBridgeRequestParams<T extends keyof JsBridgeRequest> = Parameters<JsBridgeRequest[T]>[0]

export type JsBridgeRequestResponse<T extends keyof JsBridgeRequest> = ReturnType<JsBridgeRequest[T]>
