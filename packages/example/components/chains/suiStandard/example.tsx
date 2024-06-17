/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable no-unsafe-optional-chaining */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { dapps } from './dapps.config';
import { useEffect, useMemo, useState } from 'react';
import { hexToBytes } from '@noble/hashes/utils';
import { useWallet } from '../../../components/connect/WalletContext';
import DappList from '../../../components/DAppList';
import params from './params';
import { getFullnodeUrl } from '@mysten/sui.js/client';
// import { WalletKitProvider, useWalletKit } from '@mysten/wallet-kit';
import {
  ConnectButton,
  useCurrentAccount,
  useSignTransactionBlock,
  useSignAndExecuteTransactionBlock,
  useSignPersonalMessage,
  useSuiClient,
  useWallets,
  useDisconnectWallet,
  useConnectWallet,
  useCurrentWallet,
  useAccounts,
  WalletProvider,
  SuiClientProvider,
  createNetworkConfig,
} from '@mysten/dapp-kit';
import InfoLayout from '../../../components/InfoLayout';
import { SuiObjectRef } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import {
  verifySignature,
  verifyPersonalMessage,
  verifyTransactionBlock,
} from '@mysten/sui.js/verify';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@mysten/dapp-kit/dist/index.css';
import { useSignMessage } from './useSignMessage';
import { ApiGroup, ApiPayload } from '../../ApiActuator';
import { sponsorTransaction } from './utils';

function Example() {
  const client = useSuiClient();
  const { setProvider } = useWallet();

  const accounts = useAccounts();
  const wallet = useConnectWallet();

  const currentAccount = useCurrentAccount();
  const { currentWallet, connectionStatus, isConnected } = useCurrentWallet();

  const { mutateAsync: connect } = useConnectWallet();
  const { mutateAsync: signTransactionBlock } = useSignTransactionBlock();
  const { mutateAsync: signAndExecuteTransactionBlock } = useSignAndExecuteTransactionBlock();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
  const { mutateAsync: signMessage } = useSignMessage();
  const { mutateAsync: disconnect } = useDisconnectWallet();

  useEffect(() => {
    if (isConnected && currentAccount) {
      setProvider(true);
    } else {
      setProvider(false);
    }
  }, [isConnected, currentAccount, setProvider]);

  const signTransactionPresupposeParams = useMemo(() => {
    return params.signTransaction(currentAccount?.address ?? '');
  }, [currentAccount?.address]);

  return (
    <>
      <InfoLayout title="Base Info">
        {currentAccount && <p>Account:{currentAccount?.address ?? ''}</p>}
        {currentAccount && <p>PubKey:{currentAccount?.publicKey ?? ''}</p>}
        {currentAccount && <p>ChainId:{currentAccount?.chains ?? ''}</p>}
        {currentWallet && <p>Wallet Name:{currentWallet?.name ?? ''}</p>}
        {currentWallet && <p>Wallet api version:{currentWallet?.version ?? ''}</p>}
        {currentWallet && (
          <p>Wallet Support Chains :{JSON.stringify(currentWallet?.chains ?? '')}</p>
        )}
        {currentWallet && (
          <p>
            Wallet Icon: <img src={currentWallet?.icon} />
          </p>
        )}
        {connectionStatus && <p>Status :{connectionStatus}</p>}
      </InfoLayout>

      <ApiGroup title="SignMessage">
        <ApiPayload
          title="signMessage"
          description="签名消息, signMessage 不安全已经弃用, 目前（OneKey、Suiet、Sui Wallet、Martian） signMessage 实际实现已经变成了 signPersonalMessage"
          presupposeParams={params.signMessage}
          onExecute={async (request: string) => {
            const res = await signMessage({
              message: hexToBytes(request),
              account: currentAccount,
            });
            return JSON.stringify(res);
          }}
          onValidate={async (request: string, result: string) => {
            const {
              bytes,
              signature,
            }: {
              bytes: string;
              signature: string;
            } = JSON.parse(result);

            // const publicKey = await verifySignature(hexToBytes(request), signature);
            const publicKey = await verifyPersonalMessage(Buffer.from(bytes, 'base64'), signature);

            return (currentAccount.address === publicKey.toSuiAddress()).toString();
          }}
        />

        <ApiPayload
          title="signPersonalMessage"
          description="签名消息"
          presupposeParams={params.signPersonalMessage}
          onExecute={async (request: string) => {
            const res = await signPersonalMessage({
              message: hexToBytes(request),
              account: currentAccount,
            });
            return JSON.stringify(res);
          }}
          onValidate={async (request: string, result: string) => {
            const {
              bytes,
              signature,
            }: {
              bytes: string;
              signature: string;
            } = JSON.parse(result);

            const publicKey = await verifyPersonalMessage(Buffer.from(bytes, 'base64'), signature);

            return (currentAccount.address === publicKey.toSuiAddress()).toString();
          }}
        />
      </ApiGroup>
      <ApiGroup title="Transaction">
        <ApiPayload
          title="signTransactionBlock"
          description="签名交易"
          presupposeParams={signTransactionPresupposeParams}
          onExecute={async (request: string) => {
            const {
              from,
              to,
              amount,
            }: {
              from: string;
              to: string;
              amount: number;
            } = JSON.parse(request);

            const transfer = new TransactionBlock();
            const [coin] = transfer.splitCoins(transfer.gas, [transfer.pure(amount)]);
            transfer.transferObjects([coin], transfer.pure(to));

            const tx = await sponsorTransaction(
              client,
              from,
              await transfer.build({
                client,
                onlyTransactionKind: true,
              }),
            );

            const res: unknown = await signTransactionBlock({
              transactionBlock: tx,
              account: currentAccount,
            });
            return JSON.stringify(res);
          }}
          onValidate={async (request: string, result: string) => {
            const {
              transactionBlockBytes,
              signature,
            }: {
              transactionBlockBytes: string;
              signature: string;
            } = JSON.parse(result);
            const publicKey = await verifyTransactionBlock(
              Buffer.from(transactionBlockBytes, 'base64'),
              signature,
            );

            return (currentAccount.address === publicKey.toSuiAddress()).toString();
          }}
        />

        <ApiPayload
          title="signAndExecuteTransactionBlock"
          description="签名并执行交易"
          presupposeParams={signTransactionPresupposeParams}
          onExecute={async (request: string) => {
            const {
              from,
              to,
              amount,
            }: {
              from: string;
              to: string;
              amount: number;
            } = JSON.parse(request);

            const transfer = new TransactionBlock();
            transfer.setSender(from);
            const [coin] = transfer.splitCoins(transfer.gas, [transfer.pure(amount)]);
            transfer.transferObjects([coin], transfer.pure(to));

            const tx = await sponsorTransaction(
              client,
              from,
              await transfer.build({
                client,
                onlyTransactionKind: true,
              }),
            );

            const res: unknown = await signAndExecuteTransactionBlock({
              transactionBlock: tx,
              account: currentAccount,
            });
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>

      <DappList dapps={dapps} />
    </>
  );
}

const queryClient = new QueryClient();

const { networkConfig } = createNetworkConfig({
  testnet: { url: getFullnodeUrl('testnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
});

export default function App() {
  const [activeNetwork, setActiveNetwork] = useState('mainnet');

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider
        networks={networkConfig}
        // @ts-expect-error
        network={activeNetwork}
        onNetworkChange={(network) => {
          setActiveNetwork(network);
        }}
      >
        <WalletProvider enableUnsafeBurner>
          <ConnectButton />
          <Example />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
