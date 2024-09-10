import type { AxiosInstance } from 'axios';
import Axios from 'axios';

// https://scdo-project.gitbook.io/scdo-wiki/developer/api/rpc
export class ScdoNodeClient {
  public readonly axios: AxiosInstance;

  constructor() {
    this.axios = Axios.create({
      timeout: 30 * 1000,
    });
  }

  private getUrl(address: string) {
    const shard = [
      'https://mainnet.scdo.org:8137',
      'https://mainnet.scdo.org:8138',
      'https://mainnet.scdo.org:8139',
      'https://mainnet.scdo.org:8136',
    ];

    const index = +address.slice(0, 1) - 1;
    return shard[index] ?? shard[0];
  }

  public async getNonce(address: string): Promise<number | null> {
    const response = await this.axios.post<{ result: number }>(
      this.getUrl(address),
      {
        jsonrpc: '2.0',
        method: 'scdo_getAccountNonce',
        params: [address, '', -1],
        id: 1,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (response.status === 404) {
      return null;
    }

    return response.data.result ?? 0;
  }

  public async pushTransaction(address: string, tx: any): Promise<boolean | null> {
    const response = await this.axios.post<{ result: boolean }>(
      this.getUrl(address),
      {
        jsonrpc: '2.0',
        method: 'scdo_addTx',
        params: [tx],
        id: 1,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data.result ?? false;
  }
}
