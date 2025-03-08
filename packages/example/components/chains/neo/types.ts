export interface IProviderApi {
  isOneKey?: boolean;
  on(event: string, listener: (...args: any[]) => void): this;
  removeListener(event: string, listener: (...args: any[]) => void): this;
  requestAccounts(): Promise<string[]>;
  getAccounts(): Promise<string[]>;
  getNetwork(): Promise<string>;
  switchNetwork(network: string): Promise<string>;
  getProvider(): Promise<{
    name: string;
    website: string;
    version: string;
    compatibility: string[];
    extra?: object;
  }>;
  invokeRead(params: {
    scriptHash: string;
    operation: string;
    args: any[];
    signers: any[];
  }): Promise<any>;
  signMessage(message: string): Promise<{
    publicKey: string;
    data: string;
    salt: string;
    message: string;
  }>;
}

export interface IProviderInfo {
  uuid: string;
  name: string;
  inject?: string; // window.ethereum
}
