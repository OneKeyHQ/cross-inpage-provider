import { ProviderPolkadot } from '../OnekeyPolkadotProvider';
import { SignerPayloadJSON, SignerPayloadRaw, SignerResult } from '../types';

export default class Signer {
  constructor(private provider: ProviderPolkadot) {}

  signPayload = async (payload: SignerPayloadJSON): Promise<SignerResult> => {
    return this.provider.web3SignPayload(payload);
  };

  signRaw = async (payload: SignerPayloadRaw): Promise<SignerResult> => {
    return this.provider.web3SignRaw(payload);
  };

  toJSON() {
    return {};
  }
}
