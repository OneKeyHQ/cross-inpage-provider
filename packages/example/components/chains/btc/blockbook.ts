import type { AxiosError, AxiosInstance } from 'axios';
import axios from 'axios';

export type IBtcUTXO = {
  txid: string;
  vout: number;
  value: string;
  confirmations?: number;
};

export type IBtcTransaction = {
  hex: string;
  vout: {
    value: string;
    n: number;
    hex: string;
    addresses: string[];
    isAddress: boolean;
  }[];
};

export class BlockBook {
  readonly request: AxiosInstance;

  constructor(url: string) {
    this.request = axios.create({
      baseURL: url,
      timeout: 10000,
    });
  }

  async getUTXOs(address: string): Promise<Array<IBtcUTXO>> {
    return this.request.get<Array<IBtcUTXO>>(`/api/v2/utxo/${address}`).then((res) => res.data);
  }

  async getTransaction(txId: string): Promise<IBtcTransaction> {
    return this.request.get<IBtcTransaction>(`/api/v2/tx/${txId}`).then((res) => res.data);
  }
}
