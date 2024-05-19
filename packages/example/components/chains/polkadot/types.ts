import type { InjectedExtension } from '@polkadot/extension-inject/types';

export type IProviderApi = InjectedExtension

export interface IProviderInfo {
  uuid: string;
  name: string;
  provider: InjectedExtension;
}
