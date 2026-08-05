/* eslint-disable no-unsafe-optional-chaining */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
require('@solana/wallet-adapter-react-ui/styles.css');
import { dapps } from './dapps.config';
import { useEffect, useMemo } from 'react';
import { ApiPayload, ApiGroup } from '../../ApiActuator';
import { useWallet } from '../../../components/connect/WalletContext';
import DappList from '../../../components/DAppList';
import params from '../solana/params';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useConnection, useWallet as useSolWallet } from '@solana/wallet-adapter-react';
import InfoLayout from '../../../components/InfoLayout';
import { createTransferTransaction, createVersionedLegacyTransaction, createVersionedTransaction, hasVersionedTx } from '../solana/builder';
import { verifySignIn } from '@solana/wallet-standard-util';
import nacl from 'tweetnacl';
import { Transaction, VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';

import { OffchainMessage } from './OffchainMessage';
import {
  encodeOffchainMessageV1WithReference,
  readSignersFromSignedMessage,
} from './verifyOffchainMessageV1';
import { getApiKey } from '../../../lib/api';

function Example() {
  const { setProvider } = useWallet();

  const { connection } = useConnection();
  const {
    connected,
    publicKey,
    wallet,
    disconnect,
    signMessage,
    signTransaction,
    signAllTransactions,
    sendTransaction,
    signIn,
  } = useSolWallet();

  useEffect(() => {
    if (connected) {
      setProvider(true);
    } else {
      setProvider(false);
    }
  }, [connected, setProvider]);

  useEffect(() => {
    // @ts-expect-error
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    wallet?.adapter?.wallet?.features?.['standard:events']?.on('connect', (e: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      console.log('sol connect event', e);
    });
    // @ts-expect-error
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    wallet?.adapter?.wallet?.features?.['standard:events']?.on('disconnect', (e) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      console.log('sol disconnect event', e);
    });
    // @ts-expect-error
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    wallet?.adapter?.wallet?.features?.['standard:events']?.on('accountChanged', (e) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      console.log('sol accountChanged event', e);
    });
    // @ts-expect-error
  }, [wallet?.adapter?.wallet]);

  return (
    <>
      <WalletMultiButton />

      <InfoLayout title="Base Info">
        {publicKey && <p>PublicKey: {publicKey.toBase58()}</p>}
        {wallet?.adapter && <p>Wallet Name: {wallet?.adapter?.name}</p>}
        {/* {wallet?.adapter && (
          <p>Wallet Name: {wallet?.adapter?.wallet?.features}</p>
        )} */}
        {wallet?.adapter && (
          // @ts-expect-error
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
          <p>Wallet Api Version: {wallet?.adapter?.wallet?.version?.toString()}</p>
        )}
        {wallet?.adapter && (
          // @ts-expect-error
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
          <p>Accounts: {JSON.stringify(wallet?.adapter?.wallet?.accounts ?? [])}</p>
        )}
        {wallet?.adapter && (
          // @ts-expect-error
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
          <p>Support chains: {JSON.stringify(wallet?.adapter?.wallet?.chains ?? [])}</p>
        )}
        {wallet?.adapter && (
          <p>
            Wallet Icon: <img src={wallet?.adapter.icon} />
          </p>
        )}
      </InfoLayout>

      <ApiGroup title="Basic Info">
        <ApiPayload
          title="disconnect"
          description="断开链接"
          disableRequestContent
          onExecute={async () => {
            const res = await disconnect();
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>
      <ApiGroup title="Sign Message">
        <ApiPayload
          title="signMessage"
          description="签名消息"
          presupposeParams={params.signMessage}
          onExecute={async (request: string) => {
            return await signMessage(Buffer.from(request, 'utf8'));
          }}
          onValidate={(request: string, result: string) => {
            const signatureObj = new Uint8Array(JSON.parse(result));
            const isValidSignature = nacl.sign.detached.verify(
              Buffer.from(request, 'utf8'),
              signatureObj,
              publicKey.toBytes(),
            );

            if (isValidSignature) {
              return Promise.resolve('Phantom: true (软件钱包标准)');
            } else {
              const offchainMessage = new OffchainMessage({
                message: Buffer.from(request, 'utf8'),
              });
              const isValidSignature = nacl.sign.detached.verify(
                offchainMessage.serialize(),
                signatureObj,
                publicKey.toBytes(),
              );
              if (isValidSignature) {
                return Promise.resolve('OffchainMessage: true (Ledger 硬件钱包标准)');
              }
            }

            return Promise.resolve('false');
          }}
        />
        <ApiPayload
          title="signOffchainMessage"
          description="solana:signOffchainMessage (Offchain Message v1)。预设覆盖正文形态与签名者列表两个维度"
          presupposeParams={params.signOffchainMessageV1(publicKey?.toBase58() ?? '')}
          onExecute={async (request: string) => {
            const { message, requiredSigners } = JSON.parse(request) as {
              message: string;
              requiredSigners: string[];
            };

            // wallet-adapter 尚未透出该 feature，直接从 wallet-standard 的 features 上取
            const feature =
              // @ts-expect-error wallet-standard features are untyped here
              wallet?.adapter?.wallet?.features?.['solana:signOffchainMessage'];
            if (!feature) {
              throw new Error('wallet does not support solana:signOffchainMessage');
            }
            if (!feature.supportedMessageVersions?.includes(1)) {
              throw new Error('wallet does not support offchain message version 1');
            }

            // @ts-expect-error wallet-standard accounts are untyped here
            const account = wallet?.adapter?.wallet?.accounts?.[0];
            const [output] = await feature.signOffchainMessage({
              account,
              messageVersion: 1,
              message,
              requiredSigners: requiredSigners.map((s) => bs58.decode(s)),
            });

            return JSON.stringify({
              signature: Array.from(output.signature),
              signedOffchainMessage: Array.from(output.signedOffchainMessage),
              signatureType: output.signatureType ?? 'ed25519',
            });
          }}
          onValidate={(request: string, result: string) => {
            const { message, requiredSigners } = JSON.parse(request) as {
              message: string;
              requiredSigners: string[];
            };
            const output = JSON.parse(result);
            const signature = new Uint8Array(output.signature);
            const signedBytes = new Uint8Array(output.signedOffchainMessage);

            // 用官方 codec 重建 —— 独立于钱包侧的编码实现
            const expected = encodeOffchainMessageV1WithReference({
              message,
              requiredSigners,
            });
            const matchesSpec =
              signedBytes.length === expected.length &&
              signedBytes.every((byte, i) => byte === expected[i]);

            // 直接从两边字节里读回签名者顺序比较，不经过任何编码器
            const walletSigners = readSignersFromSignedMessage(signedBytes);
            const referenceSigners = readSignersFromSignedMessage(expected);
            const walletSortedSigners =
              walletSigners.length === referenceSigners.length &&
              walletSigners.every((s, i) => s === referenceSigners[i]);

            const signatureValid = nacl.sign.detached.verify(
              signedBytes,
              signature,
              publicKey.toBytes(),
            );

            return Promise.resolve(
              JSON.stringify({
                signatureValid,
                matchesOffchainMessageV1Spec: matchesSpec,
                walletSortedSigners,
                signerCount: signedBytes[17],
                walletSigners,
              }),
            );
          }}
        />
        <ApiPayload
          title="signIn"
          description="(暂不支持) Sign In With Solana EIP-4361"
          onGenerateRequest={() => {
            const now: Date = new Date();
            const currentDateTime = now.toISOString();

            const uri = window.location.href;
            const currentUrl = new URL(uri);
            const domain = currentUrl.host;

            return Promise.resolve(
              JSON.stringify({
                domain: domain,
                statement: 'Approve this wallet is owned by you.',
                version: '1',
                nonce: 'oBbLoEldZs',
                chainId: 'solana:mainnet',
                issuedAt: currentDateTime,
                resources: ['https://onekey.so'],
              }),
            );
          }}
          onExecute={async (request: string) => {
            const signInData = JSON.parse(request);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const res = await signIn(signInData);
            return JSON.stringify(res);
          }}
          onValidate={async (request: string, result: string) => {
            const backendInput = JSON.parse(request);
            const output = JSON.parse(result);

            const backendOutput = {
              account: {
                publicKey: publicKey.toBuffer(),
              },
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              signature: new Uint8Array(Buffer.from(output.signature.data)),
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              signedMessage: new Uint8Array(Buffer.from(output.signedMessage.data)),
            };

            // @ts-expect-error
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const res = verifySignIn(backendInput, backendOutput);
            return Promise.resolve(res.toString());
          }}
        />
      </ApiGroup>
      <ApiGroup title="Transfer">
        <ApiPayload
          title="signAndSendTransaction"
          description="签署并发送交易"
          presupposeParams={params.signAndSendTransaction(publicKey?.toBase58() || '')}
          onExecute={async (request: string) => {
            const {
              toPubkey,
              amount,
            }: {
              toPubkey: string;
              amount: number;
            } = JSON.parse(request);
            const recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

            const transafe = createTransferTransaction(
              publicKey,
              toPubkey,
              recentBlockhash,
              amount,
            );
            const res = await sendTransaction(transafe, connection);
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="signTransaction"
          description="签署交易"
          presupposeParams={params.signAndSendTransaction(publicKey?.toBase58() || '')}
          onExecute={async (request: string) => {
            const {
              toPubkey,
              amount,
            }: {
              toPubkey: string;
              amount: number;
            } = JSON.parse(request);
            const recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

            const transafe = createTransferTransaction(
              publicKey,
              toPubkey,
              recentBlockhash,
              amount,
            );
            const res = await signTransaction(transafe);
            if(hasVersionedTx(res)) {
              return 'error: Tx is VersionedTransaction';
            }
            return Buffer.from(res.serialize()).toString('hex');
          }}
          onValidate={async (request: string, result: string) => {
            const tx = Transaction.from(Buffer.from(result, 'hex'));
            const verified = tx.verifySignatures();

            const res = await connection.simulateTransaction(tx);
            return {
              success: res.value.err === null,
              verified,
              tryRun: res,
              tx,
            };
          }}
        />
        <ApiPayload
          title="signTransaction (Versioned)"
          description="签署 Versioned 交易"
          presupposeParams={params.signAndSendTransaction(publicKey?.toBase58())}
          onExecute={async (request: string) => {
            const {
              toPubkey,
              amount,
            }: {
              toPubkey: string;
              amount: number;
            } = JSON.parse(request);
            const recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

            const transfer = createVersionedTransaction(
              publicKey,
              toPubkey,
              recentBlockhash,
              amount,
            );
            const res = await signTransaction(transfer);
            if(!hasVersionedTx(res)) {
              return 'error: Tx is legacy Transaction';
            }
            return Buffer.from(res.serialize()).toString('hex');
          }}
          onValidate={async (request: string, result: string) => {
            const tx = VersionedTransaction.deserialize(Buffer.from(result, 'hex'));

            const res = await connection.simulateTransaction(tx);
            return {
              success: res.value.err === null,
              tryRun: res,
              tx,
            };
          }}
        />
        <ApiPayload
          title="signTransaction (Versioned legacy)"
          description="签署 Versioned legacy 交易, legacy 旧版本交易，但是返回值是 Versioned 的 Tx"
          presupposeParams={params.signAndSendTransaction(publicKey?.toBase58())}
          onExecute={async (request: string) => {
            const {
              toPubkey,
              amount,
            }: {
              toPubkey: string;
              amount: number;
            } = JSON.parse(request);
            const recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

            const transfer = createVersionedLegacyTransaction(
              publicKey,
              toPubkey,
              recentBlockhash,
              amount,
            );
            console.log('transfer', transfer);
            const res = await signTransaction(transfer);
            console.log('res', res);
            if(!hasVersionedTx(res)) {
              return 'error:Tx is legacy Transaction';
            }
            return Buffer.from(res.serialize()).toString('hex');
          }}
          onValidate={async (request: string, result: string) => {
            const tx = VersionedTransaction.deserialize(Buffer.from(result, 'hex'));

            const res = await connection.simulateTransaction(tx);
            return {
              success: res.value.err === null,
              tryRun: res,
              tx,
            };
          }}
        />
        {/* <ApiPayload
          title="signTransaction Raw Tx"
          description="签署 Raw Tx 交易"
          presupposeParams={params.signRawTransaction}
          onExecute={async (request: string) => {
            const { message } = JSON.parse(request);
            const txByte = base58.decode(message);
            let tx
            try {
              tx = Transaction.from(txByte);
            } catch (e) {
              tx = VersionedTransaction.deserialize(txByte);
            }

            const res = await signTransaction(tx);
            return res;
          }}
        /> */}
        <ApiPayload
          title="signAllTransactions"
          description="签署多个交易"
          presupposeParams={params.signMultipleTransaction(publicKey?.toBase58() || '')}
          onExecute={async (request: string) => {
            const params: {
              toPubkey: string;
              amount: number;
            }[] = JSON.parse(request);
            const recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

            const trans = params.map((param) => {
              return createTransferTransaction(
                publicKey,
                param.toPubkey,
                recentBlockhash,
                param.amount,
              );
            });
            const res = await signAllTransactions(trans);
            return res.map((r) => Buffer.from(r.serialize()).toString('hex'));
          }}
          onValidate={async (request: string, result: string) => {
            const txArray = JSON.parse(result) as string[];
            const txs = txArray.map((r) => Transaction.from(Buffer.from(r, 'hex')));
            const verifiedResult = [];
            for (const tx of txs) {
              const verified = tx.verifySignatures();
              const res = await connection.simulateTransaction(tx);
              verifiedResult.push({
                success: res.value.err === null,
                verified,
                tryRun: res,
              });
            }
            return verifiedResult;
          }}
        />
      </ApiGroup>

      <DappList dapps={dapps} />
    </>
  );
}

export default function App() {
  const network = WalletAdapterNetwork.Mainnet;

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => `https://go.getblock.io/${getApiKey("DEwWFkUCHktXRF8YWw1QCQQcEgQWTE1QDlgKRRVDRw8=")}`, []);

  const wallets = useMemo(
    () => [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [network],
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect localStorageKey="onekey_sol_dapp_example">
        <WalletModalProvider>
          <Example />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
