import React, { useEffect, useState, useCallback, useRef } from 'react';

import { ProviderConflux, ProviderEvents } from '@onekeyfe/onekey-conflux-provider';

import { exampleContract, cfxTypedData } from './contract';

import { DAppList } from '../dappList/DAppList';
import { dapps } from './dapps.config';

const cusdtAddress = 'cfxtest:acepe88unk7fvs18436178up33hb4zkuf62a9dk1gv';

const useProvider = () => {
  const [provider, setProvider] = useState<ProviderConflux>();

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const injectedProvider = window.conflux as ProviderConflux;
    const confluxProvider = injectedProvider || new ProviderConflux({});
    window.conflux = confluxProvider;
    setProvider(confluxProvider);
  }, []);

  return provider;
};

function ConfluxExample() {
  const [connected, setConnected] = useState(false);
  const [chainId, setChainId] = useState('');
  const [networkId, setNetworkId] = useState('');
  const [accounts, setAccounts] = useState<string[]>([]);

  const spender = useRef();
  const transferFrom = useRef();
  const transferTo = useRef();

  const provider = useProvider();

  const init = useCallback((provider: ProviderConflux) => {
    if (provider.isConnected()) {
      setConnected(true);
      Promise.all([
        provider.request<string[]>({ method: 'cfx_accounts' }),
        provider.request<string>({ method: 'cfx_chainId' }),
      ])
        .then(([accounts, chainId]) => {
          setAccounts(accounts);
          setChainId(chainId);
          setNetworkId(parseInt(chainId, 16).toString(10));
        })
        .catch(console.error);
      provider
        .request<string[]>({
          method: 'cfx_accounts',
        })
        .then((accounts) => setAccounts(accounts))
        .catch(console.error);
    }
  }, []);

  const handleConnectWallet = useCallback(async () => {
    const accounts = await provider.request<string[]>({
      method: 'cfx_requestAccounts',
    });
    setAccounts(accounts);
  }, [provider]);

  const handleSendNativeToken = useCallback(async () => {
    const [connectedAddress] = await provider.request<string[]>({ method: 'cfx_accounts' });
    const tx = {
      from: connectedAddress,
      value: '0xde0b6b3a7640000',
      to: connectedAddress,
    };
    try {
      const result = await provider.request<string>({
        method: 'cfx_sendTransaction',
        params: [tx],
      });
      console.log(`send native token success: ${result}`);
    } catch (e) {
      console.log(e);
    }
  }, [provider]);
  const handleApproveToken = useCallback(async () => {
    const [connectedAddress] = await provider.request<string[]>({ method: 'cfx_accounts' });
    const tx = {
      from: connectedAddress,
      to: cusdtAddress,
      // eslint-disable-next-line
      data: exampleContract.approve(
        (spender.current as HTMLInputElement).value,
        100000000000000000000,
      ).data,
    };
    try {
      const result = await provider.request<string>({
        method: 'cfx_sendTransaction',
        params: [tx],
      });
      console.log(`approve token success: ${result}`);
    } catch (e) {
      console.log(e);
    }
  }, [provider, spender]);
  const handleTransferTokenFrom = useCallback(async () => {
    const [connectedAddress] = await provider.request<string[]>({
      method: 'cfx_accounts',
    });
    const tx = {
      from: connectedAddress,
      to: cusdtAddress,
      // eslint-disable-next-line
      data: exampleContract.transferFrom(
        (transferFrom.current as HTMLInputElement).value,
        (transferTo.current as HTMLInputElement).value,
        10000000000000000000,
      ).data,
    };

    try {
      const result = await provider.request<string>({
        method: 'cfx_sendTransaction',
        params: [tx],
      });
      console.log(`transfer from success: ${result}`);
    } catch (e) {
      console.log(e);
    }
  }, [provider, transferTo, transferFrom]);
  const handlePersoanlSign = useCallback(async () => {
    const [connectedAddress] = await provider.request<string[]>({
      method: 'cfx_accounts',
    });

    try {
      const result = await provider.request<string>({
        method: 'personal_sign',
        params: ['personal sign message example', connectedAddress],
      });
      console.log(`personal sign success: ${result}`);
    } catch (e) {
      console.log(e);
    }
  }, [provider]);
  const handleSignTypedDataV4 = useCallback(async () => {
    const [connectedAddress] = await provider.request<string[]>({
      method: 'cfx_accounts',
    });

    try {
      const result = await provider.request<string>({
        method: 'cfx_signTypedData_v4',
        params: [connectedAddress, JSON.stringify(cfxTypedData)],
      });
      console.log(`sing typed data v4 success: ${result}`);
    } catch (e) {
      console.log(e);
    }
  }, [provider]);
  const handleDeployContract = useCallback(async () => {
    const [connectedAddress] = await provider.request<string[]>({
      method: 'cfx_accounts',
    });

    const tx = {
      from: connectedAddress,
      // eslint-disable-next-line
      data: exampleContract.constructor('Example', 18, 'EP', 10000).data,
    };

    try {
      const result = await provider.request<string>({
        method: 'cfx_sendTransaction',
        params: [tx],
      });
      console.log(`deploy contract success: ${result}`);
    } catch (e) {
      console.log(e);
    }
  }, [provider]);
  const handleAddToken = useCallback(async () => {
    try {
      await provider.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: 'cfxtest:acepe88unk7fvs18436178up33hb4zkuf62a9dk1gv',
            symbol: 'cUSDT',
            decimals: 18,
            image:
              'https://scan-icons.oss-cn-hongkong.aliyuncs.com/testnet/cfxtest%3Aacepe88unk7fvs18436178up33hb4zkuf62a9dk1gv.png',
          },
        },
      });
      console.log('add token success');
    } catch (e) {
      console.log(e);
    }
  }, [provider]);
  const handleAddNetwork = useCallback(async () => {
    try {
      await provider.request({
        method: 'wallet_addConfluxChain',
        params: [
          {
            chainId: '0x47',
            chainName: 'EVM Conflux',
            nativeCurrency: {
              name: 'Conflux',
              symbol: 'CFX',
              decimals: 18,
            },
            rpcUrls: ['https://evmtestnet.confluxrpc.com'],
            blockExplorerUrls: ['https://evmtestnet.confluxscan.io'],
          },
        ],
      });
      console.log('add network success');
    } catch (e) {
      console.log(e);
    }
  }, [provider]);
  const handleSwitchNetwork = useCallback(async () => {
    try {
      await provider.request<string>({
        method: 'wallet_switchConfluxChain',
        params: [{ chainId: '0x1' }],
      });
      console.log('switch network success');
    } catch (e) {
      console.log(e);
    }
  }, [provider]);

  useEffect(() => {
    if (!provider) return;

    init(provider);

    provider.on(ProviderEvents.CONNECT, (network) => {
      console.log('connected');
      setConnected(true);
      setChainId(network.chainId);
      setNetworkId(network.networkId);

      provider
        .request<string[]>({
          method: 'cfx_accounts',
        })
        .then((accounts) => setAccounts(accounts))
        .catch((e) => console.log(e));
    });

    provider.on(ProviderEvents.ACCOUNTS_CHANGED, (accounts) => {
      setAccounts(accounts);
      console.log('accountsChanged', accounts);
    });
    provider.on(ProviderEvents.CHAIN_CHANGED, (chainId) => {
      setChainId(chainId);
      setNetworkId(parseInt(chainId, 16).toString(10));
      console.log('chainChanged', chainId);
    });
    provider.on(ProviderEvents.DISCONNECT, () => {
      setAccounts([]);
      setConnected(false);
    });
  }, [init, provider]);

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
            <p>{connected ? 'Wallet is initialized' : 'Wallet is not initialized'}</p>
            <p>chainId: {chainId}</p>
            <p>networkId: {networkId}</p>
          </div>
          <div>
            <button disabled={accounts.length > 0 || !connected} onClick={handleConnectWallet}>
              {accounts.length ? 'connected' : 'connecte wallet'}
            </button>

            <p>{accounts}</p>
          </div>
          <div>
            <button disabled={accounts.length === 0} onClick={handleSendNativeToken}>
              send native token to my self
            </button>
          </div>
          <div>
            <input ref={spender} placeholder={'Sepnder Address'} />
            <button disabled={accounts.length === 0} onClick={handleApproveToken}>
              approve 100 cUDST limit
            </button>
          </div>
          <div>
            <input ref={transferFrom} placeholder={'from address'} />
            <input ref={transferTo} placeholder={'to address'} />
            <button disabled={accounts.length === 0} onClick={handleTransferTokenFrom}>
              transfer from
            </button>
          </div>
          <div>
            <button disabled={accounts.length === 0} onClick={handlePersoanlSign}>
              personal sign
            </button>
          </div>
          <div>
            <button disabled={accounts.length === 0} onClick={handleSignTypedDataV4}>
              sign typed data v4
            </button>
          </div>
          <div>
            <button disabled={accounts.length === 0} onClick={handleDeployContract}>
              deploy contract
            </button>
          </div>
          <div>
            <button disabled={accounts.length === 0} onClick={handleAddToken}>
              add token
            </button>
          </div>
          <div>
            <button disabled={accounts.length === 0} onClick={handleAddNetwork}>
              add network
            </button>
          </div>
          <div>
            <button disabled={accounts.length === 0} onClick={handleSwitchNetwork}>
              switch network
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConfluxExample;
