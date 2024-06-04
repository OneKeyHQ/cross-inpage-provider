import type { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';

export interface IProviderApi {
  isOneKey?: boolean;
  publicKey?: PublicKey;
  connect(): Promise<{
    publicKey: PublicKey;
  }>;
  disconnect(): Promise<void>;
  signMessage(
    data: Uint8Array,
    display?: string,
  ): Promise<{
    signature: Uint8Array;
    publicKey: PublicKey;
  }>;
  signAndSendTransaction(transafe: Transaction): Promise<{
    signature: Uint8Array;
  }>;
  signTransaction(transafe: Transaction | VersionedTransaction): Promise<string>;
  signAllTransactions(transafe: Transaction[]): Promise<string[]>;
}

export interface IProviderInfo {
  uuid: string;
  name: string;
  inject?: string; // window.ethereum
}
