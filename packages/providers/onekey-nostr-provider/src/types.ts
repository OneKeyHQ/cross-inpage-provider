import { IJsonRpcRequest } from '@onekeyfe/cross-inpage-provider-types';
import type * as TypeUtils from './type-utils';
import { ProviderNostrBase } from './ProviderNostrBase';

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


export type NostrRequeset = {
  enable: () => Promise<boolean>
  getPublicKey: () => Promise<string>
  signEvent: (args: {event: Event}) => Promise<Event>
  getRelays: () => Promise<IRelay>
  nip04: {
    encrypt: (pubkey: string, plaintext: string) => Promise<string>,
    decrypt: (pubkey: string, ciphertext: string) => Promise<string>,
  }
  encrypt: (args: {pubkey: string; plaintext: string}) => Promise<string>,
  decrypt: (args: {pubkey: string; ciphertext: string}) => Promise<string>,
  signSchnorr: (sigHash: string) => Promise<string>
}

export type IProviderNostr =ProviderNostrBase & Omit<NostrRequeset, 'encrypt' | 'decrypt' | 'signEvent'> & {
  encrypt: (pubkey: string, plaintext: string) => Promise<string>,
  decrypt: (pubkey: string, ciphertext: string) => Promise<string>,
  signEvent: (event: Event) => Promise<Event>
} 

export type JsBridgeRequest = {
  // @ts-expect-error
  [K in keyof NostrRequeset]: (params: Parameters<NostrRequeset[K]>[0]) => Promise<TypeUtils.WireStringified<TypeUtils.ResolvePromise<ReturnType<NostrRequeset[K]>>>>
}

export type JsBridgeRequestParams<T extends keyof JsBridgeRequest> = Parameters<JsBridgeRequest[T]>[0]

export type JsBridgeRequestResponse<T extends keyof JsBridgeRequest> = ReturnType<JsBridgeRequest[T]>


const PROVIDER_EVENTS = {
  'connect': 'connect',
  'disconnect': 'disconnect',
  'accountChanged': 'accountChanged',
  'message_low_level': 'message_low_level',
} as const;

export type NostrProviderEventsMap = {
  [PROVIDER_EVENTS.connect]: (account: string) => void;
  [PROVIDER_EVENTS.disconnect]: () => void;
  [PROVIDER_EVENTS.accountChanged]: () => void;
  [PROVIDER_EVENTS.message_low_level]: (payload: IJsonRpcRequest) => void;
};
