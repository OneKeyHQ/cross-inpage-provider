import React, { useCallback } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { DAppList } from '../dappList/DAppList';
import { dapps } from './dapps.config';
import { JsonRpcProvider, Connection } from '@mysten/sui.js';
import { buildTransfer } from '../sui/utils';
import { WalletKitProvider, ConnectButton, useWalletKit } from '@mysten/wallet-kit';

function DappTest() {
  const [network, setNetwork] = useState<string>('TestNet');
  const [address, setAddress] = useState<string>();

  // eslint-disable-next-line @typescript-eslint/unbound-method
  const {
    isConnected,
    accounts,
    disconnect,
    currentAccount,
    signTransactionBlock,
    signAndExecuteTransactionBlock,
    signMessage,
  } = useWalletKit();

  useEffect(() => {
    const [address] = accounts || [];
    if (address) setAddress(address.address);
  }, [accounts]);

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
          fullnode: 'https://fullnode.mainnet.sui.io',
          faucet: 'https://faucet.testnet.sui.io/gas',
        }),
      );
    }
  }, [network]);

  const requestSuiFromFaucet = async () => {
    try {
      const [address] = accounts;
      const faucet = await rpcProvider.requestSuiFromFaucet(address.address);
      console.log('[requestSuiFromFaucet] faucet success:', faucet);
    } catch (err) {
      console.warn(err);
      console.log(`[error] requestSuiFromFaucet: ${JSON.stringify(err)}`);
    }
  };

  const _getAccounts = useCallback(() => {
    try {
      console.log('[getAccounts] accounts:', accounts);
    } catch (err) {
      console.warn(err);
      console.log(`[error] getAccounts: ${JSON.stringify(err)}`);
    }
  }, [accounts]);

  const disconnectWallet = async () => {
    try {
      await disconnect();
    } catch (err) {
      console.warn(err);
      console.log(`[error] disconnect: ${JSON.stringify(err)}`);
    }
  };

  const signAndExecuteTransaction = async () => {
    try {
      const address = accounts[0].address;
      const transfer = await buildTransfer(
        rpcProvider,
        address,
        '0xe40a5a0133cac4e9059f58f9d2074a3386d631390e40eadb43d2606e8975f3eb',
        '100000',
      );
      const res: unknown = await signAndExecuteTransactionBlock({
        transactionBlock: transfer,
        chain: network.toLowerCase() === 'sui:testnet' ? 'sui:testnet' : 'sui:mainnet',
        account: currentAccount,
      });

      console.log('[signAndExecuteTransaction]', res);
    } catch (err) {
      console.warn(err);
      console.log(`[error] signAndExecuteTransaction: ${JSON.stringify(err)}`);
    }
  };

  const signTransaction = async () => {
    try {
      const address = accounts[0].address;
      const transfer = await buildTransfer(
        rpcProvider,
        address,
        '0xe40a5a0133cac4e9059f58f9d2074a3386d631390e40eadb43d2606e8975f3eb',
        '100000',
      );
      const res: unknown = await signTransactionBlock({
        transactionBlock: transfer,
        chain: network.toLowerCase() === 'sui:testnet' ? 'sui:testnet' : 'sui:mainnet',
        account: currentAccount,
      });

      console.log('[signTransaction]', res);
    } catch (err) {
      console.warn(err);
      console.log(`[error] signTransaction: ${JSON.stringify(err)}`);
    }
  };

  const signMessageAction = async () => {
    try {
      const res: unknown = await signMessage({
        message: hexToBytes('010203'),
        account: currentAccount,
      });

      console.log('[signAndExecuteTransaction]', res);
    } catch (err) {
      console.warn(err);
      console.log(`[error] signAndExecuteTransaction: ${JSON.stringify(err)}`);
    }
  };

  return (
    <div>
      <DAppList dapps={dapps} />

      {isConnected && (
        <>
          <div>
            <pre>
              Network:{' '}
              <select value={network} onChange={(e) => setNetwork(e.target.value)}>
                <option value="TestNet">TestNet</option>
                <option value="MainNet">MainNet</option>
              </select>
            </pre>
            <pre>Connected as: {address}</pre>
            <button onClick={requestSuiFromFaucet}>Faucet SUI</button>
          </div>

          <br />
          <button onClick={_getAccounts}>Get Accounts</button>
          <button onClick={async () => await signAndExecuteTransaction()}>
            Sign & Execute Transaction
          </button>
          <button onClick={async () => await signTransaction()}>Sign Transaction</button>
          <button onClick={async () => await signMessageAction()}>Sign Message</button>
          <button onClick={() => disconnectWallet()}>Disconnect</button>
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <WalletKitProvider features={['sui:signTransactionBlock']} enableUnsafeBurner>
      <ConnectButton />
      <DappTest />
    </WalletKitProvider>
  );
}
