import { Transaction, VersionedTransaction } from '@solana/web3.js';
import base58 from 'bs58';

interface Indexed<T> {
  length: number;
  [index: number]: T;
}

export const encodeTransaction = (transaction: Transaction | VersionedTransaction): string => {
  return base58.encode(transaction.serialize({ requireAllSignatures: false }));
};

export const decodeSignedTransaction = (message: string): Transaction | VersionedTransaction => {
  const txByte = base58.decode(message);
  try {
    return Transaction.from(txByte);
  } catch {
    return VersionedTransaction.deserialize(txByte);
  }
};

export function isWalletEventMethodMatch(method: string, name: string) {
  return method === `metamask_${name}` || method === `wallet_events_${name}`;
}

export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  return arraysEqual(a, b);
}

export function arraysEqual<T>(a: Indexed<T>, b: Indexed<T>): boolean {
  if (a === b) return true;

  const length = a.length;
  if (length !== b.length) return false;

  for (let i = 0; i < length; i++) {
    if (a[i] !== b[i]) return false;
  }

  return true;
}
