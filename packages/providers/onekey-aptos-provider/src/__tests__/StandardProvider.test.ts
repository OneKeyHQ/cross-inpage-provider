import { TextDecoder, TextEncoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;

import {
  AccountAddress,
  ChainId,
  Deserializer,
  EntryFunction,
  RawTransaction,
  SimpleTransaction,
  TransactionExecutableEntryFunction,
  TransactionExtraConfigV1,
  TransactionInnerPayloadV1,
  TransactionPayloadEntryFunction,
} from '@aptos-labs/ts-sdk';

import { serializeStandardTransaction } from '../standardWalletUtils';

const TEST_EXPIRATION_TIMESTAMP_SECS = BigInt(1_800_000_000);

function buildTransaction({ orderless }: { orderless: boolean }): SimpleTransaction {
  const entryFunction = EntryFunction.build('0x1::aptos_account', 'transfer', [], []);
  const payload = orderless
    ? new TransactionInnerPayloadV1(
        new TransactionExecutableEntryFunction(entryFunction),
        new TransactionExtraConfigV1(undefined, BigInt(1)),
      )
    : new TransactionPayloadEntryFunction(entryFunction);

  return new SimpleTransaction(
    new RawTransaction(
      AccountAddress.ONE,
      orderless ? BigInt(0xdeadbeef) : BigInt(0),
      payload,
      BigInt(100),
      BigInt(1),
      TEST_EXPIRATION_TIMESTAMP_SECS,
      new ChainId(1),
    ),
  );
}

describe('serializeStandardTransaction', () => {
  it.each([
    ['sequence-number', false],
    ['orderless', true],
  ])('preserves a %s transaction as BCS bytes', (_, orderless) => {
    const transaction = buildTransaction({ orderless });
    const serialized = serializeStandardTransaction(transaction);
    const deserialized = SimpleTransaction.deserialize(
      new Deserializer(Buffer.from(serialized, 'hex')),
    );

    expect(serialized).toBe(transaction.bcsToHex().toStringWithoutPrefix());
    expect(deserialized.rawTransaction.payload.constructor).toBe(
      transaction.rawTransaction.payload.constructor,
    );

    if (orderless) {
      const payload = deserialized.rawTransaction.payload as TransactionInnerPayloadV1;
      expect(payload.extra_config).toBeInstanceOf(TransactionExtraConfigV1);
      expect((payload.extra_config as TransactionExtraConfigV1).replayProtectionNonce).toBe(
        BigInt(1),
      );
    }
  });
});
