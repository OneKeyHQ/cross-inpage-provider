import { IProviderApi as IProviderBTCApi } from '../btc/types';

export interface UTXO {
  // hash of transaction that holds the UTXO
  txid: string;
  // index of the output in the transaction
  vout: number;
  // amount of satoshis the UTXO holds
  value: number;
  // the script that the UTXO contains
  scriptPubKey: string;
}

export type Fees = {
  // fee for inclusion in the next block
  fastestFee: number;
  // fee for inclusion in a block in 30 mins
  halfHourFee: number;
  // fee for inclusion in a block in 1 hour
  hourFee: number;
  // economy fee: inclusion not guaranteed
  economyFee: number;
  // minimum fee: the minimum fee of the network
  minimumFee: number;
};

export interface IProviderApi extends IProviderBTCApi {
  connectWallet(): Promise<this>;
  getWalletProviderName(): Promise<string>;
  getAddress(): Promise<string>;
  getPublicKeyHex(): Promise<string>;
  signMessageBIP322(message: string): Promise<string>;
  getNetworkFees(): Promise<Fees>;
  getBTCTipHeight(): Promise<number>;
  getUtxos(address: string, amount: number): Promise<UTXO[]>;
}

export interface IProviderInfo {
  uuid: string;
  name: string;
  inject?: string; // window.ethereum
}
