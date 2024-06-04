export interface IProviderApi {
  isOneKey?: boolean;
  apiVersion: string;
  name: string;
  icon: string;
  supportedExtensions: any[];
  enable(): Promise<any>;
  isEnabled(): Promise<boolean>;
  getExtensions(): Promise<any[]>;
  getNetworkId(): Promise<number>;
}

export interface IProviderInfo {
  uuid: string;
  name: string;
  inject?: string; // window.ethereum
}
