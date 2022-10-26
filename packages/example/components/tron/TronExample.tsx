import React, { useEffect, useState, useCallback, useRef } from 'react';

import { ProviderTron } from '@onekeyfe/onekey-tron-provider';
import type { TronWeb } from '@onekeyfe/onekey-tron-provider';

interface CustomMessage {
  data: {
    message: {
      action: string;
      data: {
        [index: string]: any;
      };
    };
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
      const parameter = [
        { type: 'address', value: (transferTokenTo.current as HTMLInputElement).value },
        { type: 'uint256', value: 100 },
      ];
      const options = {
        feeLimit: 100000000,
        callValue: 0,
        tokenValue: 10,
      };
      const tx = await tronWeb.transactionBuilder.triggerSmartContract(
        (transferTokenContract.current as HTMLInputElement).value,
        'transfer(address,uint256)',
        options,
        parameter,
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
            'address': 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs',
            'symbol': 'Tether Token',
            'decimals': 6,
            'image': 'https://static.tronscan.org/production/logo/usdtlogo.png',
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
      const parameter = [
        { type: 'address', value: (approveTokenSpender.current as HTMLInputElement).value },
        { type: 'uint256', value: 100 },
      ];
      const options = {
        feeLimit: 100000000,
        callValue: 0,
        tokenValue: 10,
      };
      const tx = await tronWeb.transactionBuilder.triggerSmartContract(
        (approveTokenContract.current as HTMLInputElement).value,
        'approve(address,uint256)',
        options,
        parameter,
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
    if (provider?.tronWeb?.defaultAddress.base58) {
      setAccounts([provider.tronWeb.defaultAddress.base58]);
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
      if (e.data.message && e.data.message.action == 'accountsChanged') {
        setAccounts([e.data.message.data.address].filter((t) => t));
      }
    });
  }, [handleTronLink]);

  return (
    <div>
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
            <button disabled={accounts.length > 0} onClick={handleConnectWallet}>
              {accounts.length ? 'connected' : 'connecte wallet'}
            </button>

            <p>{accounts}</p>
          </div>
          <div>
            <input ref={nativeTransferTo} placeholder={'to address'} />
            <button disabled={accounts.length === 0} onClick={handleSendNativeToken}>
              send 1 trx token
            </button>
          </div>
          <div>
            <input ref={transferTokenContract} placeholder={'token address'} />
            <input ref={transferTokenTo} placeholder={'to address'} />
            <button disabled={accounts.length === 0} onClick={handleSendToken}>
              send token
            </button>
          </div>
          <div>
            <input ref={approveTokenContract} placeholder={'token address'} />
            <input ref={approveTokenSpender} placeholder={'spender address'} />
            <button disabled={accounts.length === 0} onClick={handleApproveToken}>
              approve token
            </button>
          </div>
          <div>
            <button disabled={accounts.length === 0} onClick={handleAddTRC20Token}>
              add trc20 token
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TronExample;
