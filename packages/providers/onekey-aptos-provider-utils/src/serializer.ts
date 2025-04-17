import {
  AccountAddress,
  Bool,
  Deserializer,
  FixedBytes,
  MoveOption,
  MoveString,
  MoveVector,
  Serialized,
  Serializer,
  TypeTag,
  U128,
  U16,
  U256,
  U32,
  U64,
  U8,
  standardizeTypeTags,
} from '@aptos-labs/ts-sdk';
import { hexToBytes, bytesToHex } from '@noble/hashes/utils';
import type {
  EntryFunctionArgumentTypes,
  InputEntryFunctionData,
  InputScriptData,
  ScriptFunctionArgumentTypes,
  SimpleEntryFunctionArgumentTypes,
} from '@aptos-labs/ts-sdk';
import type { Types } from 'aptos';

export enum TransactionPayloadType {
  SCRIPT = 0,
  ENTRY_FUNCTION = 1,
  SCRIPT_LEGACY = 2, // V1 SDK Script Params Petra
  ENTRY_FUNCTION_LEGACY = 3, // V1 SDK Entry Function Params
}

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
  MOVE_STRING = 10010,
  MOVE_FIXED_BYTES = 10011,
  MOVE_VECTOR = 10012,
  V1SDK_ACCOUNT_ADDRESS = 10013,
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

// type
export type ScriptV1SDK = {
  code: Uint8Array;
  ty_args: Array<TypeTag>;
  args: Array<Uint8Array>;
};

export type TransactionPayloadV1Script = {
  value: ScriptV1SDK;
};

export type EntryFunctionV1SDK = {
  module_name: string;
  function_name: string;
  ty_args: Array<TypeTag>;
  args: Array<Uint8Array>;
};

export type TransactionPayloadV1EntryFunction = {
  value: EntryFunctionV1SDK;
};

export type TransactionPayloadV1SDK =
  | Types.TransactionPayload
  | TransactionPayloadV1Script
  | TransactionPayloadV1EntryFunction;

export type TransactionPayloadV2SDK = InputScriptData | InputEntryFunctionData;

export function serializeTransactionPayload(
  args: TransactionPayloadV1SDK | TransactionPayloadV2SDK,
) {
  if (!args) {
    throw new Error('Transaction payload cannot be undefined');
  }

  const serializer = new Serializer();
  if ('type' in args || ('arguments' in args && 'type_arguments' in args)) {
    // Some Dapps do not pass the type parameter.
    // V1 SDK Legacy Params
    serializableTransactionPayloadV1Legacy(args as Types.TransactionPayload, serializer);
  } else if (!('type' in args) && 'function' in args && !('multisigAddress' in args)) {
    // V2 SDK Entry Function Params
    serializeTransactionPayloadEntryFunction(args, serializer);
  } else if (!('type' in args) && 'bytecode' in args) {
    // V2 SDK Script Params
    serializeTransactionPayloadScript(args, serializer);
  } else if (!('type' in args) && 'value' in args) {
    // fix wormhole v1 sdk
    // not support complex type
    const value = args.value;
    if ('code' in value) {
      serializableTransactionPayloadV1ScriptLegacy(value, serializer);
    } else {
      throw new Error('Invalid transaction payload type');
    }
  } else {
    throw new Error('Invalid transaction payload type');
  }
  return bytesToHex(serializer.toUint8Array());
}

export function deserializeTransactionPayload(hex: string): TransactionPayloadV2SDK {
  const deserializer = new Deserializer(hexToBytes(hex));
  const type = deserializer.deserializeUleb128AsU32();
  if (type === TransactionPayloadType.ENTRY_FUNCTION) {
    return deserializeTransactionPayloadEntryFunction(deserializer);
  } else if (type === TransactionPayloadType.SCRIPT) {
    return deserializeTransactionPayloadScript(deserializer);
  } else if (type === TransactionPayloadType.ENTRY_FUNCTION_LEGACY) {
    return deserializableTransactionPayloadV1EntryFunctionLegacy(deserializer);
  } else if (type === TransactionPayloadType.SCRIPT_LEGACY) {
    return deserializableTransactionPayloadV1ScriptLegacy(deserializer);
  } else {
    throw new Error('Invalid transaction payload type');
  }
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
    if (arg > Number.MAX_SAFE_INTEGER) {
      serializer.serializeU32AsUleb128(ArgumentType.BIGINT);
      serializer.serializeU256(BigInt(arg));
    } else {
      serializer.serializeU32AsUleb128(ArgumentType.NUMBER);
      serializer.serializeU64(arg);
    }
    return;
  }

  if (typeof arg === 'bigint') {
    serializer.serializeU32AsUleb128(ArgumentType.BIGINT);
    serializer.serializeU256(arg);
    return;
  }

  if (typeof arg === 'string') {
    serializer.serializeU32AsUleb128(ArgumentType.STRING);
    serializer.serializeOption(arg);
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
  }

  if (arg instanceof MoveString) {
    serializer.serializeU32AsUleb128(ArgumentType.MOVE_STRING);
    serializer.serializeOption(arg.value);
    return;
  }

  if (arg instanceof FixedBytes) {
    serializer.serializeU32AsUleb128(ArgumentType.MOVE_FIXED_BYTES);
    serializer.serializeBytes(arg.value);
    return;
  }

  if (arg instanceof MoveVector) {
    serializer.serializeU32AsUleb128(ArgumentType.MOVE_VECTOR);
    serializer.serializeU32(arg.values.length);
    arg.values.forEach((item) => serializeArgument(serializer, item));
    return;
  }

  try {
    if ('serializeForScriptFunction' in arg) {
      // V2 SDK Serializer
      arg.serializeForScriptFunction(serializer);
    } else if ('value' in arg) {
      // fix wormhole v1 sdk
      // @ts-expect-error
      const value = arg.value as SimpleEntryFunctionArgumentTypes;
      if (
        typeof value === 'object' &&
        value !== null &&
        'address' in value &&
        value.address instanceof Uint8Array
      ) {
        serializer.serializeU32AsUleb128(ArgumentType.V1SDK_ACCOUNT_ADDRESS);
        serializer.serializeBytes(value.address);
      } else {
        serializeArgument(serializer, value);
      }
    }
  } catch (error) {
    console.log('==>> error ', typeof arg, arg, error);
  }
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
      return value;
    }

    case ArgumentType.BIGINT: {
      return deserializer.deserializeU256();
    }

    case ArgumentType.STRING: {
      return deserializer.deserializeOption('string');
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
      const value = deserializeArgument(deserializer) as EntryFunctionArgumentTypes;
      return new MoveOption(value);
    }

    case ArgumentType.MOVE_STRING: {
      return new MoveString(deserializer.deserializeOption('string') ?? '');
    }

    case ArgumentType.MOVE_FIXED_BYTES: {
      const bytes = deserializer.deserializeBytes();
      return new FixedBytes(new Uint8Array(bytes));
    }

    case ArgumentType.MOVE_VECTOR: {
      const length = deserializer.deserializeU32();
      const values: (SimpleEntryFunctionArgumentTypes | EntryFunctionArgumentTypes)[] = [];
      for (let i = 0; i < length; i++) {
        values.push(deserializeArgument(deserializer));
      }
      return new MoveVector<any>(values);
    }

    case ArgumentType.V1SDK_ACCOUNT_ADDRESS: {
      return new AccountAddress(deserializer.deserializeBytes());
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

function serializeTransactionPayloadScript(args: InputScriptData, serializer: Serializer) {
  const { bytecode, typeArguments, functionArguments } = args;
  serializer.serializeU32AsUleb128(TransactionPayloadType.SCRIPT);
  const bytecodeBytes = typeof bytecode === 'string' ? bytecode : bytesToHex(bytecode);
  serializer.serializeOption(bytecodeBytes);
  serializer.serializeVector<TypeTag>(standardizeTypeTags(typeArguments));
  const hex = serializeArguments(functionArguments);
  serializer.serializeOption(hex ?? '');
}

function deserializeTransactionPayloadScript(deserializer: Deserializer): InputScriptData {
  const bytecode = deserializer.deserializeOption('string');
  const typeArguments = deserializer.deserializeVector(TypeTag);
  const args = deserializeArguments(
    deserializer.deserializeOption('string') ?? '',
  ) as ScriptFunctionArgumentTypes[];
  return {
    bytecode: bytecode ?? '',
    typeArguments,
    functionArguments: args,
  };
}

function serializeTransactionPayloadEntryFunction(
  args: InputEntryFunctionData,
  serializer: Serializer,
) {
  const { function: functionName, typeArguments, functionArguments } = args;
  serializer.serializeU32AsUleb128(TransactionPayloadType.ENTRY_FUNCTION);
  serializer.serializeOption(functionName);
  serializer.serializeVector<TypeTag>(standardizeTypeTags(typeArguments));
  const hex = serializeArguments(functionArguments);
  serializer.serializeOption(hex ?? '');
}

function deserializeTransactionPayloadEntryFunction(
  deserializer: Deserializer,
): InputEntryFunctionData {
  const functionName = deserializer.deserializeOption('string');
  const typeArguments = deserializer.deserializeVector(TypeTag);
  const functionArguments = deserializeArguments(deserializer.deserializeOption('string') ?? '');
  return {
    function: functionName as `${string}::${string}::${string}`,
    typeArguments,
    functionArguments,
  };
}

// V1 SDK Script Wormhole Params
function serializableTransactionPayloadV1ScriptLegacy(args: ScriptV1SDK, serializer: Serializer) {
  serializer.serializeU32AsUleb128(TransactionPayloadType.SCRIPT_LEGACY);
  serializer.serializeBytes(args.code);
  serializer.serializeVector<TypeTag>(args.ty_args);
  serializer.serializeOption(serializeArguments(args.args));
}

function deserializableTransactionPayloadV1ScriptLegacy(
  deserializer: Deserializer,
): InputScriptData {
  const code = deserializer.deserializeBytes();
  const ty_args = deserializer.deserializeVector(TypeTag);
  const args = deserializeArguments(deserializer.deserializeOption('string') ?? '');

  // @ts-expect-error
  const convertArgs: ScriptFunctionArgumentTypes[] = args.map(
    (arg: EntryFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes) => {
      if (typeof arg === 'number') {
        if (arg > Number.MAX_SAFE_INTEGER) {
          return new U256(arg);
        }
        return new U64(arg);
      }
      if (typeof arg === 'bigint') {
        return new U256(arg);
      }
      if (typeof arg === 'string') {
        return new MoveString(arg);
      }
      if (arg instanceof Uint8Array) {
        return MoveVector.U8(arg);
      }
      if (arg instanceof ArrayBuffer) {
        return MoveVector.U8(new Uint8Array(arg));
      }
      if (typeof arg === 'boolean') {
        return new Bool(arg);
      }

      if (Array.isArray(arg)) {
        // @ts-expect-error
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return new MoveVector(arg.map((item) => convertArgs(item)));
      }
      return arg;
    },
  );

  return {
    bytecode: code,
    typeArguments: ty_args,
    functionArguments: convertArgs,
  };
}

// V1 SDK Legacy Params
function serializableTransactionPayloadV1Legacy(
  args: Types.TransactionPayload,
  serializer: Serializer,
) {
  if (args.type === 'entry_function_payload' || ('arguments' in args && 'type_arguments' in args)) {
    serializer.serializeU32AsUleb128(TransactionPayloadType.ENTRY_FUNCTION_LEGACY);

    const {
      function: functionName,
      type_arguments,
      arguments: functionArguments,
    } = args as Types.TransactionPayload_EntryFunctionPayload;

    serializer.serializeOption(functionName);
    const length = type_arguments.length;
    serializer.serializeU32(length);
    for (let i = 0; i < length; i++) {
      serializer.serializeOption(type_arguments[i]);
    }
    serializer.serializeOption(
      serializeArguments(functionArguments as Array<ScriptFunctionArgumentTypes>),
    );
  }
  // not exist type script_payload
}

function deserializableTransactionPayloadV1EntryFunctionLegacy(
  deserializer: Deserializer,
): InputEntryFunctionData {
  const function_name = deserializer.deserializeOption('string') ?? '';
  const length = deserializer.deserializeU32();
  const typeArguments: Array<string> = [];
  for (let i = 0; i < length; i++) {
    typeArguments.push(deserializer.deserializeOption('string') ?? '');
  }
  const args = deserializeArguments(deserializer.deserializeOption('string') ?? '');
  return {
    // @ts-expect-error
    function: function_name,
    typeArguments,
    functionArguments: args as Array<SimpleEntryFunctionArgumentTypes>,
  };
}
