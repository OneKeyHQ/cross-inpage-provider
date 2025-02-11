import type { AxiosInstance } from 'axios';
import Axios from 'axios';

// https://scdo-project.gitbook.io/scdo-wiki/developer/api/rpc
export class ScdoNodeClient {
  public readonly axios: AxiosInstance;
  private readonly rpcUrl: string;

  constructor(rpcUrl = 'https://mainnet.scdo.org:8137') {
    this.rpcUrl = rpcUrl;
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

  async pushTransaction(from: string, tx: any): Promise<boolean> {
    try {
      const response = await fetch(this.getUrl(from), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'scdo_addTx',
          params: [tx],
          id: 1,
        }),
      });

      if (!response.ok) {
        console.error('RPC 请求失败:', response.status, response.statusText);
        return false;
      }

      const result = await response.json();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      console.log('RPC 响应:', result);

      const { error } = result as { error: { code: number; message: string } };
      if (error) {
        if (error.code === -32000 && error.message === 'Tx already exists') {
          console.log('交易已存在于网络中');
          return true;
        }
        console.error('RPC 错误:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('推送交易失败:', error);
      return false;
    }
  }
}
