import { IInpageProviderConfig } from '@onekeyfe/cross-inpage-provider-core';
import { IJsonRpcRequest } from '@onekeyfe/cross-inpage-provider-types';

import { ProviderBtcBase } from './ProviderBtcBase';

export type MessageType = 'ecdsa' | 'bip322-simple';
export type NetworkType = 'livenet' | 'testnet';
export type BalanceInfo = { 'confirmed': number; 'unconfirmed': number; 'total': number };
export type InscriptionInfo = {
  inscriptionId: string;
  inscriptionNumber: number;
  address: string;
  outputValue: number;
  preview: string;
  content: string;
  contentLength: number;
  contentType: string;
  timestamp: number;
  genesisTransaction: string;
  location: string;
  output: string;
  offset: number;
};

export type ProviderState = {
  accounts: string[] | null;
  isConnected: boolean;
  isUnlocked: boolean;
  initialized: boolean;
  isPermanentlyDisconnected: boolean;
};

export enum ProviderEvents {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  CLOSE = 'close',
  ACCOUNTS_CHANGED = 'accountsChanged',
  NETWORK_CHANGED = 'networkChanged',
  MESSAGE_LOW_LEVEL = 'message_low_level',
}

export enum ProviderMethods {
  REQUEST_ACCOUNTS = 'requestAccounts',
  GET_ACCOUNTS = 'getAccounts',
  GET_NETWORK = 'getNetwork',
  SWITCH_NETWORK = 'switchNetwork',
  GET_PUBLIC_KEY = 'getPublicKey',
  GET_BALANCE = 'getBalance',
  GET_INSCRIPTIONS = 'getInscriptions',
  SEND_BITCOIN = 'sendBitcoin',
  SEND_INSCRIPTION = 'sendInscription',
  SIGN_MESSAGE = 'signMessage',
  PUSH_TX = 'pushTx',
  SIGN_PSBT = 'signPsbt',
  SIGN_PSBTS = 'signPsbts',
  PUSH_PSBT = 'pushPsbt',
  GET_PROVIDER_STATE = 'getProviderState',
  INSCRIBE_TRANSFER = 'inscribeTransfer',
}

export type OneKeyBtcProviderProps = IInpageProviderConfig & {
  timeout?: number;
};

export interface RequestArguments {
  id?: number | string;
  method: string;
  params?: unknown[] | Record<string, unknown>;
}

export interface ProviderEventsMap {
  [ProviderEvents.CLOSE]: () => void;
  [ProviderEvents.CONNECT]: (data: any) => void;
  [ProviderEvents.DISCONNECT]: () => void;
  [ProviderEvents.ACCOUNTS_CHANGED]: (accounts: string[]) => void;
  [ProviderEvents.NETWORK_CHANGED]: (networkId: string) => void;
  [ProviderEvents.MESSAGE_LOW_LEVEL]: (payload: IJsonRpcRequest) => void;
}

export interface IProviderBtc extends ProviderBtcBase {
  readonly isOneKey: boolean;

  requestAccounts(): Promise<string[]>;
  getAccounts(): Promise<string[]>;
  getNetwork(): Promise<string>;
  switchNetwork(network: NetworkType): Promise<void>;
  getPublicKey(): Promise<string>;
  getBalance(): Promise<BalanceInfo>;
  getInscriptions(
    cursor?: number,
    size?: number,
  ): Promise<{
    total: number;
    list: InscriptionInfo[];
  }>;
  sendBitcoin(toAddress: string, satoshis: number, options?: { feeRate: number }): Promise<string>;
  sendInscription(
    toAddress: string,
    inscriptionId: string,
    options?: { feeRate: number },
  ): Promise<string>;
  signMessage(message: string, type?: MessageType): Promise<string>;
  pushTx(rawTx: string): Promise<string>;
  signPsbt(psbtHex: string, options?: { autoFinalized: boolean }): Promise<string>;
  signPsbts(psbtHexs: string[], options?: { autoFinalized: boolean }): Promise<string[]>;
  pushPsbt(psbt: string): Promise<string>;
  inscribeTransfer(ticker: string, amount: string): Promise<string>;
}
