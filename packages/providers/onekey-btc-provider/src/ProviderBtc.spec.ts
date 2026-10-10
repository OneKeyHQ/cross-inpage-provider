import { web3Errors } from '@onekeyfe/cross-inpage-provider-errors';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';

import { ProviderBtc } from './ProviderBtc';

describe('BTC deriveContextHash', () => {
  function setup() {
    const provider = Object.create(ProviderBtc.prototype) as ProviderBtc;
    const request = jest.fn();
    Object.assign(provider, {
      providerName: IInjectedProviderNames.btc,
      bridge: { request },
      debugLogger: { providerBase: jest.fn() },
    });
    return { provider, request };
  }

  it('sends positional arguments as BTC bridge params and returns the secret string', async () => {
    const { provider, request } = setup();
    const secret = 'ab'.repeat(32);
    request.mockResolvedValue({ result: secret });

    await expect(provider.deriveContextHash('test-app', 'deadbeef')).resolves.toBe(secret);
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith({
      scope: 'btc',
      data: {
        method: 'deriveContextHash',
        params: { appName: 'test-app', context: 'deadbeef' },
      },
    });
  });

  it('preserves the backend invalid-params error for an empty context', async () => {
    const { provider, request } = setup();
    const error = web3Errors.rpc.invalidParams({
      message: 'Context must not be empty',
      data: { parameter: 'context' },
    });
    request.mockRejectedValue(error);

    await expect(provider.deriveContextHash('test-app', '')).rejects.toBe(error);
    expect(error.code).toBe(-32602);
    expect(request).toHaveBeenCalledWith({
      scope: 'btc',
      data: { method: 'deriveContextHash', params: { appName: 'test-app', context: '' } },
    });
  });

  it.each([
    ['cancellation', web3Errors.provider.userRejectedRequest()],
    ['unsupported method', web3Errors.rpc.methodNotSupported()],
  ])('preserves backend %s errors without returning a fallback', async (_, error) => {
    const { provider, request } = setup();
    request.mockRejectedValue(error);

    await expect(provider.deriveContextHash('test-app', 'deadbeef')).rejects.toBe(error);
    expect(request).toHaveBeenCalledTimes(1);
  });
});
