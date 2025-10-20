import { CHAIN } from '@tonconnect/protocol';

export enum ConnectEventErrorMessage {
  UNKNOWN_ERROR = 'Unknown error',
  BAD_REQUEST = 'Bad request',
  APP_MANIFEST_NOT_FOUND = 'App manifest not found',
  APP_MANIFEST_CONTENT_ERROR = 'App manifest content error',
  UNKNOWN_APP = 'Unknown app',
  USER_DECLINED = 'User declined the connection',
}

export interface WalletInfo {
  name: string;
  image: string;
  tondns?: string;
  about_url: string;
}

export enum SendTransactionErrorMessage {
  UNKNOWN_ERROR = 'Unknown error',
  BAD_REQUEST_ERROR = 'Bad request',
  UNKNOWN_APP_ERROR = 'Unknown app',
  USER_REJECTS_ERROR = 'User declined the transaction',
  METHOD_NOT_SUPPORTED = 'Method is not supported',
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

export type SignDataPayloadText = {
  type: 'text';
  text: string;
};

export type SignDataPayloadBinary = {
  type: 'binary';
  bytes: string; // base64 (not url safe) encoded bytes array
};

export type SignDataPayloadCell = {
  type: 'cell';
  schema: string; // TL-B scheme of the cell payload
  cell: string; // base64 (not url safe) encoded cell
};

export interface SignDataPayloadLegacy {
  schema_crc: number;
  cell: string;
  publicKey?: string;
}

export type SignDataRequest =
  | SignDataPayloadLegacy
  | SignDataPayloadText
  | SignDataPayloadBinary
  | SignDataPayloadCell;

export type SignDataResult = {
  signature: string; // base64 encoded signature
  timestamp: number; // UNIX timestamp in seconds (UTC) at the moment on creating the signature.
} & {
  signature: string; // base64 encoded signature
  address: string;
  timestamp: number;
  domain: string;
  payload: SignDataRequest;
};

export interface SignProofRequest {
  payload: string;
}

export interface SignProofResult {
  signature: string; // base64 encoded signature
  timestamp: number; // 64-bit unix epoch time of the signing operation (seconds)
  domain: {
    lengthBytes: number; // AppDomain Length
    value: string; // app domain name (as url part, without encoding)
  };
}
