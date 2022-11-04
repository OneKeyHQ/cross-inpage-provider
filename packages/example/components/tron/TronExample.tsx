import React, { useEffect, useState, useCallback, useRef } from 'react';

import { ProviderTron } from '@onekeyfe/onekey-tron-provider';
import type { TronWeb } from '@onekeyfe/onekey-tron-provider';

import { DAppList } from '../dappList/DAppList';
import { dapps } from './dapps.config';

interface CustomMessage {
  data: {
    message: {
      action: string;
      data: {
        [index: string]: any;
      };
    };
    isTronLink: boolean;
  };
}

function TronExample() {
  const [connected, setConnected] = useState(false);
  const [provider, setProvider] = useState<ProviderTron>();
  const [nodes, setNodes] = useState('');
  const [accounts, setAccounts] = useState<string[]>([]);

  const nativeTransferTo = useRef();
  const transferTokenTo = useRef();
  const transferTokenContract = useRef();
  const approveTokenSpender = useRef();
  const approveTokenContract = useRef();

  const handleConnectWallet = useCallback(async () => {
    await provider.request<string[]>({
      method: 'tron_requestAccounts',
    });
  }, [provider]);

  const handleSendNativeToken = useCallback(async () => {
    const [connectedAddress] = await provider.request<string[]>({
      method: 'tron_accounts',
    });
    try {
      const tronWeb = provider.tronWeb as TronWeb;
      const tx = await tronWeb.transactionBuilder.sendTrx(
        (nativeTransferTo.current as HTMLInputElement).value,
        1000000,
        connectedAddress,
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const signedTx = await tronWeb.trx.sign(tx);
      const broastTx = await tronWeb.trx.sendRawTransaction(signedTx);
      console.log(`send native token result: ${JSON.stringify(broastTx)}`);
    } catch (e) {
      console.log(e);
    }
  }, [provider]);

  const handleSendToken = useCallback(async () => {
    const [connectedAddress] = await provider.request<string[]>({
      method: 'tron_accounts',
    });
    try {
      const tronWeb = provider.tronWeb;
      const tx = await tronWeb.transactionBuilder.triggerSmartContract(
        (transferTokenContract.current as HTMLInputElement).value,
        'transfer(address,uint256)',
        {},
        [
          { type: 'address', value: (transferTokenTo.current as HTMLInputElement).value },
          {
            type: 'uint256',
            value: '1000000000000000000',
          },
        ],
        connectedAddress,
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const signedTx = await tronWeb.trx.sign(tx.transaction);
      const broastTx = await tronWeb.trx.sendRawTransaction(signedTx);
      console.log(`send token result: ${JSON.stringify(broastTx)}`);
    } catch (e) {
      console.log(e);
    }
  }, [provider]);
  const handleAddTRC20Token = useCallback(async () => {
    try {
      await provider.request({
        method: 'wallet_watchAsset',
        params: {
          'type': 'trc20',
          'options': {
            'address': 'TF17BgPaZYbz8oxbjhriubPDsA7ArKoLX3',
            'symbol': 'JUST GOV',
            'decimals': 18,
            'image': 'https://static.tronscan.org/production/logo/just_icon.png',
          },
        },
      });
      console.log('add token success');
    } catch (e) {
      console.log(e);
    }
  }, [provider]);

  const handleApproveToken = useCallback(async () => {
    const [connectedAddress] = await provider.request<string[]>({
      method: 'tron_accounts',
    });
    try {
      const tronWeb = provider.tronWeb;
      const tx = await tronWeb.transactionBuilder.triggerSmartContract(
        (transferTokenContract.current as HTMLInputElement).value,
        'approve(address,uint256)',
        {},
        [
          { type: 'address', value: (transferTokenTo.current as HTMLInputElement).value },
          {
            type: 'uint256',
            value: '1000000000000000000',
          },
        ],
        connectedAddress,
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const signedTx = await tronWeb.trx.sign(tx.transaction);
      const broastTx = await tronWeb.trx.sendRawTransaction(signedTx);
      console.log(`approve token result: ${JSON.stringify(broastTx)}`);
    } catch (e) {
      console.log(e);
    }
  }, [provider]);

  const handleTronLink = useCallback(() => {
    const injectedProvider = window.tronLink as ProviderTron;
    const tronProvider = injectedProvider || new ProviderTron({});
    setProvider(tronProvider);
  }, []);

  useEffect(() => {
    if (!provider) return;
    if (provider?.tronWeb?.defaultAddress?.base58) {
      setAccounts([provider.tronWeb.defaultAddress.base58]);
      setConnected(true);
    }
  }, [provider]);

  useEffect(() => {
    if (window.tronLink) {
      handleTronLink();
    } else {
      window.addEventListener('tronLink#initialized', handleTronLink, {
        once: true,
      });
    }

    window.addEventListener('message', function (e: CustomMessage) {
      if (e.data.message && e.data.message.action === 'accountsChanged') {
        setAccounts([e.data.message.data.address].filter((t) => t));
      }

      if (e.data.message && e.data.message.action === 'setAccount') {
        setAccounts([e.data.message.data.address].filter((t) => t));
      }

      if (e.data.message && e.data.message.action === 'connect') {
        setConnected(true);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        setAccounts([window.tronWeb?.defaultAddress?.base58]);
      }

      if (e.data.message && e.data.message.action === 'disconnect') {
        setConnected(false);
      }
    });
  }, [handleTronLink]);

  return (
    <div>
      <DAppList dapps={dapps} />
      {!provider && (
        <a target="_blank" href={'https://www.onekey.so/download/'}>
          Install OneKey Extension →
        </a>
      )}
      {provider && (
        <div>
          <div>
            <p>{'Wallet is initialized'}</p>
          </div>
          <div>
            <button disabled={connected} onClick={handleConnectWallet}>
              {connected ? 'connected' : 'connect wallet'}
            </button>
            {connected && <p>{accounts}</p>}
          </div>
          <div>
            <input ref={nativeTransferTo} placeholder={'to address'} />
            <button disabled={!connected} onClick={handleSendNativeToken}>
              send 1 trx token
            </button>
          </div>
          <div>
            <input ref={transferTokenContract} placeholder={'token address'} />
            <input ref={transferTokenTo} placeholder={'to address'} />
            <button disabled={!connected} onClick={handleSendToken}>
              send token
            </button>
          </div>
          <div>
            <input ref={approveTokenContract} placeholder={'token address'} />
            <input ref={approveTokenSpender} placeholder={'spender address'} />
            <button disabled={!connected} onClick={handleApproveToken}>
              approve token
            </button>
          </div>
          <div>
            <button disabled={!connected} onClick={handleAddTRC20Token}>
              add trc20 token
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TronExample;
