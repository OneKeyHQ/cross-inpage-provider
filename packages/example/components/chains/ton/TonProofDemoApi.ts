import {
  Account,
  ConnectAdditionalRequest,
  TonProofItemReplySuccess,
} from '@tonconnect/ui-react';
import '../../../lib/localStorageForGithubPages';

class TonProofDemoApiService {
  private localStorageKey = 'demo-api-access-token';

  private host = window.location.origin;

  public accessToken: string | null = null;

  public readonly refreshIntervalMs = 9 * 60 * 1000;

  constructor() {
    this.accessToken = localStorage.getItem(this.localStorageKey);

    if (!this.accessToken) {
      this.generatePayload();
    }
  }

  async generatePayload(): Promise<ConnectAdditionalRequest | null> {
    try {
      const response = await (
        await fetch(`${this.host}/api/generate_payload`, {
          method: 'POST',
        })
      ).json();
      return { tonProof: response.payload as string };
    } catch {
      return null;
    }
  }

  async checkProof(proof: TonProofItemReplySuccess['proof'], account: Account): Promise<boolean> {
    try {
      const reqBody = {
        address: account.address,
        network: account.chain,
        public_key: account.publicKey,
        proof: {
          ...proof,
          state_init: account.walletStateInit,
        },
      };

      const response = await (
        await fetch(`${this.host}/api/check_proof`, {
          method: 'POST',
          body: JSON.stringify(reqBody),
        })
      ).json();

      if (response?.token) {
        localStorage.setItem(this.localStorageKey, response.token);
        this.accessToken = response.token;
        return true;
      }
      return false;
    } catch (e) {
      console.log('checkProof error:', e);
      throw e;
    }
  }

  async getAccountInfo(account: Account) {
    const response = await (
      await fetch(`${this.host}/api/get_account_info`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      })
    ).json();

    return response as {};
  }

  reset() {
    this.accessToken = null;
    localStorage.removeItem(this.localStorageKey);
    this.generatePayload();
  }
}

export const TonProofDemoApi = new TonProofDemoApiService();
