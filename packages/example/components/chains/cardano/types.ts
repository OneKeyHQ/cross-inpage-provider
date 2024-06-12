import type { WalletApi } from 'lucid-cardano';

export interface IProviderApi {
  isOneKey?: boolean;
  apiVersion: string;
  name: string;
  icon: string;
  supportedExtensions: any[];
  enable(): Promise<WalletApi>;
  isEnabled(): Promise<boolean>;
  getExtensions(): Promise<any[]>;
  getNetworkId(): Promise<number>;
  on(event: string, listener: (...args: any[]) => void): void;
  off(event: string, listener: (...args: any[]) => void): void;
  experimental: {
    on(eventName: string, callback: (detail: any) => void): void;
    off(): void;
  };
}

export interface IProviderInfo {
  uuid: string;
  name: string;
  inject?: string; // window.ethereum
}
