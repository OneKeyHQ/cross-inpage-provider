import { Transaction } from '@solana/web3.js';
import base58 from 'bs58';

export const encodeTransaction = (transaction: Transaction): string => {
  return base58.encode(transaction.serialize({requireAllSignatures: false}));
};

export const decodeSignedTransaction = (message: string): Transaction => {
  return Transaction.from(base58.decode(message));
};

export function isWalletEventMethodMatch(method: string, name: string) {
  return method === `metamask_${name}` || method === `wallet_events_${name}`;
}
