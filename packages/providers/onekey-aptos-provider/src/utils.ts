import {
  Deserializer,
  Hex,
  InputEntryFunctionData,
  InputScriptData,
  Script,
  ScriptFunctionArgumentTypes,
  Serializer,
  standardizeTypeTags,
  TransactionPayloadScript,
  TypeTag,
} from '@aptos-labs/ts-sdk';
import { deserializeArguments, serializeArguments } from './serializer';
import { hexToBytes, bytesToHex } from '@noble/hashes/utils';

export function hasHexPrefix(data: string): boolean {
  return data.startsWith('0x');
}

export function stripHexPrefix(hex: string): string {
  return hasHexPrefix(hex) ? hex.slice(2) : hex;
}

function generateTransactionPayloadScript(args: InputScriptData) {
  return new TransactionPayloadScript(
    new Script(
      Hex.fromHexInput(args.bytecode).toUint8Array(),
      standardizeTypeTags(args.typeArguments),
      args.functionArguments,
    ),
  );
}

function serializeTransactionPayloadScript(args: InputScriptData, serializer: Serializer) {
  const { bytecode, typeArguments, functionArguments } = args;
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
    typeArguments: typeArguments,
    functionArguments: args,
  };
}

function serializeTransactionPayloadEntryFunction(
  args: InputEntryFunctionData,
  serializer: Serializer,
) {
  const { function: functionName, typeArguments, functionArguments } = args;
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

export function serializeTransactionPayload(args: InputScriptData | InputEntryFunctionData) {
  const serializer = new Serializer();
  if ('function' in args) {
    serializer.serializeU32AsUleb128(20001);
    serializeTransactionPayloadEntryFunction(args, serializer);
  } else {
    serializer.serializeU32AsUleb128(20000);
    serializeTransactionPayloadScript(args, serializer);
  }
  return bytesToHex(serializer.toUint8Array());
}

export function deserializeTransactionPayload(
  hex: string,
): InputScriptData | InputEntryFunctionData {
  const deserializer = new Deserializer(hexToBytes(hex));
  const type = deserializer.deserializeUleb128AsU32();
  if (type === 20001) {
    return deserializeTransactionPayloadEntryFunction(deserializer);
  } else if (type === 20000) {
    return deserializeTransactionPayloadScript(deserializer);
  } else {
    throw new Error('Invalid transaction payload type');
  }
}
