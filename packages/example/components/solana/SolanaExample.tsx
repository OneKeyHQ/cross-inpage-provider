import React from 'react';
import { useState, useEffect, useMemo } from 'react';
import {
  Connection,
  PublicKey,
  Transaction,
  clusterApiUrl,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { ProviderSolana } from '@onekeyfe/onekey-solana-provider';
import nacl from 'tweetnacl';

// import { CustomBridge } from './bridge';
import base58 from 'bs58';

import { DAppList } from '../dappList/DAppList';
import { dapps } from './dapps.config';

const NETWORK = clusterApiUrl('devnet');

const Receiver = new PublicKey('8yAmEoio2d7DszNucNzKf4AqW2JfGRJ1z5Nu9czdrgc1');
const LastBlockHash = 'GLXLbuzf788BVk738RKcgNWftzGHwjzXzVPAxFDt8naQ';

declare global {
  interface Window {
    _solana: ProviderSolana;
  }
}

const useProvider = () => {
  const [provider, setProvider] = useState<ProviderSolana>();

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const injectedProvider = (window.solana || window.phantom?.solana) as ProviderSolana;
    const solanaProvider =
      injectedProvider ||
      new ProviderSolana({
        // use mock api provider bridge for development
        // bridge: new CustomBridge(),
      });
    window._solana = solanaProvider;
    setProvider(solanaProvider);

    // setProvider(window.solana); // use injected solana for testing
  }, []);

  return provider;
};

export default function App() {
  const provider = useProvider();

  const connection = useMemo(() => new Connection(NETWORK), []);

  const [, setConnected] = useState<boolean>(false);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);

  useEffect(() => {
    if (!provider) return;
    // try to eagerly connect
    provider.connect({ onlyIfTrusted: true }).catch((err) => {
      err;
      // fail silently
    });
    provider.on('connect', (publicKey: PublicKey) => {
      setPublicKey(publicKey);
      setConnected(true);
      console.log(`solana [connect] ${publicKey.toBase58()}`);
    });
    provider.on('disconnect', () => {
      setPublicKey(null);
      setConnected(false);
      console.log('solana [disconnect] 👋');
    });
    provider.on('accountChanged', (publicKey: PublicKey | null) => {
      setPublicKey(publicKey);
      if (publicKey) {
        console.log(`solana [accountChanged] Switched account to ${publicKey?.toBase58()}`);
      } else {
        console.log('solana [accountChanged] Switched unknown account');
        // In this case, dapps could not to anything, or,
        // Only re-connecting to the new account if it is trusted
        // provider.connect({ onlyIfTrusted: true }).catch((err) => {
        //   // fail silently
        // });
        // Or, always trying to reconnect
        provider
          .connect()
          .then(() => console.log('[accountChanged] Reconnected successfully'))
          .catch((err: Error) => {
            console.log(`solana [accountChanged] Failed to re-connect: ${err.message}`);
          });
      }
    });
    return () => {
      void provider.disconnect();
    };
  }, [provider]);

  if (!provider) {
    return <h2>Could not find a provider</h2>;
  }

  const connectWallet = async () => {
    try {
      await provider.connect();
    } catch (err) {
      console.warn(err);
      console.log(`[error] connect: ${JSON.stringify(err)}`);
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

  const createTransferTransaction = () => {
    if (!provider.publicKey) return;

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: provider.publicKey,
        toPubkey: Receiver,
        lamports: LAMPORTS_PER_SOL / 100,
      }),
    );
    transaction.feePayer = provider.publicKey;

    // console.log('Getting recent blockhash');
    // const { blockhash: lastBlockHash } = await connection.getLatestBlockhash();
    // console.log('LastBlockHash: ', lastBlockHash);
    transaction.recentBlockhash = LastBlockHash;
    return transaction;
  };

  const requestAirdrop = async () => {
    if (!provider.publicKey) return;
    console.log('Requesting airdrop');
    const airdropSignature = await connection.requestAirdrop(provider.publicKey, LAMPORTS_PER_SOL);
    console.log('Waiting for airdrop...');
    await connection.confirmTransaction(airdropSignature);
    console.log('Airdrop confirmed!');
  };

  const signAndSendTransaction = async () => {
    try {
      const transaction = createTransferTransaction();
      if (!transaction) return;

      const { signature } = await provider.signAndSendTransaction(transaction);

      console.log('Submitted transaction, signature: ', signature);
      console.log('Awaiting confirmation');
      const result = await connection.confirmTransaction(signature);
      console.log('Transaction confirmed: ', result);
    } catch (err) {
      console.warn(err);
      console.log(`[error] sendTransaction: ${JSON.stringify(err)}`);
    }
  };

  const signTransaction = async () => {
    try {
      const transaction = createTransferTransaction();
      if (!transaction) return;

      const signed = await provider.signTransaction(transaction);
      console.log('Signed transaction: ', base58.encode(signed.serialize()));
      console.info('Verify signature: ', signed.verifySignatures());

      // // Send Transaction
      // const signature = await connection.sendRawTransaction(signed.serialize());
      // console.log('Submitted transaction: ', signature);
      // console.log('Awaiting confirmation');
      // await connection.confirmTransaction(signature);
      // console.log('Transaction ' + signature + ' confirmed');
    } catch (err) {
      console.warn(err);
      console.log('[error] signTransaction: ', err);
    }
  };

  const signMultipleTransactions = async () => {
    try {
      const [transaction1, transaction2] = await Promise.all([
        createTransferTransaction(),
        createTransferTransaction(),
      ]);
      if (transaction1 && transaction2) {
        const txns = await provider.signAllTransactions([transaction1, transaction2]);
        console.log('signMultipleTransactions txns: ', txns);
        txns.forEach((tx) => console.info('Verify signature: ', tx.verifySignatures()));
      }
    } catch (err) {
      console.warn(err);
      console.log('[error] signMultipleTransactions: ', err);
    }
  };

  const signMessage = async () => {
    const message = 'Hello, world!';
    try {
      const data = new TextEncoder().encode(message);
      const res = await provider.signMessage(data, 'hex');
      if (!res.signature) return;
      console.log('Message signed: ', res);
      const verified = nacl.sign.detached.verify(data, res.signature, res.publicKey.toBytes());
      console.log(`Message verified: `, verified);
    } catch (err) {
      console.warn(err);
      console.log('[error] signMessage: ', err);
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
        {provider && publicKey ? (
          <>
            <div>
              <pre>Network: {NETWORK}</pre>
              <pre>Connected as: {publicKey.toBase58()}</pre>
            </div>
            <button onClick={requestAirdrop}>Request Airdrop</button>
            <button onClick={signAndSendTransaction}>Sign&Send Transaction</button>
            <button onClick={signTransaction}>Sign Transaction </button>
            <button onClick={signMultipleTransactions}>Sign All Transactions</button>
            <button onClick={signMessage}>Sign Message</button>
            <button onClick={() => disconnectWallet()}>Disconnect</button>
          </>
        ) : (
          <>
            <button onClick={() => connectWallet()}>Connect Wallet</button>
          </>
        )}
      </main>
      <a
        target={'_blank'}
        href="https://codesandbox.io/s/github/phantom-labs/sandbox?file=/src/App.tsx"
      >
        Go to official test Dapp →
      </a>
    </div>
  );
}
