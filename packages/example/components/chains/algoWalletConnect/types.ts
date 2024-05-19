export interface IResult {
  method: string;
  body: Array<
    Array<{
      txID: string;
      signingAddress?: string;
      signature: string;
    } | null>
  >;
}
export interface IMultisigMetadata {
  version: number;
  threshold: number;
  addrs: string[];
}

export interface IWalletTransaction {
  txn: string;
  authAddr?: string;
  msig?: IMultisigMetadata;
  signers?: string[];
  message?: string;
}

export interface ISignTxnOpts {
  message?: string;
}

export type SignTxnParams = [IWalletTransaction[], ISignTxnOpts?];

/* eslint-enable */
