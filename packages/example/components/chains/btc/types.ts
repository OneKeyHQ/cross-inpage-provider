export interface IProviderApi {
  isOneKey?: boolean;
  on(event: string, listener: (...args: any[]) => void): this;
  removeListener(event: string, listener: (...args: any[]) => void): this;
  requestAccounts(): Promise<string[]>;
  getAccounts(): Promise<string[]>;
  getNetwork(): Promise<string>;
  switchNetwork(network: string): Promise<string>;
  getChain(): Promise<any>;
  switchChain(chain: string): Promise<any>;
  getPublicKey(): Promise<string>;
  getBalance(): Promise<{
    confirmed: number;
    unconfirmed: number;
    total: number;
  }>;
  signMessage(msg: string, type: string): Promise<string>;
  sendBitcoin(
    toAddress: string,
    satoshis: number,
    options?: {
      feeRate: number;
    },
  ): Promise<string>;
  pushTx(options: { rawtx: string }): Promise<string>;
  signPsbt(
    psbtHex: string,
    options: {
      autoFinalized: boolean;
      toSignInputs: {
        index: number;
        address: string;
        publicKey: string;
        sighashType: number[];
      }[];
    },
  ): Promise<string>;
  signPsbts(
    psbtHexs: string[],
    options: {
      autoFinalized: boolean;
      toSignInputs: {
        index: number;
        address: string;
        publicKey: string;
        sighashType: number[];
      }[];
    }[],
  ): Promise<string[]>;
  pushPsbt(psbtHex: string): Promise<string>;
}

export interface IProviderInfo {
  uuid: string;
  name: string;
  inject?: string; // window.ethereum
}
