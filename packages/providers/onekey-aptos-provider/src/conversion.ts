// https://github.com/aptos-labs/petra-plugin-wallet-adapter/blob/main/src/conversion.ts
import {
  AptosConfig,
  Network,
  InputGenerateTransactionPayloadData,
  InputEntryFunctionDataWithRemoteABI,
  TypeTag,
  Deserializer,
  Serializable as SerializableV2,
  generateTransactionPayload,
} from '@aptos-labs/ts-sdk';
import { NetworkInfo } from '@aptos-labs/wallet-adapter-core';
import { BCS, TxnBuilderTypes, Types } from 'aptos';

export type SerializableV1 = { serialize(serializer: BCS.Serializer): void };
export type DeserializableV2Class<T> = { deserialize(deserializer: Deserializer): T };
export type DeserializableV1Class<T> = { deserialize(deserializer: BCS.Deserializer): T };

export function convertV1toV2<TV1 extends SerializableV1, TV2>(
  src: TV1,
  dst: DeserializableV2Class<TV2>,
) {
  const serializedBytes = BCS.bcsToBytes(src);
  const deserializerV2 = new Deserializer(serializedBytes);
  return dst.deserialize(deserializerV2);
}

export function convertV2toV1<TV1, TV2 extends SerializableV2>(
  src: TV2,
  dst: DeserializableV1Class<TV1>,
) {
  const serializedBytes = src.bcsToBytes();
  const deserializerV1 = new BCS.Deserializer(serializedBytes);
  return dst.deserialize(deserializerV1);
}

// old => new
export function convertNetwork(networkInfo: NetworkInfo | null): Network {
  switch (networkInfo?.name.toLowerCase()) {
    case 'mainnet' as Network:
      return Network.MAINNET;
    case 'testnet' as Network:
      return Network.TESTNET;
    case 'devnet' as Network:
      return Network.DEVNET;
    default:
      throw new Error('Invalid network name');
  }
}

export function convertV2JsonPayloadToV1(
  payload: InputGenerateTransactionPayloadData,
): Types.TransactionPayload {
  if ('bytecode' in payload) {
    throw new Error('script payload not supported');
  }

  const stringTypeTags = payload.typeArguments?.map((typeTag) => {
    if (typeTag instanceof TypeTag) {
      return typeTag.toString();
    }
    return typeTag;
  });
  return {
    type: 'entry_function_payload',
    function: payload.function,
    type_arguments: stringTypeTags || [],
    arguments: payload.functionArguments,
  };
}

export async function generateV1TransactionPayload(
  payloadData: InputGenerateTransactionPayloadData,
  network: NetworkInfo,
): Promise<TxnBuilderTypes.TransactionPayload> {
  const aptosConfig = new AptosConfig({
    network: convertNetwork(network),
  });
  const newPayload = await generateTransactionPayload({
    ...(payloadData as InputEntryFunctionDataWithRemoteABI),
    aptosConfig: aptosConfig,
  });
  return convertV2toV1(newPayload, TxnBuilderTypes.TransactionPayload);
}
