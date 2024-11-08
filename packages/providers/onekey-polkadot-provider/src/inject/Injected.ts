import { ProviderPolkadot } from '../OnekeyPolkadotProvider';
import Signer from './Signer';
import type {
  Injected,
  InjectedMetadata,
  InjectedProvider,
} from '@polkadot/extension-inject/types';
import Accounts from './Accounts';

export default class implements Injected {
  public readonly accounts: Accounts;

  public readonly metadata: InjectedMetadata | undefined;

  public readonly provider: InjectedProvider | undefined;

  public readonly signer: Signer;

  constructor(provider: ProviderPolkadot) {
    this.accounts = new Accounts(provider);
    this.metadata = undefined;
    this.provider = undefined;
    this.signer = new Signer(provider);
  }

  toJSON() {
    return {
      accounts: this.accounts,
      metadata: this.metadata,
      provider: this.provider,
      signer: this.signer,
    };
  }
}
