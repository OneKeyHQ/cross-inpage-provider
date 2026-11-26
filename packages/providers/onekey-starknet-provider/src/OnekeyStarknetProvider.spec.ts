import { ProviderStarknet } from './OnekeyStarknetProvider';

describe('ProviderStarknet', () => {
  function setup() {
    const bridge = {
      request: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    };
    const provider = new ProviderStarknet({ bridge: bridge as never });
    const bridgeRequest = jest.spyOn(provider, 'bridgeRequest').mockResolvedValue(['0xabc']);
    return { provider, bridgeRequest };
  }

  it('forwards Wallet API v4 request({ type, params }) to bridgeRequest', async () => {
    const { provider, bridgeRequest } = setup();
    const res = await provider.request<string[]>({
      type: 'wallet_requestAccounts',
      params: { silent_mode: false },
    });
    expect(bridgeRequest).toHaveBeenCalledWith({
      method: 'wallet_requestAccounts',
      params: { silent_mode: false },
    });
    expect(res).toEqual(['0xabc']);
  });

  it('supports literal v4 event names and unsubscribes cleanly even through a defineProperty-blocking Proxy', () => {
    const { provider } = setup();
    const proxied = new Proxy(provider, {
      defineProperty() {
        return true;
      },
    });
    const onAccounts = jest.fn();
    const onNetwork = jest.fn();

    proxied.on('accountsChanged', onAccounts);
    proxied.on('networkChanged', onNetwork);

    provider.emit('accountsChanged', ['0x123']);
    provider.emit('networkChanged', '0x534e5f4d41494e', ['0x123']);
    expect(onAccounts).toHaveBeenCalledWith(['0x123']);
    expect(onNetwork).toHaveBeenCalledWith('0x534e5f4d41494e', ['0x123']);

    proxied.off('accountsChanged', onAccounts);
    proxied.off('networkChanged', onNetwork);

    provider.emit('accountsChanged', ['0x456']);
    provider.emit('networkChanged', '0x534e5f5345504f4c4941', ['0x456']);
    expect(onAccounts).toHaveBeenCalledTimes(1);
    expect(onNetwork).toHaveBeenCalledTimes(1);
  });

  it('clears accounts on onekey_bridge_disconnect', () => {
    const { provider } = setup();
    const onAccounts = jest.fn();
    provider.on('accountsChanged', onAccounts);

    window.dispatchEvent(new Event('onekey_bridge_disconnect'));
    expect(onAccounts).toHaveBeenCalledWith([]);
  });
});
