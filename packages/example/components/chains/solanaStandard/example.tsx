/* eslint-disable no-unsafe-optional-chaining */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
import { createTransferTransaction, createVersionedTransaction } from '../solana/builder';
import { jsonToUint8Array } from '../../../lib/uint8array';
import { verifySignIn } from '@solana/wallet-standard-util';
import nacl from 'tweetnacl';

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
          <p>Wallet Api Version: {wallet?.adapter?.wallet?.version?.toString()}</p>
        )}
        {wallet?.adapter && (
          <p>Accounts: {JSON.stringify(wallet?.adapter?.wallet?.accounts ?? [])}</p>
        )}
        {wallet?.adapter && (
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
            const res = await signMessage(Buffer.from(request, 'utf8'));
            return JSON.stringify(res);
          }}
          onValidate={(request: string, result: string) => {
            const signatureObj = jsonToUint8Array(result);
            const isValidSignature = nacl.sign.detached.verify(
              Buffer.from(request, 'utf8'),
              signatureObj,
              publicKey.toBytes(),
            );

            return Promise.resolve(isValidSignature.toString());
          }}
        />
        <ApiPayload
          title="signIn"
          description="(不支持) Sign In With Solana EIP-4361"
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
            return JSON.stringify(res);
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
            return JSON.stringify(res);
          }}
        />
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
            return JSON.stringify(res);
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
  const endpoint = useMemo(() => 'https://node.onekey.so/sol', [network]);

  const wallets = useMemo(
    () => [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [network],
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Example />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
