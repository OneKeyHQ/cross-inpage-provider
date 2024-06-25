import { SignClient } from '@walletconnect/sign-client';
import type { Transaction } from 'algosdk';

export type IProviderApi = typeof SignClient;

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

// generated algo tx types
export interface MultisigMetadata {
  version: number;
  threshold: number;
  addrs: string[];
}

export interface SignerTransaction {
  txn: Transaction;
  authAddr?: string;
  msig?: MultisigMetadata;
  signers?: string[];
  message?: string;
}

export interface WalletTransaction {
  txn: string;
  authAddr?: string;
  msig?: MultisigMetadata;
  signers?: string[];
  message?: string;
}

export interface JsonRpcRequest<T = any> {
  id: number;
  jsonrpc: string;
  method: string;
  params: T;
}
