export interface IProviderApi {
  isOneKey?: boolean;
  requestAccounts(): Promise<string[]>;
  getAccounts(): Promise<string[]>;
}

export interface IProviderInfo {
  uuid: string;
  name: string;
  inject?: string; // window.ethereum
}
