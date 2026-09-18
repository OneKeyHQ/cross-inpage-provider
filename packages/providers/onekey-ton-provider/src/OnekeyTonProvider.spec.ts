import { ProviderTon } from './OnekeyTonProvider';

describe('TON restoreConnection', () => {
  function setup() {
    const provider = Object.create(ProviderTon.prototype) as ProviderTon;
    const bridgeRequest = jest.fn();
    Object.assign(provider, {
      bridgeRequest,
      deviceInfo: { appName: 'OneKey' },
      _accountInfo: { address: 'stale-account' },
      connectionStatus: 'connected',
    });
    return { provider, bridgeRequest };
  }

  it('rechecks backend authorization even when an account is cached', async () => {
    const { provider, bridgeRequest } = setup();
    const account = { address: 'authorized-account' };
    bridgeRequest.mockResolvedValue(account);
    await expect(provider.restoreConnection()).resolves.toMatchObject({
      event: 'connect',
      payload: { items: [{ name: 'ton_addr', ...account }] },
    });
    expect(bridgeRequest).toHaveBeenCalledWith({ method: 'restoreConnection', params: [] });
    expect(provider.connectionStatus).toBe('connected');
  });

  it('returns UNKNOWN_APP and clears stale state when authorization was revoked', async () => {
    const { provider, bridgeRequest } = setup();
    bridgeRequest.mockResolvedValue(null);
    await expect(provider.restoreConnection()).resolves.toMatchObject({
      event: 'connect_error',
      payload: { code: 100 },
    });
    expect(provider.connectionStatus).toBe('disconnected');
    expect(Reflect.get(provider, '_accountInfo')).toBeNull();
  });

  it('reports transport failures without falling back to interactive connect', async () => {
    const { provider, bridgeRequest } = setup();
    bridgeRequest.mockRejectedValue(new Error('transport unavailable'));
    await expect(provider.restoreConnection()).resolves.toMatchObject({
      event: 'connect_error',
      payload: { code: 0 },
    });
    expect(bridgeRequest).toHaveBeenCalledTimes(1);
    expect(provider.connectionStatus).toBe('disconnected');
  });
});
