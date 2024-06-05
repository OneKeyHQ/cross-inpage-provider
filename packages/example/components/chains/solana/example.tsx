/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { dapps } from './dapps.config';
import ConnectButton from '../../../components/connect/ConnectButton';
import { useMemo, useRef } from 'react';
import { get, set } from 'lodash-es';
import { IProviderApi, IProviderInfo } from './types';
import { ApiPayload, ApiGroup } from '../../ApiActuator';
import { useWallet } from '../../../components/connect/WalletContext';
import type { IKnownWallet } from '../../../components/connect/types';
import DappList from '../../../components/DAppList';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import params from './params';
import { createTransferTransaction, createVersionedTransaction } from './builder';
import nacl from 'tweetnacl';
import { jsonToUint8Array } from '../../../lib/uint8array';
import { toast } from '../../ui/use-toast';

const NETWORK = clusterApiUrl('mainnet-beta');

export default function Example() {
  const walletsRef = useRef<IProviderInfo[]>([
    {
      uuid: 'injected',
      name: 'Injected Wallet',
      inject: 'solana',
    },
    {
      uuid: 'injected-onekey',
      name: 'Injected OneKey',
      inject: '$onekey.solana',
    },
    {
      uuid: 'injected-phantom',
      name: 'Injected Phantom',
      inject: 'phantom.solana',
    },
  ]);

  const { provider, account } = useWallet<IProviderApi>();
  const connection = useMemo(() => new Connection('https://node.onekey.so/sol'), []);

  const onConnectWallet = async (selectedWallet: IKnownWallet) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const providerDetail = walletsRef.current?.find((w) => w.uuid === selectedWallet.id);
    if (!providerDetail) {
      return Promise.reject('Wallet not found');
    }

    const provider = get(window, providerDetail.inject) as IProviderApi | undefined;

    if (!provider) {
      toast({
        title: 'Wallet not found',
        description: 'Please install the wallet extension',
      });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, no-unsafe-optional-chaining
    const { publicKey } = await provider?.connect();

    return {
      provider,
      publicKey: publicKey.toBase58(),
    };
  };

  const onDisconnectWallet = async () => {
    await provider?.disconnect();
  };

  return (
    <>
      <ConnectButton<IProviderApi>
        fetchWallets={() => {
          return Promise.resolve(
            walletsRef.current.map((wallet) => {
              return {
                id: wallet.uuid,
                name: wallet.name,
              };
            }),
          );
        }}
        onConnect={onConnectWallet}
        onDisconnect={onDisconnectWallet}
      />

      <ApiGroup title="Basics">
        <ApiPayload
          title="connect"
          description="连接钱包并获取公钥"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await provider?.connect();
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>
      <ApiGroup title="Sign Message">
        <ApiPayload
          title="signMessage"
          description="签名消息(存在风险，硬件无法使用)"
          presupposeParams={params.signMessage}
          onExecute={async (request: string) => {
            const res = await provider?.signMessage(Buffer.from(request, 'utf8'));
            return JSON.stringify(res);
          }}
          onValidate={(request: string, result: string) => {
            // const message = bs58.decode(request).toString();

            const {
              signature,
              publicKey,
            }: {
              signature: any;
              publicKey: string;
            } = JSON.parse(result);

            const signatureObj = jsonToUint8Array(signature);

            const publicKeyObj = new PublicKey(publicKey);
            const isValidSignature = nacl.sign.detached.verify(
              Buffer.from(request, 'utf8'),
              signatureObj,
              publicKeyObj.toBytes(),
            );

            return Promise.resolve(isValidSignature.toString());
          }}
        />
      </ApiGroup>
      <ApiGroup title="Transfer">
        <ApiPayload
          title="signAndSendTransaction"
          description="签署并发送交易"
          presupposeParams={params.signAndSendTransaction(account?.publicKey)}
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
              new PublicKey(account?.publicKey),
              toPubkey,
              recentBlockhash,
              amount,
            );

            const res = await provider?.signAndSendTransaction(transafe);
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="signTransaction"
          description="签署交易"
          presupposeParams={params.signAndSendTransaction(account?.publicKey)}
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
              new PublicKey(account?.publicKey),
              toPubkey,
              recentBlockhash,
              amount,
            );
            const res = await provider?.signTransaction(transafe);
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="signTransaction (Versioned)"
          description="签署 Versioned 交易"
          presupposeParams={params.signAndSendTransaction(account?.publicKey)}
          onExecute={async (request: string) => {
            const {
              toPubkey,
              amount,
            }: {
              toPubkey: string;
              amount: number;
            } = JSON.parse(request);
            const recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

            const transafe = createVersionedTransaction(
              new PublicKey(account?.publicKey),
              toPubkey,
              recentBlockhash,
              amount,
            );
            const res = await provider?.signTransaction(transafe);
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="signAllTransactions"
          description="签署多个交易"
          presupposeParams={params.signMultipleTransaction(account?.publicKey)}
          onExecute={async (request: string) => {
            const params: {
              toPubkey: string;
              amount: number;
            }[] = JSON.parse(request);
            const recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

            const trans = params.map((param) => {
              return createTransferTransaction(
                new PublicKey(account?.publicKey),
                param.toPubkey,
                recentBlockhash,
                param.amount,
              );
            });

            const res = await provider?.signAllTransactions(trans);
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>

      <DappList dapps={dapps} />
    </>
  );
}
