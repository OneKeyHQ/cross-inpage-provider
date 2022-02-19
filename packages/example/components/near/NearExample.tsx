import { OneKeyNearProvider, NearAccountsChangedPayload } from '@onekeyfe/onekey-near-provider';
import { useEffect, useState } from 'react';
import * as NearApi from 'near-api-js';

const hasWindow = typeof window !== 'undefined';

export default function NearExample() {
  const [provider, setProvider] = useState<OneKeyNearProvider | null>(null);
  const [accountId, setAccountId] = useState('');
  const [networkId, setNetworkId] = useState('');
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
        logger: console,
      });
      const installed = await _provider.detectWalletInstalled();
      if (!installed) {
        return;
      }
      setAccountId(_provider.getAccountId());
      setNetworkId(_provider.getSelectedNetwork().networkId);
      _provider.on('accountsChanged', (payload) => {
        const _accountId = payload?.accounts?.[0]?.accountId || '';
        console.log('accountsChanged', _accountId);
        setAccountId(_accountId);
      });
      _provider.on('networkChanged', (payload) => {
        setNetworkId(payload.networkId);
      });
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      global.$nearWallet = _provider;
      setProvider(_provider);
    })();
  }, []);

  return (
    <div>
      <div>accountId: {accountId}</div>
      <div>networkId: {networkId}</div>
      <div>
        {accountId ? (
          <button onClick={() => provider?.signOut()}>signOut</button>
        ) : (
          <button onClick={() => provider?.requestSignIn()}>requestSignIn</button>
        )}
      </div>
    </div>
  );
}
