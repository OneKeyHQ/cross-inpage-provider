import type { AxiosInstance } from 'axios';
import Axios from 'axios';

export class ScdoNodeClient {
  public readonly axios: AxiosInstance;

  constructor() {
    this.axios = Axios.create({
      timeout: 30 * 1000,
    });
  }

  private getUrl(address: string) {
    const shard = {
      '1': 'https://mainnet.scdo.org:8137',
      '2': 'https://mainnet.scdo.org:8138',
      '3': 'https://mainnet.scdo.org:8139',
      '4': 'https://mainnet.scdo.org:8136',
    };

    return shard[address.charAt(0) as keyof typeof shard] ?? shard['1'];
  }

  public async getNonce(address: string): Promise<number | null> {
    const response = await this.axios.post(
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

    return 0;
  }
}
