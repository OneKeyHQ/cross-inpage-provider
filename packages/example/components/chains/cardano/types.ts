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
  on(event: string, listener: (...args: any[]) => void): void;
  removeListener(event: string, listener: (...args: any[]) => void): void;
}

export interface IProviderInfo {
  uuid: string;
  name: string;
  inject?: string; // window.ethereum
}
