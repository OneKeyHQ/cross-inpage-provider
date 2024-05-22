export enum EventKind {
  Metadata = 0,
  Text = 1,
  RelayRec = 2,
  Contacts = 3,
  DM = 4,
  Deleted = 5,
}

export type Event = {
  id: string;
  kind: EventKind;
  pubkey: string;
  content: string;
  tags: string[][];
  created_at: number;
  sig: string;
};

export interface IProviderApi {
  isOneKey?: boolean;
  getPublicKey(): Promise<string>;
  signEvent(event: {
    created_at: number;
    kind: number;
    tags: string[][];
    content: string;
  }): Promise<Event>;
  signSchnorr(sigHash: string): Promise<string>;
  nip04: {
    encrypt(pubkey: string, message: string): Promise<string>;
    decrypt(pubkey: string, ciphertext: string): Promise<string>;
  };
}

export interface IProviderInfo {
  uuid: string;
  name: string;
  inject?: string; // window.ethereum
}
