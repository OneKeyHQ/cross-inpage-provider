import type { TronWeb } from '@onekeyfe/onekey-tron-provider';

export interface IProviderApi {
  isOneKey?: boolean;
  request<T>({ method, params }: { method: string; params?: any }): Promise<T>;
  on(event: string, callback: (...args: any[]) => void): void;
  removeListener(event: string, callback: (...args: any[]) => void): void;
  tronWeb?: TronWeb;
}

export interface IProviderInfo {
  uuid: string;
  name: string;
  inject?: string; // window.ethereum
}

export interface ITIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon?: string;
  rdns?: string;
  inject?: string; // window.ethereum
}

export interface ITIP6963ProviderDetail {
  info: ITIP6963ProviderInfo;
  provider?: IProviderApi;
}

export interface ITIP6963AnnounceProviderEvent extends CustomEvent {
  type: 'eip6963:announceProvider';
  detail: ITIP6963ProviderDetail;
}