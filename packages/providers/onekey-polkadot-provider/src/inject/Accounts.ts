import { Unsubcall, InjectedAccount } from '@polkadot/extension-inject/types';
import type { InjectedAccounts } from '@polkadot/extension-inject/types';
import { ProviderPolkadot } from '../OnekeyPolkadotProvider';

export default class implements InjectedAccounts {
  constructor(private provider: ProviderPolkadot) {}

  get = async (anyType?: boolean): Promise<InjectedAccount[]> => {
    return this.provider.web3Accounts(anyType);
  };

  subscribe = (cb: (accounts: InjectedAccount[]) => unknown): Unsubcall => {
    // listener for account change
    (async () => {
      const accounts = await this.get();
      cb(accounts);
    })();
    return this.provider.web3AccountsSubscribe(cb);
  };

  toJSON() {
    return {
      get: {},
      subscribe: {},
    };
  }
}
