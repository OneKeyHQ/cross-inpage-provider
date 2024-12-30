import type { AppCurrency, Currency, FeeCurrency } from './currency';

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

export interface ChainInfo {
  readonly rpc: string;
  readonly rest: string;
  readonly nodeProvider?: {
    readonly name: string;
    readonly email?: string;
    readonly discord?: string;
    readonly website?: string;
  };
  readonly chainId: string;
  readonly chainName: string;
  /**
   * This indicates the type of coin that can be used for stake.
   * You can get actual currency information from Currencies.
   */
  readonly stakeCurrency?: Currency;
  readonly walletUrl?: string;
  readonly walletUrlForStaking?: string;
  readonly bip44: BIP44;
  readonly alternativeBIP44s?: BIP44[];
  readonly bech32Config?: Bech32Config;

  readonly currencies: AppCurrency[];
  /**
   * This indicates which coin or token can be used for fee to send transaction.
   * You can get actual currency information from Currencies.
   */
  readonly feeCurrencies: FeeCurrency[];

  /**
   * Indicate the features supported by this chain. Ex) cosmwasm, secretwasm ...
   */
  readonly features?: string[];

  /**
   * Shows whether the blockchain is in production phase or beta phase.
   * Major features such as staking and sending are supported on staging blockchains, but without guarantee.
   * If the blockchain is in an early stage, please set it as beta.
   */
  readonly beta?: boolean;

  readonly chainSymbolImageUrl?: string;

  readonly hideInUI?: boolean;

  readonly evm?: EVMInfo;
}

export interface EVMInfo {
  chainId: number;
  rpc: string;
  websocket?: string;
}

export type ChainInfoWithoutEndpoints = Omit<
  ChainInfo,
  "rest" | "rpc" | "nodeProvider" | "evm"
> & {
  readonly rest: undefined;
  readonly rpc: undefined;
  readonly nodeProvider: undefined;
  readonly evm?: Omit<EVMInfo, "rpc"> & {
    readonly rpc: undefined;
  };
};