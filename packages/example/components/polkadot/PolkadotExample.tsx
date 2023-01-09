import React from 'react';
import { useState, useEffect } from 'react';
import { signatureVerify } from '@polkadot/util-crypto';
import { DAppList } from '../dappList/DAppList';
import { dapps } from './dapps.config';
import { web3Accounts, web3AccountsSubscribe, web3Enable, web3FromSource } from '@polkadot/extension-dapp';
import type { InjectedExtension, Unsubcall } from '@polkadot/extension-inject/types';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { hexToU8a, stringToHex } from '@polkadot/util';

declare global {
  interface Window {
    // @ts-expect-error
    suiWallet: ProviderSui;
  }
}

export default function App() {
  const [connected, setConnected] = useState<boolean>(false);
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<InjectedExtension>();
  const [api, setApi] = useState<ApiPromise>();

  useEffect(() => {
    if (!provider) return;

    let unsubcall: Unsubcall
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
      unsubcall = await web3AccountsSubscribe((accounts) => {
        console.log('[web3AccountsSubscribe]', JSON.stringify(accounts));
      });
    })();

    return () => {
      void unsubcall?.();
    };
  }, [provider]);


  const getAccounts = async () => {
    try {
      const apiAccounts = await web3Accounts();
      console.log('[getAccounts apiAccounts]', apiAccounts);

      const accounts = await provider.accounts.get()
      console.log('[getAccounts]', accounts);
      return accounts
    } catch (err) {
      console.warn(err);
      console.log(`[error] getAccounts: ${JSON.stringify(err)}`);
    }
  };


  const connectWallet = async () => {
    try {
      // Construct
      const wsProvider = new WsProvider('wss://rpc.polkadot.io');

      const allInjected = await web3Enable('my cool dapp');
      const [provider] = allInjected;

      const api = await ApiPromise.create({ provider: wsProvider });
      setApi(api);

      if (provider) {

        setProvider(provider);
        const accounts = await provider.accounts.get()
        const [account] = accounts
        setAddress(account.address);
        setConnected(true);

        console.log('[connectWallet] account', accounts);

        console.log('[connectWallet] provider.name', provider.name);
        console.log('[connectWallet] provider.version', provider.version);
        console.log('[connectWallet] provider.metadata', provider.metadata);
        console.log('[connectWallet] provider.provider', provider.provider);
        console.log('[connectWallet] provider.signer', provider.signer);
      } else {
        console.log('[error] connectWallet', allInjected);
      }
    } catch (err) {
      console.warn(err);
      console.log(`[error] connectWallet: ${JSON.stringify(err)}`);
    }
  };

  const executeTransfer = () => {
    if (!provider) return;

    api.tx.balances
      .transfer(address, 123456)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      .signAndSend(address, { signer: provider.signer }, (status) => {
        console.log('[executeTransfer] status', status);
      }).catch((err) => {
        console.log('[executeTransfer] error', err);
      });
  }

  const executeSignMessage = async () => {
    if (!provider) return;

    const [account] = await web3Accounts();
    const injector = await web3FromSource(account.meta.source);
    // this injector object has a signer and a signRaw method
    // to be able to sign raw bytes
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const signRaw = injector?.signer?.signRaw;

    if (signRaw) {
      // after making sure that signRaw is defined
      // we can use it to sign our message
      try {
        const message = stringToHex('message to sign')

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        const { signature } = await signRaw({
          address: account.address,
          data: message,
          type: 'bytes'
        });

        console.log('[executeSignMessage] signature', signature);

        const { isValid } = signatureVerify(hexToU8a(message), hexToU8a(signature as string), account.address);

        if (isValid) {
          console.log('[executeSignMessage] Valid success');
        } else {
          console.log('[executeSignMessage] Valid error');
        }
      } catch (error) {
        console.log('[executeSignMessage] error', error);
      }
    } else {
      console.log('[executeSignMessage] error', 'signRaw is undefined');
    }
  }

  return (
    <div>
      <DAppList dapps={dapps} />

      <main>
        {connected ? (
          <>
            <button onClick={getAccounts}>Get Accounts</button>
            <button onClick={executeTransfer}>Sign & Execute Transaction</button>
            <button onClick={executeSignMessage}>Sign Message</button>
          </>
        ) : (
          <>
            <button onClick={() => connectWallet()}>Connect Wallet</button>
          </>
        )}
      </main>
    </div>
  );
}
