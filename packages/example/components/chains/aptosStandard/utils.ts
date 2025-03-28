import { EntryFunctionArgumentTypes, SimpleEntryFunctionArgumentTypes } from '@aptos-labs/ts-sdk';
import type { SignMessagePayload, SignMessageRequest } from './types';

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
