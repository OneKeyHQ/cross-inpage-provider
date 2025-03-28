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
import { serializeArguments, deserializeArguments } from '../serializer';
import { hexToBytes, bytesToHex } from '@noble/hashes/utils';

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
        new AccountAddress(hexToBytes('1'.repeat(32))),
        new MoveString('hello'),
      ];

      const serialized = serializeArguments(inputs);
      const deserialized = deserializeArguments(serialized);

      inputs.forEach((input, index) => {
        expect(deserialized[index]).toBeInstanceOf(input.constructor);
        // expect((deserialized[index] as any).value).toEqual(input.value);
        console.log(deserialized[index]);
      });
    });

    // it('should handle MoveVector with different element types', () => {
    //   const inputs = [
    //     new MoveVector([new U8(1), new U8(2), new U8(3)]),
    //     new MoveVector([new Bool(true), new Bool(false)]),
    //     new MoveVector([
    //       new AccountAddress(hexToBytes('1'.repeat(32))),
    //       new AccountAddress(hexToBytes('2'.repeat(32))),
    //     ]),
    //   ];

    //   const serialized = serializeArguments(inputs);
    //   const deserialized = deserializeArguments(serialized);

    //   inputs.forEach((input, index) => {
    //     expect(deserialized[index]).toBeInstanceOf(MoveVector);
    //     const deserializedVector = deserialized[index] as MoveVector<any>;
    //     expect(deserializedVector.value.length).toBe(input.value.length);
    //     deserializedVector.value.forEach((item: any, i: number) => {
    //       expect(item).toBeInstanceOf(input.value[i].constructor);
    //       expect(item.value).toEqual(input.value[i].value);
    //     });
    //   });
    // });

    // it('should handle nested MoveOption', () => {
    //   const inputs = [
    //     new MoveOption(), // None
    //     new MoveOption(new U64(42n)), // Some(U64)
    //     new MoveOption(new MoveOption(new Bool(true))), // Some(Some(Bool))
    //     new MoveOption(new MoveVector([new U8(1), new U8(2)])), // Some(Vector<U8>)
    //   ];

    //   const serialized = serializeArguments(inputs);
    //   const deserialized = deserializeArguments(serialized);

    //   // None
    //   expect(deserialized[0]).toBeInstanceOf(MoveOption);
    //   expect((deserialized[0] as MoveOption<any>).isSome()).toBe(false);

    //   // Some(U64)
    //   expect(deserialized[1]).toBeInstanceOf(MoveOption);
    //   expect((deserialized[1] as MoveOption<U64>).isSome()).toBe(true);
    //   expect((deserialized[1] as MoveOption<U64>).value).toBeInstanceOf(U64);
    //   expect((deserialized[1] as MoveOption<U64>).value.value).toBe(42n);

    //   // Some(Some(Bool))
    //   const nestedOption = deserialized[2] as MoveOption<MoveOption<Bool>>;
    //   expect(nestedOption.isSome()).toBe(true);
    //   expect(nestedOption.value).toBeInstanceOf(MoveOption);
    //   expect(nestedOption.value.isSome()).toBe(true);
    //   expect(nestedOption.value.value).toBeInstanceOf(Bool);
    //   expect(nestedOption.value.value.value).toBe(true);

    //   // Some(Vector<U8>)
    //   const optionVector = deserialized[3] as MoveOption<MoveVector<U8>>;
    //   expect(optionVector.isSome()).toBe(true);
    //   expect(optionVector.value).toBeInstanceOf(MoveVector);
    //   expect(optionVector.value.value.length).toBe(2);
    //   expect(optionVector.value.value[0].value).toBe(1);
    //   expect(optionVector.value.value[1].value).toBe(2);
    // });
  });

  //   describe('Mixed Types', () => {
  //     it('should handle mixture of simple and Move types', () => {
  //       const inputs = [
  //         42,
  //         new U64(42n),
  //         'hello',
  //         new MoveString('hello'),
  //         [1, 2, new U8(3)],
  //         new MoveVector([new U8(1), new U8(2)]),
  //         new MoveOption(123),
  //         [new MoveOption(new U64(42n)), new MoveVector([new Bool(true)]), 'simple string', 456],
  //       ];

  //       const serialized = serializeArguments(inputs);
  //       const deserialized = deserializeArguments(serialized);

  //       // 验证简单类型
  //       expect(deserialized[0]).toBe(42);
  //       expect(deserialized[2]).toBe('hello');

  //       // 验证 Move 类型
  //       expect(deserialized[1]).toBeInstanceOf(U64);
  //       expect((deserialized[1] as U64).value).toBe(42n);
  //       expect(deserialized[3]).toBeInstanceOf(MoveString);
  //       expect((deserialized[3] as MoveString).value).toBe('hello');

  //       // 验证混合数组
  //       const mixedArray = deserialized[4] as Array<number | U8>;
  //       expect(mixedArray[0]).toBe(1);
  //       expect(mixedArray[1]).toBe(2);
  //       expect(mixedArray[2]).toBeInstanceOf(U8);
  //       expect((mixedArray[2] as U8).value).toBe(3);

  //       // 验证 MoveVector
  //       expect(deserialized[5]).toBeInstanceOf(MoveVector);

  //       // 验证复杂嵌套结构
  //       const complexArray = deserialized[7] as Array<any>;
  //       expect(complexArray[0]).toBeInstanceOf(MoveOption);
  //       expect(complexArray[1]).toBeInstanceOf(MoveVector);
  //       expect(complexArray[2]).toBe('simple string');
  //       expect(complexArray[3]).toBe(456);
  //     });

  //     it('should handle complex nested structures', () => {
  //       const complexStruct = [
  //         new MoveVector([
  //           new MoveOption(new U64(1n)),
  //           new MoveOption(new U64(2n)),
  //           new MoveOption(),
  //         ]),
  //         [
  //           new AccountAddress('0x1'),
  //           123,
  //           new MoveVector([new Bool(true), new Bool(false)]),
  //           [new MoveOption(new MoveVector([new U8(1), new U8(2)])), 'nested string', BigInt(456)],
  //         ],
  //       ];

  //       const serialized = serializeArguments(complexStruct);
  //       const deserialized = deserializeArguments(serialized);

  //       // 验证第一个元素：MoveVector<MoveOption<U64>>
  //       const vectorOfOptions = deserialized[0] as MoveVector<MoveOption<U64>>;
  //       expect(vectorOfOptions).toBeInstanceOf(MoveVector);
  //       expect(vectorOfOptions.value[0].value.value).toBe(1n);
  //       expect(vectorOfOptions.value[1].value.value).toBe(2n);
  //       expect(vectorOfOptions.value[2].isSome()).toBe(false);

  //       // 验证第二个元素：混合数组
  //       const mixedArray = deserialized[1] as Array<any>;
  //       expect(mixedArray[0]).toBeInstanceOf(AccountAddress);
  //       expect(mixedArray[1]).toBe(123);
  //       expect(mixedArray[2]).toBeInstanceOf(MoveVector);

  //       // 验证深层嵌套
  //       const nestedArray = mixedArray[3] as Array<any>;
  //       expect(nestedArray[0]).toBeInstanceOf(MoveOption);
  //       expect(nestedArray[1]).toBe('nested string');
  //       expect(nestedArray[2]).toBe(BigInt(456));
  //     });
  //   });
});
