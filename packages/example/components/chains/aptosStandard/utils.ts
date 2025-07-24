import {  Aptos, AptosConfig, Network ,EntryFunctionArgumentTypes, SimpleEntryFunctionArgumentTypes } from '@aptos-labs/ts-sdk';
import type { SignMessagePayload, SignMessageRequest } from './types';
import { NetworkInfo } from "@aptos-labs/wallet-adapter-core";

export const APTOS_SIGN_MESSAGE_PREFIX = 'APTOS';

export function formatFullMessage(message: SignMessageRequest): string {
  let fullMessage = `${APTOS_SIGN_MESSAGE_PREFIX}\n`;
  if (message.address) {
    fullMessage += `address: ${message.address}\n`;
  }
  if (message.application) {
    fullMessage += `application: ${message.application}\n`;
  }
  if (message.chainId) {
    fullMessage += `chainId: ${message.chainId}\n`;
  }
  fullMessage += `message: ${message.message}\n`;
  fullMessage += `nonce: ${message.nonce}`;

  return fullMessage;
}

export function formatSignMessageRequest(
  message: SignMessagePayload,
  address: string,
  application: string,
  chainId: number,
): SignMessageRequest {
  const request: SignMessageRequest = {
    message: message.message,
    nonce: message.nonce,
    fullMessage: '',
  };

  if (message.address) {
    request.address = address;
  }
  if (message.application) {
    let host: string;
    try {
      const urlObj = new URL(application);
      host = urlObj.host;
    } catch (error) {
      host = application;
    }
    request.application = host;
  }
  if (message.chainId) {
    request.chainId = chainId;
  }

  request.fullMessage = formatFullMessage(request);

  return request;
}

export function formatFunctionArgument(
  functionArg: EntryFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes,
): EntryFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes {
  if (functionArg) {
    if (Array.isArray(functionArg)) return functionArg.map(formatFunctionArgument);
    if (
      typeof functionArg === 'string' ||
      typeof functionArg === 'number' ||
      typeof functionArg === 'boolean'
    ) {
      return functionArg;
    }
    if (typeof functionArg === 'bigint') {
      return functionArg.toString();
    }
    if (functionArg instanceof Uint8Array) {
      return functionArg;
    }
    if (functionArg instanceof ArrayBuffer) {
      return new Uint8Array(functionArg);
    }
    if ('values' in functionArg) {
      return functionArg.values.map(formatFunctionArgument);
    }
    if ('data' in functionArg) {
      return functionArg.toString();
    }
    if (functionArg.value) {
      return functionArg.value instanceof Uint8Array
        ? functionArg.value
        : functionArg.value.toString();
    }
  }

  return functionArg;
}

// Devnet client
const DEVNET_CONFIG = new AptosConfig({ network: Network.DEVNET });
const DEVNET_CLIENT = new Aptos(DEVNET_CONFIG);

// Testnet client
const TESTNET_CONFIG = new AptosConfig({ network: Network.TESTNET });
const TESTNET_CLIENT = new Aptos(TESTNET_CONFIG);

// Mainnet client
const MAINNET_CONFIG = new AptosConfig({ network: Network.MAINNET });
const MAINNET_CLIENT = new Aptos(MAINNET_CONFIG);

export const aptosClient = (network?: NetworkInfo | null) => {
  if (network?.name === Network.DEVNET) {
    return DEVNET_CLIENT;
  } else if (network?.name === Network.TESTNET) {
    return TESTNET_CLIENT;
  } else if (network?.name === Network.MAINNET) {
    return MAINNET_CLIENT;
  } else {
    const CUSTOM_CONFIG = new AptosConfig({
      network: Network.CUSTOM,
      fullnode: network?.url,
    });
    return new Aptos(CUSTOM_CONFIG);
  }
};