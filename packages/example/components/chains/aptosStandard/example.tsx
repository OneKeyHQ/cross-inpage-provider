/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { dapps } from './dapps.config';
import ConnectButton from '../../../components/connect/ConnectButton';
import { useEffect, useRef, useCallback } from 'react';
import { hexToBytes } from '@noble/hashes/utils';
import { SignMessageResponse } from './types';
import { ApiPayload, ApiGroup } from '../../ApiActuator';
import { useWallet } from '../../../components/connect/WalletContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { IKnownWallet } from '../../../components/connect/types';
import DappList from '../../../components/DAppList';
import params from './params';
import nacl from 'tweetnacl';
import { stripHexPrefix } from 'ethereumjs-util';
import { toast } from '../../ui/use-toast';
import {
  Network,
  Aptos,
  AptosConfig,
  parseTypeTag,
  TypeTagAddress,
  TypeTagU64,
  SimpleTransaction,
  Deserializer,
  Ed25519PublicKey,
  Ed25519Signature,
  AccountAuthenticatorEd25519,
  AccountAddress,
  U64,
  U256,
  InputGenerateTransactionPayloadData,
} from '@aptos-labs/ts-sdk';
import {
  WalletReadyState,
  AptosStandardSupportedWallet,
  SignMessagePayload,
} from '@aptos-labs/wallet-adapter-core';
import { useWallet as useStandardWallet } from '@aptos-labs/wallet-adapter-react';

import { AptosWalletAdapterProvider, Wallet } from '@aptos-labs/wallet-adapter-react';
import InfoLayout from '../../InfoLayout';
import { jsonToUint8Array } from '../../../lib/uint8array';
import { get } from 'lodash';

function Example() {
  const {
    connected,
    account,
    network,
    signAndSubmitTransaction,
    signMessageAndVerify,
    signMessage,
    signTransaction,
    submitTransaction,
  } = useStandardWallet();

  const aptosClient = new Aptos(
    new AptosConfig({
      network: Network.MAINNET,
    }),
  );

  return (
    <>
      <ApiGroup title="Basics">
        <ApiPayload
          title="getNetwork"
          description="getNetwork"
          disableRequestContent
          allowCallWithoutProvider
          onExecute={async () => {
            return Promise.resolve(network);
          }}
        />
        <ApiPayload
          title="isConnected"
          description="isConnected"
          disableRequestContent
          allowCallWithoutProvider
          onExecute={async () => {
            return Promise.resolve(connected);
          }}
        />
        <ApiPayload
          title="account"
          description="当前账户"
          disableRequestContent
          allowCallWithoutProvider
          onExecute={async () => {
            return Promise.resolve(account);
          }}
        />
        <ApiPayload
          title="network"
          description="当前网络"
          disableRequestContent
          allowCallWithoutProvider
          onExecute={async () => {
            return Promise.resolve(network);
          }}
        />
      </ApiGroup>

      <ApiGroup title="Transfer">
        <ApiPayload
          title="signMessage"
          description="signMessage"
          presupposeParams={params.signMessage}
          onExecute={async (request: string) => {
            const obj = JSON.parse(request) as SignMessagePayload;
            const res = await signMessage(obj);
            return JSON.stringify(res);
          }}
          onValidate={(request: string, result: string) => {
            const { fullMessage, signature } = JSON.parse(result) as SignMessageResponse;

            const signatureU8 = jsonToUint8Array(get(signature, 'data.data'));

            const isValidSignature = nacl.sign.detached.verify(
              Buffer.from(fullMessage),
              signatureU8,
              hexToBytes(stripHexPrefix(account?.publicKey as string)),
            );

            return Promise.resolve(isValidSignature.toString());
          }}
        />
        <ApiPayload
          title="signMessageAndVerify"
          description="signMessageAndVerify"
          presupposeParams={params.signMessage}
          onExecute={async (request: string) => {
            const obj = JSON.parse(request) as SignMessagePayload;
            const res = await signMessageAndVerify(obj);
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="signTransaction"
          description="signTransaction"
          presupposeParams={params.signTransaction(account?.address ?? '')}
          onExecute={async (request: string) => {
            const obj = JSON.parse(request);
            const { transactionOrPayload, asFeePayer, options } = obj;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const res = await signTransaction(transactionOrPayload, asFeePayer, options);
            return res;
          }}
        />
        <ApiPayload
          title="signAndSubmitTransaction"
          description="signAndSubmitTransaction"
          presupposeParams={params.signAndSubmitTransaction(account?.address ?? '')}
          onExecute={async (request: string) => {
            const obj = JSON.parse(request);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const res = await signAndSubmitTransaction(obj);
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>

      <ApiGroup title="SDK Build Transaction">
        <ApiPayload
          title="signTransaction-SDK-build transaction"
          description="使用 SDK 构造 Coin 转账"
          presupposeParams={[
            {
              id: 'sender',
              name: 'sender',
              value: JSON.stringify({
                recipient: account?.address ?? '',
                amount: 100000,
              }),
            },
          ]}
          onExecute={async (request: string) => {
            const { recipient, amount } = JSON.parse(request);
            const res = await aptosClient.coin.transferCoinTransaction({
              sender: account?.address ?? '',
              recipient,
              amount,
            });

            return {
              txn: res.bcsToHex().toStringWithoutPrefix(),
              result: await signTransaction(res),
            };
          }}
          onValidate={async (request: string, result: string) => {
            const { txn, result: signedTxn } = JSON.parse(result);
            const publicKey = jsonToUint8Array(get(signedTxn, 'public_key.key.data'));
            const signature = jsonToUint8Array(get(signedTxn, 'signature.data.data'));

            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const simpleTxn = SimpleTransaction.deserialize(new Deserializer(hexToBytes(txn)));

            const res = await submitTransaction({
              transaction: simpleTxn,
              senderAuthenticator: new AccountAuthenticatorEd25519(
                new Ed25519PublicKey(publicKey),
                new Ed25519Signature(signature),
              ),
            });

            return Promise.resolve(JSON.stringify(res));
          }}
        />

        <ApiPayload
          title="signTransaction-SDK-build transaction"
          description="使用 SDK 构造 Legacy Token 转账"
          presupposeParams={[
            {
              id: 'sender',
              name: 'sender',
              value: JSON.stringify({
                recipient: account?.address ?? '',
                amount: 100000,
                coinType:
                  '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC',
              }),
            },
          ]}
          onExecute={async (request: string) => {
            const { recipient, amount, coinType } = JSON.parse(request);
            const res = await aptosClient.coin.transferCoinTransaction({
              sender: account?.address ?? '',
              recipient,
              amount,
              coinType,
            });

            return {
              txn: res.bcsToHex().toStringWithoutPrefix(),
              result: await signTransaction(res),
            };
          }}
          onValidate={async (request: string, result: string) => {
            const { txn, result: signedTxn } = JSON.parse(result);
            const publicKey = jsonToUint8Array(get(signedTxn, 'public_key.key.data'));
            const signature = jsonToUint8Array(get(signedTxn, 'signature.data.data'));

            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const simpleTxn = SimpleTransaction.deserialize(new Deserializer(hexToBytes(txn)));

            const res = await submitTransaction({
              transaction: simpleTxn,
              senderAuthenticator: new AccountAuthenticatorEd25519(
                new Ed25519PublicKey(publicKey),
                new Ed25519Signature(signature),
              ),
            });

            return Promise.resolve(JSON.stringify(res));
          }}
        />

        <ApiPayload
          title="signTransaction-SDK-build transaction"
          description="使用 SDK 构造 Token 转账"
          presupposeParams={[
            {
              id: 'sender',
              name: 'sender',
              value: JSON.stringify({
                recipient: account?.address ?? '',
                amount: 100000,
                coinType: '0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b',
              }),
            },
          ]}
          onExecute={async (request: string) => {
            const { recipient, amount, coinType } = JSON.parse(request);
            try {
              const res = await aptosClient.transaction.build.simple({
                sender: account?.address ?? '',
                data: {
                  function: '0x1::primary_fungible_store::transfer',
                  typeArguments: ['0x1::fungible_asset::Metadata'],
                  functionArguments: [coinType, recipient, amount],
                  abi: {
                    typeParameters: [{ constraints: [] }],
                    parameters: [
                      parseTypeTag('0x1::object::Object'),
                      new TypeTagAddress(),
                      new TypeTagU64(),
                    ],
                  },
                },
              });
              return {
                txn: res.bcsToHex().toStringWithoutPrefix(),
                result: await signTransaction(res),
              };
            } catch (error) {
              console.log(error);
            }
          }}
          onValidate={async (request: string, result: string) => {
            const { txn, result: signedTxn } = JSON.parse(result);
            const publicKey = jsonToUint8Array(get(signedTxn, 'public_key.key.data'));
            const signature = jsonToUint8Array(get(signedTxn, 'signature.data.data'));

            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const simpleTxn = SimpleTransaction.deserialize(new Deserializer(hexToBytes(txn)));

            const res = await submitTransaction({
              transaction: simpleTxn,
              senderAuthenticator: new AccountAuthenticatorEd25519(
                new Ed25519PublicKey(publicKey),
                new Ed25519Signature(signature),
              ),
            });

            return Promise.resolve(JSON.stringify(res));
          }}
        />
      </ApiGroup>

      <ApiGroup title="SignAndSubmitTransaction Test">
        <ApiPayload
          title="signAndSubmitTransaction Normal Argument"
          description="Normal Argument 测试"
          presupposeParams={[
            {
              id: 'sender',
              name: 'sender',
              value: JSON.stringify({
                recipient: account?.address ?? '',
                amount: 100000,
                coinType: '0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b',
              }),
            },
          ]}
          onExecute={async (request: string) => {
            const { recipient, amount, coinType } = JSON.parse(request);
            const buffer = new ArrayBuffer(3);
            const uint8Array = new Uint8Array(buffer);
            uint8Array.set([1, 2, 3]);

            const data: InputGenerateTransactionPayloadData = {
              function: '0x1::primary_fungible_store::transfer',
              typeArguments: ['0x1::fungible_asset::Metadata'],
              functionArguments: [
                coinType,
                recipient as string,
                amount as number,
                hexToBytes('010203'),
                buffer,
              ],
            };

            console.log('=====>>>>> data', data, JSON.stringify(data));
            return {
              result: await signAndSubmitTransaction({
                sender: account?.address ?? '',
                data,
              }),
            };
          }}
        />

        <ApiPayload
          title="signAndSubmitTransaction Encode Argument"
          description="Encode Argument 测试 (OneKey、OKX、MizuWallet 等都不支持)"
          presupposeParams={[
            {
              id: 'sender',
              name: 'sender',
              value: JSON.stringify({
                recipient: account?.address ?? '',
                amount: 100000,
                coinType: '0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b',
              }),
            },
          ]}
          onExecute={async (request: string) => {
            const { recipient, amount, coinType } = JSON.parse(request);
            return {
              result: await signAndSubmitTransaction({
                sender: account?.address ?? '',
                data: {
                  function: '0x1::primary_fungible_store::transfer',
                  typeArguments: ['0x1::fungible_asset::Metadata'],
                  functionArguments: [
                    coinType,
                    AccountAddress.from(recipient as string),
                    new U64(amount as number),
                  ],
                },
              }),
            };
          }}
        />
      </ApiGroup>

      <DappList dapps={dapps} />
    </>
  );
}

function AptosConnectButton() {
  const { connected, wallets, account, network, connect, disconnect } = useStandardWallet();

  const { setProvider } = useWallet();

  const walletsRef = useRef<(Wallet | AptosStandardSupportedWallet)[]>([]);
  walletsRef.current = wallets.filter((wallet) => wallet.readyState === WalletReadyState.Installed);
  console.log('Aptos Standard Wallets:', walletsRef.current);

  const onConnectWallet = useCallback(
    async (selectedWallet: IKnownWallet) => {
      const wallet = walletsRef.current.find((w) => w.name === selectedWallet.id);
      if (!wallet) {
        return Promise.reject('Wallet not found');
      }

      connect(wallet.name);

      return {
        provider: undefined,
      };
    },
    [connect],
  );

  useEffect(() => {
    console.log('account changed', account);
    setProvider(account);
  }, [account, setProvider]);
  useEffect(() => {
    console.log('network changed', network);
  }, [network]);

  return (
    <>
      <ConnectButton<any>
        fetchWallets={() => {
          return Promise.resolve(
            walletsRef.current.map((wallet) => {
              return {
                id: wallet.name,
                name: wallet.name,
                tags: [wallet.isAIP62Standard ? 'AIP62' : ''],
              };
            }),
          );
        }}
        onConnect={onConnectWallet}
        onDisconnect={() => void disconnect()}
      />

      <InfoLayout title="Base Info">
        {account && <p>Account:{account?.address ?? ''}</p>}
        {account && <p>PubKey:{account?.publicKey ?? ''}</p>}
        {account && <p>minKeysRequired:{account?.minKeysRequired ?? ''}</p>}
        {account && <p>ansName:{account?.ansName ?? ''}</p>}
        {network && <p>chainId:{network?.chainId ?? ''}</p>}
        {network && <p>networkName:{network?.name ?? ''}</p>}
        {network && <p>networkUrl:{network?.url ?? ''}</p>}
        {account && <p>Status :{connected ? 'Connected' : 'Disconnected'}</p>}
      </InfoLayout>
    </>
  );
}

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AptosWalletAdapterProvider
        autoConnect={true}
        dappConfig={{
          network: Network.MAINNET,
        }}
        // @ts-expect-error
        optInWallets={['Petra', 'OneKey', 'OKX Wallet', 'Nightly', 'Mizu Wallet', 'Pontem Wallet']}
        onError={(error) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          console.log('error', error);
        }}
      >
        <AptosConnectButton />
        <Example />
      </AptosWalletAdapterProvider>
    </QueryClientProvider>
  );
}
