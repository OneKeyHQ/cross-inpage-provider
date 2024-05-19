export interface IProviderApi {
  isOneKey?: boolean;
  getPublicKey(): Promise<string>;
}

export interface IProviderInfo {
  uuid: string;
  name: string;
  inject?: string; // window.ethereum
}
