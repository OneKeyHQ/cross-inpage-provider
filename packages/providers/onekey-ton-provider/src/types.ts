import { CHAIN } from "@tonconnect/protocol";

export enum OneKeyTonProviderErrorCode {
  UNKNOWN_ERROR = 0,
  BAD_REQUEST = 1,
  APP_MANIFEST_NOT_FOUND = 2,
  APP_MANIFEST_CONTENT_ERROR = 3,
  UNKNOWN_APP = 100,
  USER_DECLINED = 300,
  UNSUPPORTED_METHOD = 400,
}

export class OneKeyTonProviderError extends Error {
  code: OneKeyTonProviderErrorCode;

  constructor(code: OneKeyTonProviderErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export enum ConnectEventErrorMessage {
  UNKNOWN_ERROR = "Unknown error",
  BAD_REQUEST = "Bad request",
  APP_MANIFEST_NOT_FOUND = "App manifest not found",
  APP_MANIFEST_CONTENT_ERROR = "App manifest content error",
  UNKNOWN_APP = "Unknown app",
  USER_DECLINED = "User declined the connection",
  UNSUPPORTED_METHOD = "Method is not supported",
}

export interface WalletInfo {
  name: string;
  image: string;
  tondns?: string;
  about_url: string;
}

export enum SendTransactionErrorMessage {
  UNKNOWN_ERROR = "Unknown error",
  BAD_REQUEST_ERROR = "Bad request",
  UNKNOWN_APP_ERROR = "Unknown app",
  USER_REJECTS_ERROR = "User rejects",
  METHOD_NOT_SUPPORTED = "Method is not supported",
}

export interface AccountInfo {
  address: string; // TON address raw (`0:<hex>`)
  network: CHAIN; // network global_id
  publicKey: string; // HEX string without 0x
  walletStateInit: string; // Base64 (not url safe) encoded stateinit cell for the wallet contract
}

export interface Message {
  address: string;
  amount: string;
  payload?: string;
  stateInit?: string;
}

export interface TransactionRequest {
  valid_until?: number;
  network?: CHAIN;
  from?: string;
  messages: Message[];
}

export interface SignDataRequest {
  schema_crc: number;
  cell: string;
  publicKey?: string;
}

export interface SignDataResult {
  signature: string; // base64 encoded signature
  timestamp: number; // UNIX timestamp in seconds (UTC) at the moment on creating the signature.
}

export interface SignProofRequest {
  payload: string;
}

export interface SignProofResult {
  signature: string; // base64 encoded signature
  timestamp: number; // 64-bit unix epoch time of the signing operation (seconds)
  domain: {
    lengthBytes: number; // AppDomain Length
    value: string;  // app domain name (as url part, without encoding)
  };
}
