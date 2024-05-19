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
  enable(): Promise<void>;
  getInfo(): Promise<GetInfoResponse>;
}

export interface IProviderInfo {
  uuid: string;
  name: string;
  inject?: string; // window.ethereum
}
