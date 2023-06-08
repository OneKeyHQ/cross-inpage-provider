import { ProviderPolkadot } from '../OnekeyPolkadotProvider';
import { SignerPayloadJSON, SignerPayloadRaw, SignerResult } from '../types';

export default class Signer {
  constructor(private provider: ProviderPolkadot) {}

  async signPayload(payload: SignerPayloadJSON): Promise<SignerResult> {
    return this.provider.web3SignPayload(payload);
  }

  async signRaw(payload: SignerPayloadRaw): Promise<SignerResult> {
    return this.provider.web3SignRaw(payload);
  }
}
