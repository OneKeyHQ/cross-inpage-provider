export interface GetInfoResponse {
  node: {
    alias: string;
    pubkey: string;
    color?: string;
  };
  // "request.*" methods are not supported by all connectors
  // (see webln.request for more info)
  methods: string[]; // e.g. "makeInvoice", "sendPayment", "request.openchannel", ...
}

export interface IProviderApi {
  isOneKey?: boolean;
  on(event: string, listener: (...args: any[]) => void): this;
  off(event: string, listener: (...args: any[]) => void): this;
  enable(): Promise<void>;
  isEnabled(): Promise<boolean>;
  lnurl(lnurl: string): Promise<void>;
  getInfo(): Promise<GetInfoResponse>;
  getBalance(): Promise<any>;
  getAddress(): Promise<{
    address: string;
    derivationPath: string;
    index: number;
    publicKey: string;
  }>;
  signMessage(message: string): Promise<{
    message: string;
    signature: string;
  }>;
  verifyMessage(signature: string, message: string): Promise<void>;
  makeInvoice(options: {
    amount?: string | number;
    defaultAmount?: string | number;
    minimumAmount?: string | number;
    maximumAmount?: string | number;
    defaultMemo?: string;
  }): Promise<{
    paymentRequest: string;
  }>;
  sendPayment(invoice: string): Promise<{
    preimage: string;
  }>;
  sendPaymentAsync(invoice: string): void;
  keysend(options: {
    destination: string;
    amount: string | number;
    customRecords?: Record<string, string>;
  }): Promise<{
    preimage: string;
  }>;
}

export interface IProviderInfo {
  uuid: string;
  name: string;
  inject?: string; // window.ethereum
}
