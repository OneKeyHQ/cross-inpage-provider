import type { ProviderAptos } from '@onekeyfe/onekey-aptos-provider';

export type IProviderApi = ProviderAptos

export interface IProviderInfo {
  uuid: string;
  name: string;
  inject?: string; // window.ethereum
}
