import type { Types } from 'aptos';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type AptosAccountInfo = {
  publicKey: string;
  address: string;
};

export type TxnOptions = {
  sender?: string;
  sequence_number?: string;
  max_gas_amount?: string;
  gas_unit_price?: string;
  gas_currency_code?: string; // TODO:
  // Unix timestamp, in seconds + 10 seconds
  expiration_timestamp_secs?: string;
};

export type TxnPayload = {
  function: string;
  type_arguments: any[];
  arguments: any[];
};

export interface SignMessagePayload {
  address?: boolean; // Should we include the address of the account in the message
  application?: boolean; // Should we include the domain of the dapp
  chainId?: boolean; // Should we include the current chain id the wallet is connected to
  message: string; // The message to be signed and displayed to the user
  nonce: number; // A nonce the dapp should generate
}

export interface SignMessageResponse {
  address?: string;
  application?: string;
  chainId?: number;
  fullMessage: string; // The message that was generated to sign
  message: string; // The message passed in by the user
  nonce: number;
  prefix: string; // Should always be APTOS
  signature: string; // The signed full message
}

export type IRawTransaction = {
  sender: string;
  sequence_number: bigint;
  payload: Types.TransactionPayload;
  max_gas_amount: bigint;
  gas_unit_price: bigint;
  expiration_timestamp_secs: bigint;
  chain_id: number;
};

type SignTransactionPayloadV1 = Types.TransactionPayload;
type SignTransactionPayloadV2 = {
  rawTransaction: IRawTransaction;
  feePayerAddress?: string;
  secondarySignerAddresses: string[];
};
type MartianSignTransactionPayload = string;
export type SignTransactionPayload =
  | MartianSignTransactionPayload
  | SignTransactionPayloadV1
  | SignTransactionPayloadV2;
