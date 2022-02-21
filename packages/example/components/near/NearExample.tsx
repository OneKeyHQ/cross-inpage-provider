import {
  OneKeyNearProvider,
  NearAccountsChangedPayload,
  NearNetworkChangedPayload,
} from '@onekeyfe/onekey-near-provider';
import { useCallback, useEffect, useState } from 'react';
import * as NearApi from 'near-api-js';

const hasWindow = typeof window !== 'undefined';

export default function NearExample() {
  const [provider, setProvider] = useState<OneKeyNearProvider | null>(null);
  const [accountId, setAccountId] = useState('');
  const [networkId, setNetworkId] = useState('');
  const onAccountsChanged = useCallback((payload: NearAccountsChangedPayload) => {
    const _accountId = payload?.accounts?.[0]?.accountId || '';
    console.log('onAccountsChanged >>>', _accountId);
    setAccountId(_accountId);
  }, []);
  const onNetworkChanged = useCallback((payload: NearNetworkChangedPayload) => {
    console.log('onNetworkChanged >>>', payload);
    setNetworkId(payload.networkId);
  }, []);
  useEffect(() => {
    if (!hasWindow) {
      // return;
    }
    const config = {
      networkId: 'mainnet',
      nodeUrl: 'https://rpc.mainnet.near.org',
      headers: {},
      keyStore: new NearApi.keyStores.BrowserLocalStorageKeyStore(),
    };

    void (async () => {
      const near = new NearApi.Near(config);
      const connection = near.connection;
      const _provider = new OneKeyNearProvider({
        connection,
        networkId: config.networkId,
        // logger: console,
      });
      const installed = await _provider.detectWalletInstalled();
      if (!installed) {
        return;
      }
      setAccountId(_provider.getAccountId());
      setNetworkId(_provider.getSelectedNetwork().networkId);

      _provider.on('accountsChanged', onAccountsChanged);
      _provider.on('networkChanged', onNetworkChanged);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      global.$nearWallet = _provider;
      setProvider(_provider);
    })();
  }, [onAccountsChanged, onNetworkChanged]);
  useEffect(() => {
    return () => {
      if (provider) {
        provider.off('accountsChanged', onAccountsChanged);
        provider.off('networkChanged', onNetworkChanged);
      }
    };
  }, [onAccountsChanged, onNetworkChanged, provider]);

  return (
    <div>
      {!provider && <a href={'https://onekey.so/plugin'}>Install OneKey Extension →</a>}
      {provider && (
        <div>
          <div>accountId: {accountId}</div>
          <div>networkId: {networkId}</div>
          <div>
            <button onClick={() => provider?.requestSignIn()}>signIn</button>
            <button onClick={() => provider?.signOut()}>signOut</button>
            <button onClick={() => provider?.request({ method: 'near_accounts', params: [] })}>
              near_accounts
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
