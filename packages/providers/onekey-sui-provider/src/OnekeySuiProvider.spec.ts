import { ProviderSui } from './OnekeySuiProvider';

import type {
  SuiSignPersonalMessageInput,
  SuiSignTransactionBlockInput,
  SuiSignTransactionInput,
} from '@mysten/wallet-standard';

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

const transaction = {
  toJSON: () => Promise.resolve('{"version":2}'),
} as SuiSignTransactionInput['transaction'];
const transactionBlock = {
  serialize: () => '{"version":1}',
} as unknown as SuiSignTransactionBlockInput['transactionBlock'];
const message = new Uint8Array([1]);

function setup() {
  const provider = Object.create(ProviderSui.prototype) as ProviderSui;
  const bridgeRequest = jest.fn().mockResolvedValue({});
  Object.assign(provider, { bridgeRequest });
  // The bridge serializes requests, so this is what the wallet receives.
  const received = () =>
    JSON.parse(JSON.stringify(bridgeRequest.mock.calls[0][0])) as {
      params: { account?: unknown; walletSerialize?: string };
    };
  return { provider, received };
}

describe('Sui provider sign requests', () => {
  it.each([
    ['signTransaction', { transaction }],
    ['signAndExecuteTransaction', { transaction }],
    ['signTransactionBlock', { transactionBlock }],
    ['signAndExecuteTransactionBlock', { transactionBlock }],
    ['signMessage', { message }],
    ['signPersonalMessage', { message }],
  ] as const)('%s sends the wallet account as its address', async (method, input) => {
    const { provider, received } = setup();
    const sign = provider[method].bind(provider) as (input: unknown) => Promise<unknown>;
    await sign({ ...input, account: walletAccount(), chain: 'sui:mainnet' });

    const { params } = received();
    expect(params.account).toEqual({ address: ADDRESS });
    if (params.walletSerialize !== undefined) {
      expect(JSON.parse(params.walletSerialize)).toEqual({ address: ADDRESS });
    }
  });

  it('sends a plain account object as its address', async () => {
    const { provider, received } = setup();
    await provider.signPersonalMessage({
      message,
      account: { address: ADDRESS, label: 'dapp' },
    } as unknown as SuiSignPersonalMessageInput);
    expect(received().params.account).toEqual({ address: ADDRESS });
  });

  it('sends no account when the dApp gives none', async () => {
    const { provider, received } = setup();
    await provider.signTransaction({
      transaction,
      chain: 'sui:mainnet',
    } as unknown as SuiSignTransactionInput);
    expect(received().params).not.toHaveProperty('account');
  });
});
