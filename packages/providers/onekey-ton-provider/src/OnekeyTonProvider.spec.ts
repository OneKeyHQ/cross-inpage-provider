import { ProviderTon } from './OnekeyTonProvider';

describe('TON restoreConnection', () => {
  function setup() {
    const provider = Object.create(ProviderTon.prototype) as ProviderTon;
    const bridgeRequest = jest.fn();
    const emit = jest.fn();
    Object.assign(provider, {
      bridgeRequest,
      emit,
      deviceInfo: { appName: 'OneKey' },
      _accountInfo: { address: 'stale-account' },
      connectionStatus: 'connected',
    });
    return { provider, bridgeRequest, emit };
  }

  it.each(['connect', 'restoreConnection'] as const)(
    '%s returns the TON event and emits the same internal connection notifications',
    async (method) => {
      const { provider, bridgeRequest, emit } = setup();
      Object.assign(provider, { _accountInfo: null, connectionStatus: 'disconnected' });
      const account = { address: 'authorized-account' };
      bridgeRequest.mockResolvedValue(account);
      const result =
        method === 'connect'
          ? await provider.connect(2, {
              manifestUrl: 'https://dapp.example/manifest.json',
              items: [{ name: 'ton_addr' }],
            })
          : await provider.restoreConnection();
      expect(result).toMatchObject({
        event: 'connect',
        payload: { items: [{ name: 'ton_addr', ...account }], device: provider.deviceInfo },
      });
      expect(provider.connectionStatus).toBe('connected');
      expect(Reflect.get(provider, '_accountInfo')).toEqual(account);
      expect(emit.mock.calls).toEqual([
        ['connect', account.address],
        ['accountChanged', account.address],
      ]);
      // A repeated restoration must not duplicate connection notifications.
      await provider.restoreConnection();
      expect(emit).toHaveBeenCalledTimes(2);
    },
  );

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
