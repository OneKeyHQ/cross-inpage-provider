import type { AxiosInstance } from 'axios';
import Axios from 'axios';

export interface Publickey {
  '@type': string;
  key: string;
}

export interface AccountInfo {
  '@type': string;
  address: string;
  pub_key: Publickey;
  account_number: string;
  sequence: string;
}

export class CosmosNodeClient {
  public readonly axios: AxiosInstance;

  constructor(baseURL: string) {
    this.axios = Axios.create({
      baseURL: baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL,
      timeout: 30 * 1000,
    });
  }

  public async getAccountInfo(address: string): Promise<AccountInfo | null> {
    const response = await this.axios.get<{ account: AccountInfo }>(
      `/cosmos/auth/v1beta1/accounts/${address}`,
    );

    if (response.status === 404) {
      return null;
    }

    return response.data.account;
  }
}
