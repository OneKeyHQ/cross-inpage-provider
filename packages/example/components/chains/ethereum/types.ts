export interface IEthereumProvider {
  isOneKey?: boolean;
  isBitKeep?: boolean;
  enable: () => Promise<string[]>;
  request: (args: any) => Promise<any>;
  once(eventName: string | symbol, listener: (...args: any[]) => void): this;
  on(eventName: string | symbol, listener: (...args: any[]) => void): this;
  off(eventName: string | symbol, listener: (...args: any[]) => void): this;
  addListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
  removeListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
  removeAllListeners(event?: string | symbol): this;
}

export interface IEIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon?: string;
  rdns?: string;
  inject?: string; // window.ethereum
}

export interface IEIP6963ProviderDetail {
  info: IEIP6963ProviderInfo;
  provider?: IEthereumProvider;
}

export interface IEIP6963AnnounceProviderEvent extends CustomEvent {
  type: 'eip6963:announceProvider';
  detail: IEIP6963ProviderDetail;
}
