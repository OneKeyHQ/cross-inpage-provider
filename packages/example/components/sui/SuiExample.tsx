import React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { ProviderSui } from '@onekeyfe/onekey-sui-provider';

import { DAppList } from '../dappList/DAppList';
import { dapps } from './dapps.config';
import { JsonRpcProvider, MoveCallTransaction, Connection } from '@mysten/sui.js';
import { buildTransfer } from './utils';

declare global {
  interface Window {
    // @ts-expect-error
    suiWallet: ProviderSui;
  }
}

const useProvider = () => {
  const [provider, setProvider] = useState<ProviderSui>();

  useEffect(() => {
    const injectedProvider = window.suiWallet as ProviderSui;
    const suiProvider =
      injectedProvider ||
      new ProviderSui({
        // use mock api provider bridge for development
        // bridge: new CustomBridge(),
      });
    setProvider(suiProvider);
  }, []);

  return provider;
};

const INIT_MOVE_CALL: MoveCallTransaction = {
  kind: 'MoveCall',
  target: `0x0000000000000000000000000000000000000002::devnet_nft::mint`,
  typeArguments: [],
  arguments: [],
};

export default function App() {
  const provider = useProvider();

  const [network, setNetwork] = useState<string>('TestNet');
  const [connected, setConnected] = useState<boolean>(false);
  const [address, setAddress] = useState<string | null>(null);

  const [moveCall, setMoveCall] = useState<MoveCallTransaction>(INIT_MOVE_CALL);

  const rpcProvider = useMemo(() => {
    if (network.toLowerCase() === 'testnet') {
      return new JsonRpcProvider(
        new Connection({
          fullnode: 'https://fullnode.testnet.sui.io',
          faucet: 'https://faucet.testnet.sui.io/gas',
        }),
      );
    } else {
      return new JsonRpcProvider(
        new Connection({
          fullnode: 'https://fullnode.devnet.sui.io',
          faucet: 'https://faucet.devnet.sui.io/gas',
        }),
      );
    }
  }, [network]);

  useEffect(() => {
    if (!provider) return;
    // try to eagerly connect
    // provider.connect().catch((err) => {
    //     err;
    //     // fail silently
    // });

    try {
      provider.on('connect', (address: string) => {
        setConnected(true);
        setAddress(address);
        console.log(`suiWallet.on [connect] ${address}`);
      });
    } catch (e) {
      // ignore
    }
    try {
      provider.on('disconnect', () => {
        setAddress(null);
        setConnected(false);
        console.log('suiWallet.on [disconnect] 👋');
      });
    } catch (e) {
      // ignore
    }
    try {
      provider.on('networkChange', (network: string) => {
        setNetwork(network);
        console.log(`suiWallet.on [networkChange] ${network}`);
      });
    } catch (e) {
      // ignore
    }
    try {
      provider.on('accountChanged', (address: string) => {
        setAddress(address);
        setConnected(!!address);
        console.log(`suiWallet.on [accountChange] ${address}`);
      });
    } catch (e) {
      // ignore
    }
    return () => {
      void provider.disconnect();
    };
  }, [provider]);

  if (!provider) {
    return <h2>Could not find a provider</h2>;
  }

  const hasPermissions = async () => {
    try {
      const has = await provider.hasPermissions();
      console.log('[hasPermissions]', has);
    } catch (err) {
      console.warn(err);
      console.log(`[error] hasPermissions: ${JSON.stringify(err)}`);
    }
  };

  const requestPermissions = async () => {
    try {
      const has = await provider.requestPermissions();
      console.log('[requestPermissions]', has);
      return has;
    } catch (err) {
      console.warn(err);
      console.log(`[error] requestPermissions: ${JSON.stringify(err)}`);
    }
  };

  const getAccounts = async () => {
    try {
      const accounts = await provider.getAccounts();
      console.log('[getAccounts]', accounts);
      return accounts;
    } catch (err) {
      console.warn(err);
      console.log(`[error] getAccounts: ${JSON.stringify(err)}`);
    }
  };

  const connectWallet = async () => {
    try {
      const has = await requestPermissions();
      if (has) {
        const accounts = await getAccounts();
        setAddress(accounts[0]?.address ?? null);
        setNetwork(network);
        setConnected(true);

        console.log('[connectWallet] account', accounts, network);
      } else {
        console.log('[error] connectWallet', has, network);
      }
    } catch (err) {
      console.warn(err);
      console.log(`[error] connectWallet: ${JSON.stringify(err)}`);
    }
  };

  const requestSuiFromFaucet = async () => {
    try {
      const faucet = await rpcProvider.requestSuiFromFaucet(address);
      console.log('[requestSuiFromFaucet] faucet success:', faucet);
    } catch (err) {
      console.warn(err);
      console.log(`[error] requestSuiFromFaucet: ${JSON.stringify(err)}`);
    }
  };

  const disconnectWallet = async () => {
    try {
      await provider.disconnect();
    } catch (err) {
      console.warn(err);
      console.log(`[error] disconnect: ${JSON.stringify(err)}`);
    }
  };

  const signAndExecuteTransaction = async () => {
    try {
      const transfer = await buildTransfer(rpcProvider, address, address, '100000');
      // const res: unknown = await provider.signAndExecuteTransactionBlock({
      //   transactionBlock: transfer,
      // });

      // console.log('[signAndExecuteTransaction]', res);
    } catch (err) {
      console.warn(err);
      console.log(`[error] signAndExecuteTransaction: ${JSON.stringify(err)}`);
    }
  };

  return (
    <div>
      <DAppList dapps={dapps} />
      {!provider && (
        <a target="_blank" href={'https://www.onekey.so/download/'}>
          Install OneKey Extension →
        </a>
      )}
      <main>
        {provider && connected ? (
          <>
            <div>
              <pre>
                Network:{' '}
                <select value={network} onChange={(e) => setNetwork(e.target.value)}>
                  <option value="TestNet">TestNet</option>
                  <option value="DevNet">DevNet</option>
                </select>
              </pre>
              <pre>Connected as: {address}</pre>
              <button onClick={requestSuiFromFaucet}>Faucet SUI</button>
            </div>

            <br />
            <button onClick={hasPermissions}>Has Permissions</button>
            <button onClick={requestPermissions}>Request Permissions</button>
            <button onClick={getAccounts}>Get Accounts</button>
            <button onClick={async () => await signAndExecuteTransaction()}>
              Sign & Execute Transaction
            </button>
            <button onClick={async () => await signAndExecuteTransaction()}>
              Sign & Execute Transaction (Bytes)
            </button>
            {/*<button onClick={executeMoveCall}>Execute MoveCall (DevNet Mint Nft)</button>*/}
            {/*<button onClick={executeSerializedMoveCall}>*/}
            {/*  Execute Serialized MoveCall (DevNet Mint Nft)*/}
            {/*</button>*/}
            <button onClick={() => disconnectWallet()}>Disconnect</button>

            <br />
            <br />
            <div style={{ border: '1px solid #cccccc', flexDirection: 'column' }}>
              <pre>
                {/*<button onClick={customExecuteMoveCall}>Custom Execute MoveCall</button>*/}
                {/*<button onClick={customExecuteSerializedMoveCall}>*/}
                {/*  Custom Execute Serialized MoveCall*/}
                {/*</button>*/}
              </pre>
              <textarea
                rows={12}
                cols={80}
                value={JSON.stringify(moveCall, null, 4)}
                onChange={(e) => {
                  try {
                    setMoveCall(JSON.parse(e.target.value) as MoveCallTransaction);
                  } catch (error) {
                    console.log('[input] Custom Execute MoveCall error');
                  }
                }}
              />
            </div>
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
