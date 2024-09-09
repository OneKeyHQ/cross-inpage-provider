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
  signTransaction(transafe: Transaction | VersionedTransaction): Promise<Transaction | VersionedTransaction>;
  signAllTransactions(transafe: Transaction[]): Promise<(Transaction | VersionedTransaction)[]>;
  on(event: string, listener: (...args: any[]) => void): void;
  removeListener(event: string, listener: (...args: any[]) => void): void;
}

export interface IProviderInfo {
  uuid: string;
  name: string;
  inject?: string; // window.ethereum
}
