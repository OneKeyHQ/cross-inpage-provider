/**
 * @jest-environment node
 */
import { TransactionBlock } from '@benfen/bfc.js/transactions';

import { ProviderBfc } from './OnekeyBfcProvider';

import type { BenfenSignTransactionBlockInput } from '@benfen/bfc.js/wallet-standard';

const ADDRESS = `0x${'ab'.repeat(32)}`;

// Shaped like wallet-standard's ReadonlyWalletAccount, which dApps get from
// the wallet and pass back: its fields live behind getters.
class GetterAccount {
  readonly #address: string;

  constructor(address: string) {
    this.#address = address;
  }

  get address() {
    return this.#address;
  }
}
const walletAccount = () => new GetterAccount(ADDRESS);

function setup() {
  const provider = Object.create(ProviderBfc.prototype) as ProviderBfc;
  const bridgeRequest = jest.fn().mockResolvedValue({});
  Object.assign(provider, { bridgeRequest });
  // The bridge serializes requests, so this is what the wallet receives.
  const received = () =>
    JSON.parse(JSON.stringify(bridgeRequest.mock.calls[0][0])) as {
      params: { account?: unknown };
    };
  return { provider, received };
}

describe('BFC provider sign requests', () => {
  it.each([
    ['signTransactionBlock', () => ({ transactionBlock: new TransactionBlock() })],
    ['signAndExecuteTransactionBlock', () => ({ transactionBlock: new TransactionBlock() })],
    ['signMessage', () => ({ message: new Uint8Array([1]) })],
    ['signPersonalMessage', () => ({ message: new Uint8Array([1]) })],
  ] as const)('%s sends the wallet account as its address', async (method, input) => {
    const { provider, received } = setup();
    const sign = provider[method].bind(provider) as (input: unknown) => Promise<unknown>;
    await sign({ ...input(), account: walletAccount(), chain: 'bfc:mainnet' });

    expect(received().params.account).toEqual({ address: ADDRESS });
  });

  it('sends no account when the dApp gives none', async () => {
    const { provider, received } = setup();
    await provider.signTransactionBlock({
      transactionBlock: new TransactionBlock(),
      chain: 'bfc:mainnet',
    } as unknown as BenfenSignTransactionBlockInput);
    expect(received().params).not.toHaveProperty('account');
  });
});
