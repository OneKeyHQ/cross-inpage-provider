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
