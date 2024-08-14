export type ConnectRequest = {
  manifestUrl: string;
  items: ConnectItem[], // data items to share with the app
}

// In the future we may add other personal items.
// Or, instead of the wallet address we may ask for per-service ID.
export type ConnectItem = TonAddressItem | TonProofItem;

export type TonAddressItem = {
  name: "ton_addr";
}
export type TonProofItem = {
  name: "ton_proof";
  payload: string; // arbitrary payload, e.g. nonce + expiration timestamp.
}

export type ConnectEvent = ConnectEventSuccess | ConnectEventError;

type ConnectEventSuccess = {
  event: "connect";
  id: number; // increasing event counter
  payload: {
    items: ConnectItemReply[];
    device: DeviceInfo;
  }
}

export enum ConnectEventErrorCode {
  UNKNOWN_ERROR = 0,
  BAD_REQUEST = 1,
  APP_MANIFEST_NOT_FOUND = 2,
  APP_MANIFEST_CONTENT_ERROR = 3,
  UNKNOWN_APP = 100,
  USER_DECLINED = 300,
}

export enum ConnectEventErrorMessage {
  UNKNOWN_ERROR = "Unknown error",
  BAD_REQUEST = "Bad request",
  APP_MANIFEST_NOT_FOUND = "App manifest not found",
  APP_MANIFEST_CONTENT_ERROR = "App manifest content error",
  UNKNOWN_APP = "Unknown app",
  USER_DECLINED = "User declined the connection",
}

type ConnectEventError = {
  event: "connect_error",
  id: number; // increasing event counter
  payload: {
    code: ConnectEventErrorCode;
    message?: ConnectEventErrorMessage;
  }
}

export type DeviceInfo = {
  platform: "iphone" | "ipad" | "android" | "windows" | "mac" | "linux";
  appName: string; // e.g. "Tonkeeper"  
  appVersion: string; // e.g. "2.3.367"
  maxProtocolVersion: number;
  features: Feature[]; // list of supported features and methods in RPC
  // Currently there is only one feature -- 'SendTransaction'; 
}

export interface WalletInfo {
  name: string;
  image: string;
  tondns?: string;
  about_url: string;
}

type Feature = { name: 'SendTransaction', maxMessages: number } | // `maxMessages` is maximum number of messages in one `SendTransaction` that the wallet supports
{ name: 'SignData' };

export type ConnectItemReply = TonAddressItemReply | TonProofItemReply;

// Untrusted data returned by the wallet. 
// If you need a guarantee that the user owns this address and public key, you need to additionally request a ton_proof.
export type TonAddressItemReply = {
  name: "ton_addr";
  address: string; // TON address raw (`0:<hex>`)
  network: NETWORK; // network global_id
  publicKey: string; // HEX string without 0x
  walletStateInit: string; // Base64 (not url safe) encoded stateinit cell for the wallet contract
}

export type TonProofItemReply = TonProofItemReplySuccess | TonProofItemReplyError;

type TonProofItemReplySuccess = {
  name: "ton_proof";
  proof: {
    timestamp: string; // 64-bit unix epoch time of the signing operation (seconds)
    domain: {
      lengthBytes: number; // AppDomain Length
      value: string;  // app domain name (as url part, without encoding) 
    };
    signature: string; // base64-encoded signature
    payload: string; // payload from the request
  }
}

export enum ConnectItemErrorCode {
  UNKNOWN_ERROR = 0,
  METHOD_NOT_SUPPORTED = 400,
}

export enum ConnectItemErrorMessage {
  UNKNOWN_ERROR = "Unknown error",
  METHOD_NOT_SUPPORTED = "Method is not supported",
}

type TonProofItemReplyError = {
  name: "ton_addr";
  error: {
    code: ConnectItemErrorCode;
    message?: ConnectItemErrorMessage;
  }
}

export enum NETWORK {
  MAINNET = '-239',
  TESTNET = '-3'
}

export type WalletResponse = WalletResponseSuccess | WalletResponseError;

interface WalletResponseSuccess {
  result: unknown;
  id: string;
}

interface WalletResponseError {
  error: { code: number; message: string; data?: unknown };
  id: string;
}

export interface AppRequest {
  method: string;
  params: unknown[];
  id: string;
}

export interface WalletEvent {
  event: WalletEventName;
  id: number; // increasing event counter
  payload: any; // specific payload for each event
}

type WalletEventName = 'connect' | 'connect_error' | 'disconnect';

export interface AccountInfo {
  address: string; // TON address raw (`0:<hex>`)
  network: NETWORK; // network global_id
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
  network?: NETWORK;
  from?: string;
  messages: Message[];
}

export type SendTransactionResponse = SendTransactionResponseSuccess | SendTransactionResponseError;

interface SendTransactionResponseSuccess {
  result: Uint8Array;
  id: string;
}

interface SendTransactionResponseError {
  error: { code: number; message: string };
  id: string;
}

export interface SignDataRequest {
  schema_crc: number;
  cell: string;
  publicKey?: string;
}

export interface SignDataResult {
  signature: string; // base64 encoded signature 
  timestamp: string; // UNIX timestamp in seconds (UTC) at the moment on creating the signature.
}

export interface SignProofRequest {
  payload: string;
}

export interface SignProofResult {
  signature: string; // base64 encoded signature 
  timestamp: string; // 64-bit unix epoch time of the signing operation (seconds)
  domain: {
    lengthBytes: number; // AppDomain Length
    value: string;  // app domain name (as url part, without encoding)
  };
}
