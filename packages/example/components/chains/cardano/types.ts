export interface IProviderApi {
  isOneKey?: boolean;
  enable(): Promise<any>;
}

export interface IProviderInfo {
  uuid: string;
  name: string;
  inject?: string; // window.ethereum
}
