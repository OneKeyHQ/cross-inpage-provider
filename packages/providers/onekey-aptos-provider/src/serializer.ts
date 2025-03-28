import {
  EntryFunctionArgumentTypes,
  Serializable,
  Serializer,
  Deserializer,
  SimpleEntryFunctionArgumentTypes,
  MoveVector,
  MoveOption,
  U8,
  U64,
  U128,
  AccountAddress,
  Bool,
  U16,
  U32,
  U256,
  Serialized,
} from '@aptos-labs/ts-sdk';
import { hexToBytes, bytesToHex } from '@noble/hashes/utils';

// OneKey Primitive Types
export enum ArgumentType {
  NULL = 10000,
  UNDEFINED = 10001,
  BOOLEAN = 10002,
  NUMBER = 10003,
  BIGINT = 10004,
  STRING = 10005,
  UINT8_ARRAY = 10006,
  ARRAY_BUFFER = 10007,
  ARRAY = 10008,
  MOVE_OPTION = 10009,
}

/**
 * Variants of script transaction arguments used in Rust, encompassing various data types for transaction processing.
 * {@link https://github.com/aptos-labs/aptos-core/blob/main/third_party/move/move-core/types/src/transaction_argument.rs#L11}
 */
export enum ScriptArgumentType {
  U8 = 0,
  U64 = 1,
  U128 = 2,
  Address = 3,
  U8Vector = 4,
  Bool = 5,
  U16 = 6,
  U32 = 7,
  U256 = 8,
  Serialized = 9,
}

// https://github.com/aptos-labs/aptos-ts-sdk/blob/289f944ef157a6bd13b1cb0949065ee4330a8c36/src/transactions/instances/transactionPayload.ts#L28-L29
function deserializeFromScriptArgument(
  index: number,
  deserializer: Deserializer,
): EntryFunctionArgumentTypes {
  switch (index) {
    case ScriptArgumentType.U8:
      return U8.deserialize(deserializer);
    case ScriptArgumentType.U64:
      return U64.deserialize(deserializer);
    case ScriptArgumentType.U128:
      return U128.deserialize(deserializer);
    case ScriptArgumentType.Address:
      return AccountAddress.deserialize(deserializer);
    case ScriptArgumentType.U8Vector:
      return MoveVector.deserialize(deserializer, U8);
    case ScriptArgumentType.Bool:
      return Bool.deserialize(deserializer);
    case ScriptArgumentType.U16:
      return U16.deserialize(deserializer);
    case ScriptArgumentType.U32:
      return U32.deserialize(deserializer);
    case ScriptArgumentType.U256:
      return U256.deserialize(deserializer);
    case ScriptArgumentType.Serialized:
      return Serialized.deserialize(deserializer);
    default:
      throw new Error(`Unknown script argument type: ${index}`);
  }
}

export function serializeArgument(
  serializer: Serializer,
  arg: SimpleEntryFunctionArgumentTypes | EntryFunctionArgumentTypes,
): void {
  if (arg === null) {
    serializer.serializeU32AsUleb128(ArgumentType.NULL);
    return;
  }
  if (arg === undefined) {
    serializer.serializeU32AsUleb128(ArgumentType.UNDEFINED);
    return;
  }

  if (typeof arg === 'boolean') {
    serializer.serializeU32AsUleb128(ArgumentType.BOOLEAN);
    serializer.serializeBool(arg);
    return;
  }

  if (typeof arg === 'number') {
    serializer.serializeU32AsUleb128(ArgumentType.NUMBER);
    serializer.serializeU64(arg);
    return;
  }

  if (typeof arg === 'bigint') {
    serializer.serializeU32AsUleb128(ArgumentType.BIGINT);
    serializer.serializeU256(arg);
    return;
  }

  if (typeof arg === 'string') {
    serializer.serializeU32AsUleb128(ArgumentType.STRING);
    serializer.serializeStr(arg);
    return;
  }

  if (arg instanceof Uint8Array) {
    serializer.serializeU32AsUleb128(ArgumentType.UINT8_ARRAY);
    serializer.serializeBytes(arg);
    return;
  }
  if (arg instanceof ArrayBuffer) {
    serializer.serializeU32AsUleb128(ArgumentType.ARRAY_BUFFER);
    const uint8Array = new Uint8Array(arg);
    serializer.serializeBytes(uint8Array);
    return;
  }

  if (Array.isArray(arg)) {
    serializer.serializeU32AsUleb128(ArgumentType.ARRAY);
    serializer.serializeU32(arg.length);
    arg.forEach((item) => serializeArgument(serializer, item));
    return;
  }

  if (arg instanceof MoveOption) {
    serializer.serializeU32AsUleb128(ArgumentType.MOVE_OPTION);
    serializer.serializeU8(arg.isSome() ? 1 : 0);
    if (arg.isSome()) {
      serializeArgument(serializer, arg.value);
    }
    return;
  } else {
    arg.serializeForScriptFunction(serializer);
    return;
  }

  throw new Error('Unsupported argument type');
}

export function deserializeArgument(
  deserializer: Deserializer,
): SimpleEntryFunctionArgumentTypes | EntryFunctionArgumentTypes {
  const type = deserializer.deserializeUleb128AsU32();

  switch (type) {
    case ArgumentType.NULL:
      return null;

    case ArgumentType.UNDEFINED:
      return undefined;

    case ArgumentType.BOOLEAN:
      return deserializer.deserializeBool();

    case ArgumentType.NUMBER: {
      const value = deserializer.deserializeU64();
      if (value <= BigInt(Number.MAX_SAFE_INTEGER)) {
        return Number(value);
      }
      throw new Error('Number out of range');
    }

    case ArgumentType.BIGINT: {
      const value = deserializer.deserializeU256();
      return value;
    }

    case ArgumentType.STRING: {
      const str = deserializer.deserializeOption('string');
      console.log('str', str);
      return str;
    }

    case ArgumentType.UINT8_ARRAY: {
      const bytes = deserializer.deserializeBytes();
      return new Uint8Array(bytes);
    }

    case ArgumentType.ARRAY_BUFFER: {
      const bytes = deserializer.deserializeBytes();
      return new Uint8Array(bytes).buffer;
    }

    case ArgumentType.ARRAY: {
      const length = deserializer.deserializeU32();
      const elements: (SimpleEntryFunctionArgumentTypes | EntryFunctionArgumentTypes)[] = [];

      for (let i = 0; i < length; i++) {
        elements.push(deserializeArgument(deserializer));
      }
      return elements;
    }

    case ArgumentType.MOVE_OPTION: {
      const isSome = deserializer.deserializeU8() === 1;
      if (!isSome) {
        return new MoveOption();
      }
      const value = deserializeArgument(deserializer);
      if (value instanceof Serializable) {
        return new MoveOption(value);
      }
      throw new Error('MoveOption value must be a Serializable type');
    }

    default: {
      return deserializeFromScriptArgument(type, deserializer);
    }
  }
}

export function deserializeArguments(
  bytes: string,
): Array<EntryFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes> {
  const deserializer = new Deserializer(hexToBytes(bytes));
  const length = deserializer.deserializeU32();
  const args: (EntryFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes)[] = [];

  for (let i = 0; i < length; i++) {
    args.push(deserializeArgument(deserializer));
  }

  return args;
}

export function serializeArguments(
  args: Array<EntryFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes>,
): string {
  const serializer = new Serializer();
  serializer.serializeU32(args.length);
  args.forEach((arg) => serializeArgument(serializer, arg));
  return bytesToHex(serializer.toUint8Array());
}
