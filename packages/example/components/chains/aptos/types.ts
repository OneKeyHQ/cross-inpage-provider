import type { ProviderAptos } from '@onekeyfe/onekey-aptos-provider';

export type IProviderApi = ProviderAptos

export interface IProviderInfo {
  uuid: string;
  name: string;
  inject?: string; // window.ethereum
}

export interface SignMessagePayload {
  address?: boolean; // Should we include the address of the account in the message
  application?: boolean; // Should we include the domain of the dapp
  chainId?: boolean; // Should we include the current chain id the wallet is connected to
  message: string; // The message to be signed and displayed to the user
  nonce: number; // A nonce the dapp should generate
}

export interface SignMessageRequest {
  address?: string;
  application?: string;
  chainId?: number;
  message: string; // The message passed in by the user
  nonce: number;
  fullMessage: string; // The message that was generated to sign
}

export interface SignMessageResponse extends SignMessageRequest {
  prefix: string; // Should always be APTOS
  signature: string; // The signed full message
}