import { IJsonRpcRequest } from '@onekeyfe/cross-inpage-provider-types';
import type * as TypeUtils from './type-utils';
import { ProviderPrivateExternalAccountBase } from './ProviderPrivateExternalAccountBase';

export type Event = {
  id?: string;
  kind: EventKind;
  pubkey?: string;
  content: string;
  tags: string[][];
  created_at: number;
  sig?: string;
};

export enum EventKind {
  Metadata = 0,
  Text = 1,
  RelayRec = 2,
  Contacts = 3,
  DM = 4,
  Deleted = 5,
}

export type IRelay = {
  [url: string]: {read: boolean, write: boolean}
}

export type IExternalAccount = {
  address: string;
  coinType: string;
  path: string;
  xpub: string;
  template: string;
}

export type IBtcNetwork = 'mainnet' | 'testnet'
export type ISignTxRes = { txid: string; rawTx: string; }

export type PrivateExternalAccountRequeset = {
  btc_requestAccount: (network: IBtcNetwork) => Promise<IExternalAccount>;
  btc_signTransaction: (params: {psbtHex: string; network: IBtcNetwork}) => Promise<ISignTxRes>
}

export type IProviderPrivateExternalAccount = ProviderPrivateExternalAccountBase & PrivateExternalAccountRequeset;


export type JsBridgeRequest = {
  [K in keyof PrivateExternalAccountRequeset]: (params: Parameters<PrivateExternalAccountRequeset[K]>[0]) => Promise<TypeUtils.WireStringified<TypeUtils.ResolvePromise<ReturnType<PrivateExternalAccountRequeset[K]>>>>
}

export type JsBridgeRequestParams<T extends keyof JsBridgeRequest> = Parameters<JsBridgeRequest[T]>[0]

export type JsBridgeRequestResponse<T extends keyof JsBridgeRequest> = ReturnType<JsBridgeRequest[T]>


const PROVIDER_EVENTS = {
  'connect': 'connect',
  'disconnect': 'disconnect',
  'accountChanged': 'accountChanged',
  'message_low_level': 'message_low_level',
} as const;

export type PrivateExternalAccountProviderEventsMap = {
  [PROVIDER_EVENTS.connect]: (account: string) => void;
  [PROVIDER_EVENTS.disconnect]: () => void;
  [PROVIDER_EVENTS.accountChanged]: () => void;
  [PROVIDER_EVENTS.message_low_level]: (payload: IJsonRpcRequest) => void;
};
