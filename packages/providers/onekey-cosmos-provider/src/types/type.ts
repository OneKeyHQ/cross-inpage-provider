export interface Key {
  // Name of the selected key store.
  readonly name: string;
  // Ed25519
  readonly algo: string;
  readonly pubKey: Uint8Array;
  readonly address: Uint8Array;
  readonly bech32Address: string;
  // Indicate whether the selected account is from the nano ledger.
  // Because current cosmos app in the nano ledger doesn't support the direct (proto) format msgs,
  // this can be used to select the amino or direct signer.
  readonly isNanoLedger: boolean;
}

export type KeyHex = Key & {
  pubKey: string; // hex
  address: string; // hex
};

export type KeplrMode = 'extension' | 'mobile-web' | 'walletconnect';

export interface KeplrIntereactionOptions {
  readonly sign?: KeplrSignOptions;
}

export interface KeplrSignOptions {
  readonly preferNoSetFee?: boolean;
  readonly preferNoSetMemo?: boolean;

  readonly disableBalanceCheck?: boolean;
}

export interface BIP44 {
  readonly coinType: number;
}

export interface Bech32Config {
  readonly bech32PrefixAccAddr: string;
  readonly bech32PrefixAccPub: string;
  readonly bech32PrefixValAddr: string;
  readonly bech32PrefixValPub: string;
  readonly bech32PrefixConsAddr: string;
  readonly bech32PrefixConsPub: string;
}

export enum EthSignType {
  MESSAGE = 'message',
  TRANSACTION = 'transaction',
  EIP712 = 'eip-712',
}
