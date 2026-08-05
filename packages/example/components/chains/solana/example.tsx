/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
import { dapps } from './dapps.config';
import ConnectButton from '../../connect/ConnectButton';
import { useEffect, useMemo, useRef } from 'react';
import { get, set } from 'lodash-es';
import { IProviderApi, IProviderInfo } from './types';
import { ApiPayload, ApiGroup } from '../../ApiActuator';
import { useWallet } from '../../connect/WalletContext';
import type { IKnownWallet } from '../../connect/types';
import DappList from '../../DAppList';
import { Connection, PublicKey, Transaction, VersionedTransaction, clusterApiUrl } from '@solana/web3.js';
import params from './params';
import { createTransferTransaction, createVersionedTransaction, createTokenTransferTransaction, hasVersionedTx, createVersionedLegacyTransaction } from './builder';
import nacl from 'tweetnacl';
import { toast } from '../../ui/use-toast';
import { serializeOffchainMessageV1 } from '../solanaStandard/OffchainMessageV1';
import { getApiKey } from '../../../lib/api';

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

  const { provider, setAccount, account } = useWallet<IProviderApi>();
  const connection = useMemo(() => new Connection(`https://go.getblock.io/${getApiKey("DEwWFkUCHktXRF8YWw1QCQQcEgQWTE1QDlgKRRVDRw8=")}`), []);

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

  useEffect(() => {
    if (!provider) return;

    const onConnectListener = (publicKey: PublicKey) => {
      console.log(`solana [connect] ${publicKey.toBase58()}`);
      setAccount({
        ...account,
        publicKey: publicKey.toBase58(),
      });
    };
    const onDisconnectListener = () => {
      console.log('solana [disconnect] 👋');
    };
    const onAccountChangeListener = (publicKey: PublicKey | null) => {
      if (publicKey) {
        console.log(`solana [accountChanged] Switched account to ${publicKey?.toBase58()}`);
        setAccount({
          ...account,
          publicKey: publicKey.toBase58(),
        });
      } else {
        console.log('solana [accountChanged] Switched unknown account');
      }
    };

    provider.on('connect', onConnectListener);
    provider.on('disconnect', onDisconnectListener);
    provider.on('accountChanged', onAccountChangeListener);
    return () => {
      provider.removeListener('connect', onConnectListener);
      provider.removeListener('disconnect', onDisconnectListener);
      provider.removeListener('accountChanged', onAccountChangeListener);
    };
  }, [account, provider, setAccount]);

  console.log('createTokenTransferTransaction exists:', typeof createTokenTransferTransaction);

  const transactionStatus = {
    status: 'pending',
    message: `
      交易尚未在本地确认
      
      这是正常的，因为交易刚刚被广播到网络
      
      交易需要等待网络确认，这个过程需要一些时间
      
      请等待区块确认...
    `
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
            return await provider?.signMessage(Buffer.from(request, 'utf8'));
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

            let signatureObj;
            if(Array.isArray(signature)) {
              signatureObj = new Uint8Array(signature)
            } else {
              signatureObj = new Uint8Array(signature.data)
            }
            const publicKeyObj = new PublicKey(publicKey);
            const isValidSignature = nacl.sign.detached.verify(
              Buffer.from(request, 'utf8'),
              signatureObj,
              publicKeyObj.toBytes(),
            );

            return Promise.resolve(isValidSignature.toString());
          }}
        />
          <ApiPayload
          title="solSignOffchainMessage"
          description="签名 Offchain Message v1 (OneKey 私有方法)"
          presupposeParams={params.signMessage}
          onExecute={async (request: string) => {
            // v1 只签 UTF-8 原文，preamble 由钱包构造
            return await provider?.solSignOffchainMessage(request, [account?.publicKey]);
          }}
          onValidate={(request: string, result: string) => {
            const {
              signature,
              publicKey,
              signedOffchainMessage,
            }: {
              signature: any;
              publicKey: string;
              signedOffchainMessage: any;
            } = JSON.parse(result);

            const toBytes = (value: any) =>
              new Uint8Array(Array.isArray(value) ? value : value.data);

            const signatureObj = toBytes(signature);
            const signedBytes = toBytes(signedOffchainMessage);

            // 用 dApp 请求时指定的账户重建，而不是钱包回传的那个 ——
            // 否则钱包换个账户签，下面两项检查会一起变绿，等于没检查
            const requestedKey = new PublicKey(account?.publicKey);
            const signedWithRequestedAccount =
              new PublicKey(publicKey).toBase58() === requestedKey.toBase58();

            const expected = serializeOffchainMessageV1({
              message: request,
              requiredSigners: [requestedKey.toBytes()],
            });
            const matchesSpec =
              signedBytes.length === expected.length &&
              signedBytes.every((byte, i) => byte === expected[i]);

            const isValidSignature = nacl.sign.detached.verify(
              signedBytes,
              signatureObj,
              requestedKey.toBytes(),
            );

            return Promise.resolve(
              JSON.stringify({
                signatureValid: isValidSignature,
                matchesOffchainMessageV1Spec: matchesSpec,
                signedWithRequestedAccount,
              }),
            );
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
            if(hasVersionedTx(res)) {
              return 'error: Tx is Versioned Transaction';
            }
            return Buffer.from(res.serialize()).toString('hex')
          }}
          onValidate={async (request: string, result: string) => {
            const tx = Transaction.from(Buffer.from(result, 'hex'));
            const verified = tx.verifySignatures();

            // TODO: type error, may be passed wrong options
            const res = await connection.simulateTransaction(tx);

            return {
              success: res.value.err === null,
              verified,
              tryRun: res,
              tx
            };
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

            if(!hasVersionedTx(res)) {
              return 'error: Tx is legacy Transaction';
            }

            return Buffer.from(res.serialize()).toString('hex')
          }}
          onValidate={async (request: string, result: string) => {
            const tx = VersionedTransaction.deserialize(Buffer.from(result, 'hex'))

            const res = await connection.simulateTransaction(tx)
            return {
              success: res.value.err === null,
              tryRun: res,
              tx
            }
          }}
        />
        <ApiPayload
          title="signTransaction (Versioned legacy)"
          description="签署 Versioned legacy 交易, legacy 旧版本交易，但是返回值是 Versioned 的 Tx"
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

            const transfer = createVersionedLegacyTransaction(
              new PublicKey(account?.publicKey),
              toPubkey,
              recentBlockhash,
              amount,
            );
            console.log('transfer', transfer);
            const res = await provider?.signTransaction(transfer);
            console.log('res', res);
            if(!hasVersionedTx(res)) {
              return 'error:Tx is legacy Transaction';
            }
            return Buffer.from(res.serialize()).toString('hex');
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
            return res.map(r => Buffer.from(r.serialize()).toString('hex'))
          }}
          onValidate={async (request: string, result: string) => {
            const txArray = JSON.parse(result) as string[]
            const txs = txArray.map(r => Transaction.from(Buffer.from(r, 'hex')))
            const verifiedResult = []
            for (const tx of txs) {
              const verified = tx.verifySignatures()
              const res = await connection.simulateTransaction(tx)
              verifiedResult.push({
                success: res.value.err === null,
                verified,
                tryRun: res,
              })
            }
            return verifiedResult
          }}
        />
        <ApiPayload
          title="transferToken"
          description="代币转账"
          presupposeParams={params.signAndSendTokenTransaction(account?.publicKey)}
          onExecute={async (request: string) => {
            const {
              tokenMint,
              toPubkey,
              amount,
              decimals
            }: {
              tokenMint: string;
              toPubkey: string;
              amount: number;
              decimals: number;
            } = JSON.parse(request);

            const recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
            const transaction = await createTokenTransferTransaction(
              connection,
              new PublicKey(account?.publicKey),
              new PublicKey(toPubkey),
              new PublicKey(tokenMint),
              recentBlockhash,
              amount,
              decimals
            );

            const res = await provider?.signAndSendTransaction(transaction);
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>

      <DappList dapps={dapps} />
    </>
  );
}
