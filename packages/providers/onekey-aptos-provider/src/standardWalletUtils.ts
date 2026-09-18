import type { AnyRawTransaction } from '@aptos-labs/ts-sdk';

export function serializeStandardTransaction(transaction: AnyRawTransaction): string {
  return transaction.bcsToHex().toStringWithoutPrefix();
}
