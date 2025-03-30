import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
// @ts-expect-error
global.TextDecoder = TextDecoder;

import {
  Bool,
  U8,
  U16,
  U32,
  U64,
  U128,
  U256,
  AccountAddress,
  MoveVector,
  MoveOption,
  MoveString,
} from '@aptos-labs/ts-sdk';
import { serializeTransactionPayload, deserializeTransactionPayload } from '../serializer';
import { hexToBytes } from '@noble/hashes/utils';
import { TxnBuilderTypes } from 'aptos';
import { get } from 'lodash';

describe('TransactionPayloadSerializer', () => {
  it('serialize v1 wormhole payload', () => {
    const script = new TxnBuilderTypes.Script(
      hexToBytes('0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20'),
      [],
      [
        new TxnBuilderTypes.TransactionArgumentU8(1),
        new TxnBuilderTypes.TransactionArgumentU64(BigInt('18446744073709551615')),
        new TxnBuilderTypes.TransactionArgumentU128(
          BigInt('340282366920938463463374607431768211455'),
        ),
        new TxnBuilderTypes.TransactionArgumentBool(true),
        new TxnBuilderTypes.TransactionArgumentAddress(
          new TxnBuilderTypes.AccountAddress(hexToBytes('1'.repeat(64))),
        ),
        new TxnBuilderTypes.TransactionArgumentU8Vector(
          hexToBytes('0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20'),
        ),
      ],
    );

    const payload = new TxnBuilderTypes.TransactionPayloadScript(script);
    // @ts-expect-error
    const serialized = serializeTransactionPayload(payload);
    const deserialized = deserializeTransactionPayload(serialized);

    expect(get(deserialized, 'bytecode')).toEqual(script.code);
    const sourceArgs = script.args;
    const deserializedArgs = deserialized.functionArguments;

    expect(deserializedArgs.length).toEqual(sourceArgs.length);
    for (let i = 0; i < sourceArgs.length; i++) {
      const currentSourceArg = sourceArgs[i];
      const currentDeserializedArg = deserializedArgs[i];

      if (currentDeserializedArg instanceof MoveVector) {
        // @ts-expect-error
        const currentSourceArgValues = currentSourceArg.value as Uint8Array;
        const currentDeserializedArgValues = currentDeserializedArg.values as {
          value: number;
        }[];
        for (let j = 0; j < currentSourceArgValues.length; j++) {
          expect(currentDeserializedArgValues[j].value).toEqual(currentSourceArgValues[j]);
        }
      } else if (currentDeserializedArg instanceof MoveOption) {
        // @ts-expect-error
        expect(currentDeserializedArg.value).toEqual(currentSourceArg.value);
      } else if (
        currentDeserializedArg instanceof MoveString ||
        currentDeserializedArg instanceof Bool
      ) {
        // @ts-expect-error
        expect(currentDeserializedArg.value).toEqual(currentSourceArg.value);
      } else if (
        currentDeserializedArg instanceof U8 ||
        currentDeserializedArg instanceof U16 ||
        currentDeserializedArg instanceof U32 ||
        currentDeserializedArg instanceof U64 ||
        currentDeserializedArg instanceof U128 ||
        currentDeserializedArg instanceof U256
      ) {
        // @ts-expect-error
        expect(currentDeserializedArg.value.toString()).toEqual(currentSourceArg.value.toString());
      } else if (currentDeserializedArg instanceof AccountAddress) {
        // @ts-expect-error
        expect(currentDeserializedArg.data).toEqual(currentSourceArg.value.address);
      } else {
        throw new Error('Unknown argument type');
      }
    }
  });
});
