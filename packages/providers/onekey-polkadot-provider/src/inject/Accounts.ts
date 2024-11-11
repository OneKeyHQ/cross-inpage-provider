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
    const unsub = this.provider.web3AccountsSubscribe(cb);
    void this.get();
    return unsub;
  };

  toJSON() {
    return {
      get: {},
      subscribe: {},
    };
  }
}
