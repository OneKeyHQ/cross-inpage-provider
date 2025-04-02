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
  InputEntryFunctionData,
} from '@aptos-labs/ts-sdk';
import { serializeTransactionPayload, deserializeTransactionPayload, TransactionPayloadV2SDK } from '../../serializer';
import { hexToBytes } from '@noble/hashes/utils';
import { TxnBuilderTypes, Types } from 'aptos';
import { get } from 'lodash';

describe('TransactionPayloadSerializer', () => {
  it('serialize v1 payload', () => {
    const payload: Types.TransactionPayload_ScriptPayload = {
      type: 'script_payload',
      code: {
        bytecode: '0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20',
      },
      type_arguments: [],
      arguments: [
        1,
        '18446744073709551615',
        '340282366920938463463374607431768211455',
        true,
        '1'.repeat(64),
        '0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20',
      ],
    };

    const serialized = serializeTransactionPayload(payload);
    const deserialized = deserializeTransactionPayload(serialized) as TransactionPayloadV2SDK;

    expect(get(deserialized, 'bytecode')).toEqual(payload.code.bytecode);
    const sourceArgs = payload.arguments;
    const deserializedArgs = deserialized.functionArguments;

    expect(deserializedArgs.length).toEqual(sourceArgs.length);
    for (let i = 0; i < sourceArgs.length; i++) {
      const currentSourceArg = sourceArgs[i];
      const currentDeserializedArg = deserializedArgs[i];

      expect(currentDeserializedArg?.toString()).toEqual(currentSourceArg.toString());
    }
  });

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
    const deserialized = deserializeTransactionPayload(serialized) as TransactionPayloadV2SDK;

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

  it('serialize v2 payload', () => {
    const payload: InputEntryFunctionData = {
      function:
        '0xe52923154e25c258d9befb0237a30b4001c63dc3bb73011c29cb3739befffcef::router_v2dot1::swap_exact_input',
      typeArguments: [
        '0x1::aptos_coin::AptosCoin',
        '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC',
      ],
      functionArguments: ['2272000', '61199'],
    };
    const serialized = serializeTransactionPayload(payload);
    const deserialized = deserializeTransactionPayload(serialized) as TransactionPayloadV2SDK;

    expect(get(deserialized, 'function')).toEqual(payload.function);
    const sourceArgs = payload.functionArguments;
    const deserializedArgs = deserialized.functionArguments;

    expect(deserializedArgs.length).toEqual(sourceArgs.length);
    for (let i = 0; i < sourceArgs.length; i++) {
      const currentSourceArg = sourceArgs[i];
      const currentDeserializedArg = deserializedArgs[i];

      expect(currentDeserializedArg).toEqual(currentSourceArg);
    }
  });
});
