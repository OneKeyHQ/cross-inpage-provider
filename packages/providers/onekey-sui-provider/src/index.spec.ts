import type { IInpageProviderConfig } from '@onekeyfe/cross-inpage-provider-core';

import { ProviderSui } from './OnekeySuiProvider';

const createProvider = () => {
  const request = jest.fn(async ({ data }: { data: { params: unknown } }) => ({
    result: data.params,
  }));
  const bridge = {
    request,
    attachProviderInstance: jest.fn(),
    debugLogger: {
      _attachExternalLogger: jest.fn(),
      providerBase: jest.fn(),
    },
  } as unknown as NonNullable<IInpageProviderConfig['bridge']>;

  return {
    provider: new ProviderSui({ bridge }),
    request,
  };
};

const createTransaction = () => ({
  toJSON: jest.fn(async () => 'serialized-transaction'),
  serialize: jest.fn(() => 'legacy-serialized-transaction'),
});

const expectedSerializationOptions = {
  supportedIntents: ['CoinWithBalance'],
};

describe('ProviderSui', () => {
  test('serializes transaction block methods with supported Sui intents', async () => {
    const { provider } = createProvider();
    const transactionBlock = createTransaction();

    await provider.signTransactionBlock({
      transactionBlock,
    } as unknown as Parameters<ProviderSui['signTransactionBlock']>[0]);

    await provider.signAndExecuteTransactionBlock({
      transactionBlock,
    } as unknown as Parameters<ProviderSui['signAndExecuteTransactionBlock']>[0]);

    expect(transactionBlock.toJSON).toHaveBeenCalledTimes(2);
    expect(transactionBlock.toJSON).toHaveBeenNthCalledWith(
      1,
      expectedSerializationOptions,
    );
    expect(transactionBlock.toJSON).toHaveBeenNthCalledWith(
      2,
      expectedSerializationOptions,
    );
  });

  test('serializes transaction methods with supported Sui intents', async () => {
    const { provider } = createProvider();
    const transaction = createTransaction();

    await provider.signTransaction({
      transaction,
    } as unknown as Parameters<ProviderSui['signTransaction']>[0]);

    await provider.signAndExecuteTransaction({
      transaction,
    } as unknown as Parameters<ProviderSui['signAndExecuteTransaction']>[0]);

    expect(transaction.toJSON).toHaveBeenCalledTimes(2);
    expect(transaction.toJSON).toHaveBeenNthCalledWith(
      1,
      expectedSerializationOptions,
    );
    expect(transaction.toJSON).toHaveBeenNthCalledWith(
      2,
      expectedSerializationOptions,
    );
  });
});
