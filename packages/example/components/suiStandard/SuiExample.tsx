import React, { useCallback } from 'react';
import { useState, useEffect } from 'react';
import { hexToBytes } from '@noble/hashes/utils';
import { DAppList } from '../dappList/DAppList';
import { dapps } from './dapps.config';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { WalletKitProvider, ConnectButton, useWalletKit } from '@mysten/wallet-kit';

function DappTest() {
  const [network, setNetwork] = useState<string>('MainNet');
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
    signPersonalMessage,
  } = useWalletKit();

  useEffect(() => {
    const [address] = accounts || [];
    if (address) setAddress(address.address);
  }, [accounts]);

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

      const transfer = new TransactionBlock();
      transfer.setSender(address);
      const [coin] = transfer.splitCoins(transfer.gas, [transfer.pure(100000)]);
      transfer.transferObjects(
        [coin],
        transfer.pure('0xe40a5a0133cac4e9059f58f9d2074a3386d631390e40eadb43d2606e8975f3eb'),
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

      const transfer = new TransactionBlock();
      transfer.setSender(address);
      const [coin] = transfer.splitCoins(transfer.gas, [transfer.pure(100000)]);
      transfer.transferObjects(
        [coin],
        transfer.pure('0xe40a5a0133cac4e9059f58f9d2074a3386d631390e40eadb43d2606e8975f3eb'),
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

      console.log('[signMessage]', res);
    } catch (err) {
      console.warn(err);
      console.log(`[error] signMessage: ${JSON.stringify(err)}`);
    }
  };

  const signPersonalMessageAction = async () => {
    try {
      const res: unknown = await signPersonalMessage({
        message: hexToBytes('010203'),
        account: currentAccount,
      });

      console.log('[signPersonalMessage]', res);
    } catch (err) {
      console.warn(err);
      console.log(`[error] signPersonalMessage: ${JSON.stringify(err)}`);
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
          </div>

          <br />
          <button onClick={_getAccounts}>Get Accounts</button>
          <button onClick={async () => await signAndExecuteTransaction()}>
            Sign & Execute Transaction
          </button>
          <button onClick={async () => await signTransaction()}>Sign Transaction</button>
          <button onClick={async () => await signMessageAction()}>Sign Message</button>
          <button onClick={async () => await signPersonalMessageAction()}>
            Sign Personal Message
          </button>
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
