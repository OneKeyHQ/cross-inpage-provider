import { enhancedJSONStringify, enhancedJSONParse } from './json';

describe('Enhanced JSON Serialization', () => {
  test('should handle basic types correctly', () => {
    const testObj = {
      string: 'hello',
      number: 123,
      boolean: true,
      null: null,
      undefined: undefined,
    };

    const serialized = enhancedJSONStringify(testObj);
    const deserialized = enhancedJSONParse(serialized);
    expect(deserialized).toEqual(testObj);
  });

  test('should handle BigInt correctly', () => {
    const testObj = {
      bigIntValue: BigInt('9007199254740991'),
    };

    const serialized = enhancedJSONStringify(testObj);
    const deserialized = enhancedJSONParse(serialized);
    expect(deserialized).toEqual(testObj);
  });

  test('should handle Uint8Array correctly', () => {
    const uint8Array = new Uint8Array([1, 2, 3, 4, 5]);
    const testObj = {
      binary: uint8Array,
    };

    const serialized = enhancedJSONStringify(testObj);
    const deserialized = enhancedJSONParse(serialized);
    expect(new Uint8Array(deserialized.binary)).toEqual(uint8Array);
  });

  test('should handle ArrayBuffer correctly', () => {
    // Create ArrayBuffer with known data
    const data = new Uint8Array([1, 2, 3, 4]);
    const buffer = data.buffer;

    const testObj = {
      buffer: buffer,
    };

    const serialized = enhancedJSONStringify(testObj);
    const deserialized = enhancedJSONParse(serialized);

    // Convert to Uint8Array for comparison
    const resultArray = new Uint8Array(deserialized.buffer);
    const originalArray = new Uint8Array(buffer);

    expect(Array.from(resultArray)).toEqual(Array.from(originalArray));
  });

  test('should handle nested objects and arrays', () => {
    const testObj = {
      array: [1, BigInt(123), new Uint8Array([1, 2, 3])],
      nested: {
        undefined: undefined,
        binary: new Uint8Array([4, 5, 6]),
      },
    };

    const serialized = enhancedJSONStringify(testObj);
    const deserialized = enhancedJSONParse(serialized);

    // Verify array contents
    expect(deserialized.array[0]).toBe(1);
    expect(deserialized.array[1]).toBe(BigInt(123));
    expect(new Uint8Array(deserialized.array[2])).toEqual(new Uint8Array([1, 2, 3]));

    // Verify nested object
    expect(deserialized.nested.undefined).toBeUndefined();
    expect(new Uint8Array(deserialized.nested.binary)).toEqual(new Uint8Array([4, 5, 6]));
  });

  test('should handle null and undefined values', () => {
    const testObj = {
      nullValue: null,
      undefinedValue: undefined,
    };

    const serialized = enhancedJSONStringify(testObj);
    const deserialized = enhancedJSONParse(serialized);
    expect(deserialized.nullValue).toBeNull();
    expect(deserialized.undefinedValue).toBeUndefined();
  });

  test('should handle deep nested structures', () => {
    const testObj = {
      level1: {
        level2: {
          level3: {
            binary: new Uint8Array([1, 2, 3]),
            number: 123,
            bigint: BigInt(456),
            array: [new Uint8Array([4, 5, 6]), { nested: BigInt(789) }],
          },
        },
      },
    };

    const serialized = enhancedJSONStringify(testObj);
    const deserialized = enhancedJSONParse(serialized);

    // Verify deep nested values
    expect(new Uint8Array(deserialized.level1.level2.level3.binary)).toEqual(
      new Uint8Array([1, 2, 3]),
    );
    expect(deserialized.level1.level2.level3.bigint).toBe(BigInt(456));
    expect(new Uint8Array(deserialized.level1.level2.level3.array[0])).toEqual(
      new Uint8Array([4, 5, 6]),
    );
    expect(deserialized.level1.level2.level3.array[1].nested).toBe(BigInt(789));
  });

  test('should handle mixed array types', () => {
    const mixedArray = [
      123,
      'string',
      BigInt(456),
      new Uint8Array([1, 2, 3]),
      new ArrayBuffer(4),
      undefined,
      null,
      { key: BigInt(789) },
      [new Uint8Array([4, 5, 6])],
    ];

    const serialized = enhancedJSONStringify(mixedArray);
    const deserialized = enhancedJSONParse(serialized);

    expect(deserialized[0]).toBe(123);
    expect(deserialized[1]).toBe('string');
    expect(deserialized[2]).toBe(BigInt(456));
    expect(new Uint8Array(deserialized[3])).toEqual(new Uint8Array([1, 2, 3]));
    expect(deserialized[5]).toBeUndefined();
    expect(deserialized[6]).toBeNull();
    expect(deserialized[7].key).toBe(BigInt(789));
    expect(new Uint8Array(deserialized[8][0])).toEqual(new Uint8Array([4, 5, 6]));
  });

  test('should handle large binary data', () => {
    // Create large Uint8Array
    const largeArray = new Uint8Array(1000);
    for (let i = 0; i < largeArray.length; i++) {
      largeArray[i] = i % 256;
    }

    const testObj = {
      largeData: largeArray,
      buffer: largeArray.buffer,
      nested: {
        anotherCopy: new Uint8Array(largeArray),
      },
    };

    const serialized = enhancedJSONStringify(testObj);
    const deserialized = enhancedJSONParse(serialized);

    expect(new Uint8Array(deserialized.largeData)).toEqual(largeArray);
    expect(new Uint8Array(deserialized.buffer)).toEqual(largeArray);
    expect(new Uint8Array(deserialized.nested.anotherCopy)).toEqual(largeArray);
  });

  test('should handle empty binary data', () => {
    const testObj = {
      emptyUint8Array: new Uint8Array(0),
      emptyBuffer: new ArrayBuffer(0),
      nested: {
        anotherEmpty: new Uint8Array([]),
      },
    };

    const serialized = enhancedJSONStringify(testObj);
    const deserialized = enhancedJSONParse(serialized);

    expect(new Uint8Array(deserialized.emptyUint8Array)).toEqual(new Uint8Array(0));
    expect(new Uint8Array(deserialized.emptyBuffer)).toEqual(new Uint8Array(0));
    expect(new Uint8Array(deserialized.nested.anotherEmpty)).toEqual(new Uint8Array(0));
  });

  test('should handle objects with many properties', () => {
    const largeObject: Record<string, any> = {};
    // Create 100 properties with different types
    for (let i = 0; i < 100; i++) {
      largeObject[`prop${i}`] =
        i % 5 === 0
          ? BigInt(i)
          : i % 5 === 1
          ? new Uint8Array([i])
          : i % 5 === 2
          ? undefined
          : i % 5 === 3
          ? { nested: BigInt(i) }
          : new ArrayBuffer(i % 3);
    }

    const serialized = enhancedJSONStringify(largeObject);
    const deserialized = enhancedJSONParse(serialized);

    // Verify random properties
    expect(deserialized.prop0).toBe(BigInt(0));
    expect(new Uint8Array(deserialized.prop1)).toEqual(new Uint8Array([1]));
    expect(deserialized.prop2).toBeUndefined();
    expect(deserialized.prop3.nested).toBe(BigInt(3));
  });
});
