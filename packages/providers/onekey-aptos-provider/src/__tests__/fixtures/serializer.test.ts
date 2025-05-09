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
  SimpleEntryFunctionArgumentTypes,
  EntryFunctionArgumentTypes,
  FixedBytes,
} from '@aptos-labs/ts-sdk';
import { serializeArguments, deserializeArguments } from '../../serializer';
import { hexToBytes } from '@onekeyfe/cross-inpage-provider-core';
import { Types } from 'aptos';

function deepCompare(input: any, output: any): boolean {
  if (input instanceof MoveVector && output instanceof MoveVector) {
    if (input.values.length !== output.values.length) {
      return false;
    }
    return input.values.every((val: any, index: number) => deepCompare(val, output.values[index]));
  } else if (input instanceof MoveOption && output instanceof MoveOption) {
    if (input.isSome() !== output.isSome()) {
      return false;
    }
    return input.isSome() ? deepCompare(input.value, output.value) : true;
  } else if (input instanceof Object && output instanceof Object) {
    return input.constructor === output.constructor && input.value === output.value;
  } else {
    return input === output;
  }
}

describe('Serializer', () => {
  describe('SimpleEntryFunctionArgumentTypes', () => {
    it('should handle primitive types', () => {
      const inputs = [
        null,
        undefined,
        true,
        false,
        42,
        BigInt('0x1234567890'),
        'hello world',
        new Uint8Array([1, 2, 3]),
        new ArrayBuffer(3),
      ];

      const serialized = serializeArguments(inputs);
      const deserialized = deserializeArguments(serialized);

      expect(deserialized[0]).toBeNull();
      expect(deserialized[1]).toBeUndefined();
      expect(deserialized[2]).toBe(true);
      expect(deserialized[3]).toBe(false);
      expect(deserialized[4]).toBe(42);
      expect(deserialized[5]).toBe(BigInt('0x1234567890'));
      expect(deserialized[6]).toBe('hello world');
      expect(deserialized[7]).toEqual(new Uint8Array([1, 2, 3]));
      expect(deserialized[8]).toBeInstanceOf(ArrayBuffer);
    });

    it('should handle nested arrays of primitive types', () => {
      const inputs = [
        [1, 2, 3],
        ['a', 'b', 'c'],
        [true, false],
        [BigInt(1), BigInt(2)],
        [
          [1, 2],
          [3, 4],
        ],
      ];

      const serialized = serializeArguments(inputs);
      const deserialized = deserializeArguments(serialized);

      expect(deserialized).toEqual(inputs);
    });
  });

  describe('EntryFunctionArgumentTypes', () => {
    it('should handle Move types', () => {
      const inputs = [
        new Bool(true),
        new U8(255),
        new U16(65535),
        new U32(4294967295),
        new U64(BigInt('18446744073709551615')),
        new U128(BigInt('340282366920938463463374607431768211455')),
        new U256(BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')),
        new AccountAddress(hexToBytes('1'.repeat(64))),
        new MoveString('SDK'),
        new FixedBytes(hexToBytes('010203')),
      ];

      const serialized = serializeArguments(inputs);
      const deserialized = deserializeArguments(serialized);

      deepCompare(inputs, deserialized);
    });

    it('should handle MoveVector with different element types', () => {
      const inputs = [
        new MoveVector([new U8(1), new U8(2), new U8(3)]),
        new MoveVector([new Bool(true), new Bool(false)]),
        new MoveVector([
          new AccountAddress(hexToBytes('1'.repeat(64))),
          new AccountAddress(hexToBytes('2'.repeat(64))),
        ]),
        new MoveVector([
          new MoveString('SDK'),
          new MoveVector([new Bool(true), new Bool(false)]),
          new MoveVector([new U8(1), new U8(2), new U8(3)]),
          new MoveVector([
            new MoveVector([new U8(1), new U8(2), new U8(3)]),
            new MoveVector([new Bool(true), new Bool(false)]),
          ]),
        ]),
      ];

      const serialized = serializeArguments(inputs);
      const deserialized = deserializeArguments(serialized);

      deepCompare(inputs, deserialized);
    });

    it('should handle nested MoveOption', () => {
      const inputs: (EntryFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes)[] = [
        new MoveOption(), // None
        new MoveOption(new U64(BigInt(42))), // Some(U64)
        new MoveOption(new MoveOption(new Bool(true))), // Some(Some(Bool))
        new MoveOption(new MoveVector([new U8(1), new U8(2)])), // Some(Vector<U8>)
      ];

      const serialized = serializeArguments(inputs);
      const deserialized = deserializeArguments(serialized);

      // None
      expect(deserialized[0]).toBeInstanceOf(MoveOption);
      expect((deserialized[0] as MoveOption<any>).isSome()).toBe(false);

      // Some(U64)
      expect(deserialized[1]).toBeInstanceOf(MoveOption);
      expect((deserialized[1] as MoveOption<U64>).isSome()).toBe(true);
      expect((deserialized[1] as MoveOption<U64>).value).toBeInstanceOf(U64);
      expect((deserialized[1] as MoveOption<U64>).value?.value).toBe(BigInt(42));

      // Some(Some(Bool))
      const nestedOption = deserialized[2] as MoveOption<MoveOption<Bool>>;
      expect(nestedOption.isSome()).toBe(true);
      expect(nestedOption.value).toBeInstanceOf(MoveOption);
      expect(nestedOption.value?.isSome()).toBe(true);
      expect(nestedOption.value?.value).toBeInstanceOf(Bool);
      expect(nestedOption.value?.value?.value).toBe(true);

      // Some(Vector<U8>)
      const optionVector = deserialized[3] as MoveOption<MoveVector<U8>>;
      expect(optionVector.isSome()).toBe(true);
      expect(optionVector.value).toBeInstanceOf(MoveVector);
      expect(optionVector.value?.values.length).toBe(2);
      expect(optionVector.value?.values[0].value).toBe(1);
      expect(optionVector.value?.values[1].value).toBe(2);
    });

    it('should handle large numbers for U64, U128, and U256', () => {
      const inputs = [
        new U64(BigInt('18446744073709551615')), // U64 max value
        new U128(BigInt('340282366920938463463374607431768211455')), // U128 max value
        new U256(BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')), // U256 max value
      ];

      const serialized = serializeArguments(inputs);
      const deserialized = deserializeArguments(serialized);

      deepCompare(inputs, deserialized);
    });

    it('should handle large MoveVector', () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => new U8(i % 256));
      const inputs = [new MoveVector(largeArray)];

      const serialized = serializeArguments(inputs);
      const deserialized = deserializeArguments(serialized);

      deepCompare(inputs, deserialized);
    });
  });

  describe('Mixed Types', () => {
    it('should handle mixture of simple and Move types', () => {
      const inputs: (EntryFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes)[] = [
        42,
        new U64(BigInt(42)),
        'hello',
        new MoveString('hello'),
        [1, 2, new U8(3)],
        new MoveVector([new U8(1), new U8(2)]),
        new MoveOption(new FixedBytes(hexToBytes('010203'))),
        [
          new MoveOption(new U64(BigInt(42))),
          new MoveVector([new Bool(true), new Bool(false)]),
          'simple string',
          456,
        ],
      ];

      const serialized = serializeArguments(inputs);
      const deserialized = deserializeArguments(serialized);

      // 验证简单类型
      expect(deserialized[0]).toBe(42);
      expect(deserialized[2]).toBe('hello');

      // 验证 Move 类型
      expect(deserialized[1]).toBeInstanceOf(U64);
      expect((deserialized[1] as U64).value).toBe(BigInt(42));
      expect(deserialized[3]).toBeInstanceOf(MoveString);
      expect((deserialized[3] as MoveString).value).toBe('hello');

      // 验证混合数组
      const mixedArray = deserialized[4] as Array<number | U8>;
      expect(mixedArray[0]).toBe(1);
      expect(mixedArray[1]).toBe(2);
      expect(mixedArray[2]).toBeInstanceOf(U8);
      expect((mixedArray[2] as U8).value).toBe(3);

      // 验证 MoveVector
      expect(deserialized[5]).toBeInstanceOf(MoveVector);

      // 验证 MoveOption
      expect(deserialized[6]).toBeInstanceOf(MoveOption);
      expect((deserialized[6] as MoveOption<FixedBytes>).isSome()).toBe(true);
      const fixedBytes = (deserialized[6] as MoveOption<FixedBytes>).value;
      expect(fixedBytes).toBeInstanceOf(FixedBytes);
      expect(fixedBytes?.toString()).toEqual(new FixedBytes(hexToBytes('010203')).toString());

      // 验证复杂嵌套结构
      const complexArray = deserialized[7] as Array<any>;
      expect(complexArray[0]).toBeInstanceOf(MoveOption);
      expect(complexArray[0].isSome()).toBe(true);
      const index70 = complexArray[0] as MoveOption<U64>;
      expect(index70).toBeInstanceOf(MoveOption);
      expect(index70.isSome()).toBe(true);
      expect(index70.value).toBeInstanceOf(U64);
      expect(index70.value?.value).toBe(BigInt(42));

      const index71 = complexArray[1] as MoveVector<Bool>;
      expect(index71).toBeInstanceOf(MoveVector);
      expect(index71.values[0]).toBeInstanceOf(Bool);
      expect(index71.values[0].value).toBe(true);
      expect(index71.values[1]).toBeInstanceOf(Bool);
      expect(index71.values[1].value).toBe(false);

      expect(complexArray[2]).toBe('simple string');
      expect(complexArray[3]).toBe(456);
    });

    it('should handle complex nested structures', () => {
      const complexStruct: (EntryFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes)[] = [
        new MoveVector([
          new MoveOption(new U64(BigInt(1))),
          new MoveOption(new U64(BigInt(2))),
          new MoveOption(),
        ]),
        [
          new AccountAddress(hexToBytes('1'.repeat(64))),
          123,
          new MoveVector([new Bool(true), new Bool(false)]),
          [new MoveOption(new MoveVector([new U8(1), new U8(2)])), 'nested string', BigInt(456)],
        ],
      ];

      const serialized = serializeArguments(complexStruct);
      const deserialized = deserializeArguments(serialized);

      // 验证第一个元素：MoveVector<MoveOption<U64>>
      const vectorOfOptions = deserialized[0] as MoveVector<MoveOption<U64>>;
      expect(vectorOfOptions).toBeInstanceOf(MoveVector);
      expect(vectorOfOptions.values[0].value?.value).toBe(BigInt(1));
      expect(vectorOfOptions.values[1].value?.value).toBe(BigInt(2));
      expect(vectorOfOptions.values[2].isSome()).toBe(false);

      // 验证第二个元素：混合数组
      const mixedArray = deserialized[1] as Array<any>;
      expect(mixedArray[0]).toBeInstanceOf(AccountAddress);
      expect(mixedArray[1]).toBe(123);
      expect(mixedArray[2]).toBeInstanceOf(MoveVector);

      // 验证深层嵌套
      const nestedArray = mixedArray[3] as Array<any>;
      expect(nestedArray[0]).toBeInstanceOf(MoveOption);
      expect(nestedArray[1]).toBe('nested string');
      expect(nestedArray[2]).toBe(BigInt(456));
    });
  });
});
