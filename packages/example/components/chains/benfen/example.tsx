/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable no-unsafe-optional-chaining */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { dapps } from './dapps.config';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ConnectButton from '../../../components/connect/ConnectButton';
import { hexToBytes, bytesToHex } from '@noble/hashes/utils';
import { useWallet } from '../../../components/connect/WalletContext';
import DappList from '../../../components/DAppList';
import params from './params';
import { getFullnodeUrl } from '@benfen/bfc.js/client';
import {
  useCurrentAccount,
  useSignTransactionBlock,
  useSignAndExecuteTransactionBlock,
  useSignPersonalMessage,
  useBenfenClient,
  useWallets,
  BenfenClientProvider,
  useDisconnectWallet,
  useConnectWallet,
  useCurrentWallet,
  WalletProvider,
  createNetworkConfig,
} from '@benfen/bfc.js/dapp-kit';
import InfoLayout from '../../../components/InfoLayout';
import { TransactionBlock } from '@benfen/bfc.js/transactions';
import {
  verifySignature,
  verifyPersonalMessage,
  verifyTransactionBlock,
} from '@benfen/bfc.js/verify';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSignMessage } from './useSignMessage';
import { ApiGroup, ApiPayload } from '../../ApiActuator';
import { sponsorTransaction } from './utils';
import { IKnownWallet } from '../../connect/types';
import { WalletWithRequiredFeatures } from '@benfen/bfc.js/dist/cjs/wallet-standard';

function Example() {
  const client = useBenfenClient();
  const { setProvider } = useWallet();

  const currentAccount = useCurrentAccount();
  const { isConnected } = useCurrentWallet();

  const { mutateAsync: signTransactionBlock } = useSignTransactionBlock();
  const { mutateAsync: signAndExecuteTransactionBlock } = useSignAndExecuteTransactionBlock();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
  const { mutateAsync: signMessage } = useSignMessage();

  console.log('currentAccount', currentAccount);

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

            return (
              bytesToHex(currentAccount.publicKey) === bytesToHex(publicKey.toRawBytes())
            ).toString();
          }}
        />

        <ApiPayload
          title="signPersonalMessage"
          description="签名消息（SDK 验证依赖网络可能会失败，可以刷新网页重试 或 稍后重试，问题上下文 https://github.com/MystenLabs/sui/issues/17912#issuecomment-2166621747）"
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

            return (
              bytesToHex(currentAccount.publicKey) === bytesToHex(publicKey.toRawBytes())
            ).toString();
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

            return (
              bytesToHex(currentAccount.publicKey) === bytesToHex(publicKey.toRawBytes())
            ).toString();
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

        <ApiPayload
          title="signTransactionBlock"
          description="签名交易 (特殊情况，带 clock、system 参数)"
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

            // @ts-expect-error
            tx.system = () => '0x5';
            // @ts-expect-error
            tx.clock = () => '0x6';
            // @ts-expect-error
            tx.random = () => '0x8';
            // @ts-expect-error
            tx.denyList = () => '0x403';

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

            return (
              bytesToHex(currentAccount.publicKey) === bytesToHex(publicKey.toRawBytes())
            ).toString();
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

function BenfenConnectButton() {
  const wallets = useWallets();
  const currentAccount = useCurrentAccount();
  const { currentWallet, connectionStatus, isConnected } = useCurrentWallet();

  const { mutateAsync: connect } = useConnectWallet();
  const { mutateAsync: disconnect } = useDisconnectWallet();

  const walletsRef = useRef<WalletWithRequiredFeatures[]>([]);
  walletsRef.current = wallets;
  console.log('Benfen Standard Wallets:', walletsRef.current);

  const onConnectWallet = useCallback(
    async (selectedWallet: IKnownWallet) => {
      const wallet = walletsRef.current.find((w) => w.name === selectedWallet.id);
      if (!wallet) {
        return Promise.reject('Wallet not found');
      }

      void connect({ wallet, accountAddress: currentAccount?.address });

      return {
        provider: undefined,
      };
    },
    [connect, currentAccount?.address],
  );

  return (
    <>
      <ConnectButton<any>
        fetchWallets={() => {
          return Promise.resolve(
            walletsRef.current.map((wallet) => {
              return {
                id: wallet.name,
                name: wallet.name,
              };
            }),
          );
        }}
        onConnect={onConnectWallet}
        onDisconnect={() => void disconnect()}
      />

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
        {currentWallet && (
          <p>Wallet Support Features: {JSON.stringify(currentWallet?.features ?? '', null, 2)}</p>
        )}
      </InfoLayout>
    </>
  );
}

export default function App() {
  const [activeNetwork, setActiveNetwork] = useState<'mainnet' | 'testnet'>('mainnet');

  return (
    <QueryClientProvider client={queryClient}>
      <BenfenClientProvider
        networks={networkConfig}
        network={activeNetwork}
        onNetworkChange={(network) => {
          setActiveNetwork(network);
        }}
      >
        <WalletProvider autoConnect>
          <BenfenConnectButton />
          <Example />
        </WalletProvider>
      </BenfenClientProvider>
    </QueryClientProvider>
  );
}
