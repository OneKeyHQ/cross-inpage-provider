/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React from 'react';
import { useState, useEffect, useRef } from 'react';
import WalletConnect from '@walletconnect/client';
import QRCodeModal from '@walletconnect/qrcode-modal';
import { IInternalEvent } from '@walletconnect/types';

import { DAppList } from '../dappList/DAppList';
import { dapps } from '../aptos/dapps.config';

type NetworkType = 'aptos' | 'ethereum';

interface IAppState {
  network: NetworkType;
  connector: WalletConnect | null;
  connected: boolean;
  chainId: number;
  accounts: string[];
  address: string | null;
}

const INITIAL_STATE: IAppState = {
  network: 'aptos',
  connector: null,
  connected: false,
  chainId: 1,
  accounts: [],
  address: null,
};

export default function App() {
  const [network] = useState<string>(INITIAL_STATE.network);
  const connectorRef = useRef<WalletConnect | null>(INITIAL_STATE.connector);
  const [connected, setConnected] = useState<boolean>(INITIAL_STATE.connected);
  const [account, setAccount] = useState<{
    address: string;
    accounts: string[];
    chainId: number;
  }>({
    address: INITIAL_STATE.address,
    accounts: INITIAL_STATE.accounts,
    chainId: INITIAL_STATE.chainId,
  });

  const onSessionUpdate = (accounts: string[], chainId: number) => {
    const address = accounts[0];
    setAccount({ chainId, accounts, address });
  };

  const onConnect = (payload: IInternalEvent) => {
    const { chainId, accounts } = payload.params[0];
    const address = accounts[0];
    setConnected(true);
    setAccount({ chainId, accounts, address });
  };

  const resetApp = () => {
    connectorRef.current = null;
    setConnected(false);
    setAccount({
      address: INITIAL_STATE.address,
      accounts: INITIAL_STATE.accounts,
      chainId: INITIAL_STATE.chainId,
    });
  };

  const onDisconnect = () => {
    resetApp();
  };

  const subscribeToEvents = () => {
    if (!connectorRef.current) {
      return;
    }

    connectorRef.current.on('session_update', (error, payload) => {
      console.log(`aptos connector.on("session_update")`, payload);

      if (error) {
        throw error;
      }

      const {
        chainId,
        accounts,
      }: {
        chainId: number;
        accounts: string[];
      } = payload.params[0];
      onSessionUpdate(accounts, chainId);
    });

    connectorRef.current.on('connect', (error, payload) => {
      console.log(`connector.on("connect")`);

      if (error) {
        throw error;
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      onConnect(payload);
    });

    connectorRef.current.on('disconnect', (error, payload) => {
      console.log(`connector.on("disconnect")`);

      if (error) {
        throw error;
      }

      onDisconnect();
    });

    if (connectorRef.current.connected) {
      const { chainId, accounts } = connectorRef.current;
      const address = accounts[0];
      setConnected(true);
      setAccount({ chainId, accounts, address });
      onSessionUpdate(accounts, chainId);
    }
  };

  const connectWallet = async () => {
    // bridge url
    const bridge = 'https://bridge.walletconnect.org';

    // create new connector
    connectorRef.current = new WalletConnect({
      storageId: 'walletconnect_aptos',
      bridge,
      qrcodeModal: QRCodeModal,
    });

    // check if already connected
    if (!connectorRef.current.connected) {
      // create new session
      await connectorRef.current.createSession({
        network: network,
      });
    }

    // subscribe to events
    subscribeToEvents();
  };

  const killSession = async () => {
    if (connectorRef.current) {
      await connectorRef.current.killSession();
    }
    resetApp();
  };

  const disconnectWallet = async () => {
    try {
      await killSession();
    } catch (err) {
      console.warn(err);
      console.log(`[error] disconnect: ${JSON.stringify(err)}`);
    }
  };

  const customRequest = async (method: string, ...params: any) => {
    if (connectorRef.current === null) {
      return;
    }

    try {
      // sign typed data
      const result = await connectorRef.current.sendCustomRequest({ method, params });

      const resultJson = JSON.stringify(result);

      // display result
      console.log(`[${method}]`, resultJson);
    } catch (error) {
      console.error(error);
    }
  };

  const signAndSubmitTransaction = async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    await customRequest('signAndSubmitTransaction', {
      arguments: [account.address, '100000'],
      function: '0x1::coin::transfer',
      type: 'entry_function_payload',
      type_arguments: ['0x1::aptos_coin::AptosCoin'],
    });
  };

  const signTransaction = async () => {
    await customRequest('signTransaction', {
      arguments: [account.address, '100000'],
      function: '0x1::coin::transfer',
      type: 'entry_function_payload',
      type_arguments: ['0x1::aptos_coin::AptosCoin'],
    });
  };

  const signMessage = async () => {
    await customRequest('signMessage', {
      address: false,
      application: true,
      chainId: true,
      message: 'This is a sample message',
      nonce: 12345,
    });
  };

  const signGenericTransaction = async () => {
    await customRequest('signGenericTransaction', {
      args: [account.address, '100000'],
      func: '0x1::coin::transfer',
      type_args: ['0x1::aptos_coin::AptosCoin'],
    });
  };

  return (
    <div>
      <DAppList dapps={dapps} />
      <main>
        {connected ? (
          <>
            <div>
              <pre>Network: {network}</pre>
              <pre>Connected as: {account.address}</pre>
            </div>
            <button onClick={() => customRequest('network')}>Network</button>
            <button onClick={() => customRequest('getChainId')}>getChainId</button>
            <button onClick={signAndSubmitTransaction}>Sign&Send Transaction</button>
            <button onClick={signTransaction}>Sign Transaction </button>
            <button onClick={signMessage}>Sign Message</button>
            <button onClick={signGenericTransaction}>Sign Generic Transaction</button>
            <button onClick={() => disconnectWallet()}>Disconnect</button>
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
