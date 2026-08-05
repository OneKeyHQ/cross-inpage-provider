import { Transaction, VersionedTransaction } from '@solana/web3.js';
import base58 from 'bs58';

interface Indexed<T> {
  length: number;
  [index: number]: T;
}

export const encodeTransaction = (transaction: Transaction | VersionedTransaction): string => {
  return base58.encode(transaction.serialize({ requireAllSignatures: false }));
};

export const decodeSignedTransaction = ({
  message,
  onlyVersionedTx,
}: {
  message: string;
  onlyVersionedTx?: boolean;
}): Transaction | VersionedTransaction => {
  const txByte = base58.decode(message);
  if (onlyVersionedTx) {
    return VersionedTransaction.deserialize(txByte);
  }
  try {
    return Transaction.from(txByte);
  } catch {
    return VersionedTransaction.deserialize(txByte);
  }
};

export function isWalletEventMethodMatch(method: string, name: string) {
  return method === `metamask_${name}` || method === `wallet_events_${name}`;
}

export function bytesEqual(a: ArrayLike<number>, b: ArrayLike<number>): boolean {
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

export function parseToNativeTx(txByte: Uint8Array): Transaction | VersionedTransaction {
  try {
    return Transaction.from(txByte);
  } catch (e) {
    return VersionedTransaction.deserialize(txByte);
  }
}

export const OFFCHAIN_MESSAGE_SIGNER_LENGTH = 32;

/**
 * Normalizes required signers of a version 1 offchain message to base58 strings for the bridge.
 *
 * The wallet is what actually sorts the signers and builds the preamble, so the order is left
 * untouched here. Emptiness, byte length and duplicates are checked up front so that a dapp gets
 * a synchronous error instead of a rejected signing prompt.
 */
export function normalizeRequiredSigners(
  requiredSigners: readonly (string | Uint8Array)[],
): string[] {
  // Kept as a plain boolean: `Array.isArray` narrows a readonly array to `any[]`, which would
  // erase the element type for every use below.
  const isArray: boolean = Array.isArray(requiredSigners);
  if (!isArray || requiredSigners.length === 0) {
    throw new Error('requiredSigners must be a non-empty array');
  }

  const seen = new Set<string>();
  return requiredSigners.map((signer) => {
    const encoded = typeof signer === 'string' ? signer : base58.encode(signer);

    let decoded: Uint8Array;
    try {
      decoded = base58.decode(encoded);
    } catch {
      throw new Error(`requiredSigners contains an invalid base58 public key: ${encoded}`);
    }
    if (decoded.length !== OFFCHAIN_MESSAGE_SIGNER_LENGTH) {
      throw new Error(
        `requiredSigners must contain ${OFFCHAIN_MESSAGE_SIGNER_LENGTH}-byte public keys, got ${decoded.length} bytes`,
      );
    }
    if (seen.has(encoded)) {
      throw new Error(`requiredSigners must be unique, got a duplicate of ${encoded}`);
    }
    seen.add(encoded);

    return encoded;
  });
}
