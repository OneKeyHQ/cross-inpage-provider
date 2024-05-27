export interface EnableNetworkOpts {
  genesisID?: string;
  genesisHash?: string;
}

export interface EnableAccountsOpts {
  accounts?: string[];
}

export type EnableOpts = EnableNetworkOpts & EnableAccountsOpts;

export interface EnableNetworkResult {
  genesisID: string;
  genesisHash: string;
}

export interface EnableAccountsResult {
  accounts: string[];
}

export type EnableResult = EnableNetworkResult & EnableAccountsResult;

export type SignTxnsResult = (string | null)[];

export interface WalletTransaction {
  txn: string;
  authAddr?: string;
  signers?: string[];
  stxn?: string;
}

export interface PostTxnsResult {
  txnIDs: string[];
}

export type Query<F> = {
  format?: F;
  [key: string]: any;
};

export interface BaseHTTPClientResponse {
  body: Uint8Array;
  status: number;
  headers: Record<string, string>;
}

export interface BaseHTTPClientError {
  response: BaseHTTPClientResponse;
}

export interface BaseHTTPClient {
  get(
    relativePath: string,
    query?: Query<string>,
    requestHeaders?: Record<string, string>,
  ): Promise<BaseHTTPClientResponse>;
  post(
    relativePath: string,
    data: Uint8Array,
    query?: Query<string>,
    requestHeaders?: Record<string, string>,
  ): Promise<BaseHTTPClientResponse>;
  delete(
    relativePath: string,
    data: Uint8Array,
    query?: Query<string>,
    requestHeaders?: Record<string, string>,
  ): Promise<BaseHTTPClientResponse>;
}

export interface IProviderAlgo {
  enable(opts?: EnableOpts): Promise<EnableResult>;

  signTxns(transactions: WalletTransaction[]): Promise<SignTxnsResult>;

  postTxns(transactions: string[]): Promise<PostTxnsResult>;

  signAndPostTxns(transactions: WalletTransaction[]): Promise<PostTxnsResult>;

  getAlgodv2Client(): Promise<BaseHTTPClient>;

  getIndexerClient(): Promise<BaseHTTPClient>;
}
