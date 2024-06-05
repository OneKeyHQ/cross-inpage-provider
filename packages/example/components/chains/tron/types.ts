import type { TronWeb } from '@onekeyfe/onekey-tron-provider';

export interface IProviderApi {
  isOneKey?: boolean;
  request<T>({ method, params }: { method: string; params?: any }): Promise<T>;
  tronWeb?: TronWeb;
}

export interface IProviderInfo {
  uuid: string;
  name: string;
  inject?: string; // window.ethereum
}
