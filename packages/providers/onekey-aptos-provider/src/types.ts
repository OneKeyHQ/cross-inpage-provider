import { AptosSignInBoundFields, AptosSignInInput } from '@aptos-labs/wallet-standard';
import { WalletIcon } from '@wallet-standard/core';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type AptosAccountInfo = {
  publicKey: string;
  address: string;
};

export type ProviderState = {
  account: AptosAccountInfo | null;
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

export interface SignMessagePayloadCompatible {
  address?: boolean; // Should we include the address of the account in the message
  application?: boolean; // Should we include the domain of the dapp
  chainId?: boolean; // Should we include the current chain id the wallet is connected to
  message: string; // The message to be signed and displayed to the user
  nonce: string; // A nonce the dapp should generate
}

export interface SignMessageResponseCompatible {
  address?: string;
  application?: string;
  chainId?: number;
  fullMessage: string; // The message that was generated to sign
  message: string; // The message passed in by the user
  nonce: string;
  prefix: string; // Should always be APTOS
  signature: string; // The signed full message
}

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

export type WalletInfo = {
  name: string;
  logo: WalletIcon;
  url?: string | undefined;
};


export type OneKeyBridgeSignInOutput = {
  /**
   * Account information of the user.
   */
  account: {
    address: string;
    publicKey: string;
  };
  /**
   * Input fields to the `signIn` signing request to the wallet. The wallet will ensure that any bound fields not included in the `AptosSignInInput` are included in the output.
   */
  input: AptosSignInInput & AptosSignInBoundFields;
  /**
   * Signature of the SIWA Signing Message constructed from the `input` fields.
   */
  signature: string;
  /**
   * The type of signing scheme used to sign the message.
   *
   * @example 'ed25519' | 'multi_ed25519' | 'single_key' | 'multi_key'
   */
  type: string;
};