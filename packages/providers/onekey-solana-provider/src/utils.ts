import { Transaction, VersionedTransaction } from '@solana/web3.js';
import base58 from 'bs58';

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
