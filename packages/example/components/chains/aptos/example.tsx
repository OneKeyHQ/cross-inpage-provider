/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
import { dapps } from './dapps.config';
import ConnectButton from '../../../components/connect/ConnectButton';
import { useEffect, useRef } from 'react';
import { get } from 'lodash';
import axios from 'axios';
import { hexToBytes } from '@noble/hashes/utils';
import { IProviderApi, IProviderInfo, SignMessageResponse } from './types';
import { ApiPayload, ApiGroup } from '../../ApiActuator';
import { useWallet } from '../../../components/connect/WalletContext';
import type { IKnownWallet } from '../../../components/connect/types';
import DappList from '../../../components/DAppList';
import params from './params';
import nacl from 'tweetnacl';
import { stripHexPrefix } from 'ethereumjs-util';
import { toast } from '../../ui/use-toast';
import { TxnBuilderTypes } from 'aptos';


export default function Example() {
  const walletsRef = useRef<IProviderInfo[]>([
    {
      uuid: 'injected',
      name: 'Injected Wallet',
      inject: 'aptos',
    },
    {
      uuid: 'injected-onekey',
      name: 'Injected OneKey',
      inject: '$onekey.aptos',
    },
  ]);

  const { provider, setAccount, account } = useWallet<IProviderApi>();

  const onConnectWallet = async (selectedWallet: IKnownWallet) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const providerDetail = walletsRef.current?.find((w) => w.uuid === selectedWallet.id);
    if (!providerDetail) {
      return Promise.reject('Wallet not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const provider = get(window, providerDetail.inject) as IProviderApi | undefined;

    if (!provider) {
      toast({
        title: 'Wallet not found',
        description: 'Please install the wallet extension',
      });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, no-unsafe-optional-chaining
    const { address, publicKey } = await provider?.connect();

    const chainId = await provider?.network();

    return {
      provider,
      address,
      publicKey,
      chainId,
    };
  };

  useEffect(() => {
    if (!provider) return;

    // @ts-expect-error
    provider.onNetworkChange((network: { chainId: string; name: string; url: string } | null) => {
      console.log(`aptos [onNetworkChange] ${JSON.stringify(network)}`);

      if (!network) return;
      if (!network.chainId) return;

      setAccount({
        ...account,
        chainId: network?.chainId,
      });
    });

    // @ts-expect-error
    provider.onAccountChange((params: { address: string; publicKey: string } | null) => {
      console.log(`aptos [onAccountChange] ${JSON.stringify(params)}`);
      if (!params?.address) return;
      if (!params?.publicKey) return;

      setAccount({
        ...account,
        address: params.address,
        publicKey: params.publicKey,
      });
    });

    // @ts-expect-error
    provider.onDisconnect?.((params: { name: string | null } | null) => {
      console.log(`aptos [onDisconnect] ${JSON.stringify(params)}`);
    });
  }, [account, provider, setAccount]);
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
        onDisconnect={() => provider?.disconnect()}
      />

      <ApiGroup title="Basics">
        <ApiPayload
          title="connect"
          description="连接 Wallet"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await provider?.connect();
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="getNetwork"
          description="getNetwork"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await provider?.getNetwork();
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="getNetworkURL"
          description="getNetworkURL"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await provider?.getNetworkURL();
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="isConnected"
          description="isConnected"
          disableRequestContent
          allowCallWithoutProvider
          // eslint-disable-next-line @typescript-eslint/require-await
          onExecute={async (request: string) => {
            const res = provider?.isConnected() ?? false;
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="account"
          description="当前账户"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await provider?.account();
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="network"
          description="当前网络"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await provider?.network();
            return res;
          }}
        />
      </ApiGroup>

      <ApiGroup title="Transfer">
        <ApiPayload
          title="signMessage"
          description="signMessage"
          presupposeParams={params.signMessage}
          onExecute={async (request: string) => {
            const obj = JSON.parse(request);
            const res = await provider?.signMessage(obj);
            return JSON.stringify(res);
          }}
          onValidate={(request: string, result: string) => {
            const { fullMessage, signature } = JSON.parse(result) as SignMessageResponse;

            const isValidSignature = nacl.sign.detached.verify(
              Buffer.from(fullMessage),
              hexToBytes(signature),
              hexToBytes(stripHexPrefix(account?.publicKey)),
            );

            return Promise.resolve(isValidSignature.toString());
          }}
        />
        <ApiPayload
          title="signTransaction"
          description="signTransaction"
          presupposeParams={params.signTransaction(account?.address ?? '')}
          onExecute={async (request: string) => {
            const obj = JSON.parse(request);
            const res = await provider?.signTransaction(obj);
            return res;
          }}
          onValidate={async (request: string, result: string) => {
            const jsonObject = JSON.parse(result);
            const buffer = new Uint8Array(jsonObject);

            const options = {
              method: 'POST',
              url: 'https://api.mainnet.aptoslabs.com/v1/transactions',
              headers: { 'Content-Type': 'application/x.aptos.signed_transaction+bcs' },
              data: buffer,
            };

            const res = await axios.request(options);

            console.log(res.data);
            return Promise.resolve(JSON.stringify(res.data));
          }}
        />
        <ApiPayload
          title="signAndSubmitTransaction"
          description="signAndSubmitTransaction"
          presupposeParams={params.signTransaction(account?.address ?? '')}
          onExecute={async (request: string) => {
            const obj = JSON.parse(request);
            const res = await provider?.signAndSubmitTransaction(obj);
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="signAndSubmitTransaction-Script"
          description="signAndSubmitTransaction-Script (会报错，是正常的)"
          presupposeParams={[
            {
              id: 'script',
              name: 'script',
              description: 'script',
              value: '',
            },
          ]}
          onExecute={async (request: string) => {
            const script = new TxnBuilderTypes.Script(
              hexToBytes('0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20'),
              [
                new TxnBuilderTypes.TypeTagU8(),
                new TxnBuilderTypes.TypeTagU64(),
                new TxnBuilderTypes.TypeTagU128(),
                new TxnBuilderTypes.TypeTagBool(),
                new TxnBuilderTypes.TypeTagAddress(),
                new TxnBuilderTypes.TypeTagSigner(),
                new TxnBuilderTypes.TypeTagVector(new TxnBuilderTypes.TypeTagU8()),
                new TxnBuilderTypes.TypeTagStruct(
                  new TxnBuilderTypes.StructTag(
                    new TxnBuilderTypes.AccountAddress(hexToBytes('1'.repeat(64))),
                    new TxnBuilderTypes.Identifier('coin'),
                    new TxnBuilderTypes.Identifier('transfer'),
                    [],
                  ),
                ),
              ],
              [
                new TxnBuilderTypes.TransactionArgumentU8(1),
                new TxnBuilderTypes.TransactionArgumentU64(BigInt('18446744073709551615')),
                new TxnBuilderTypes.TransactionArgumentU128(
                  BigInt('340282366920938463463374607431768211455'),
                ),
                new TxnBuilderTypes.TransactionArgumentBool(true),
                new TxnBuilderTypes.TransactionArgumentAddress(
                  new TxnBuilderTypes.AccountAddress(hexToBytes('1'.repeat(64))),
                ),
                new TxnBuilderTypes.TransactionArgumentU8Vector(
                  hexToBytes('0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20'),
                ),
              ],
            );

            const payload = new TxnBuilderTypes.TransactionPayloadScript(script);
            const res = await provider?.signAndSubmitTransaction(payload);
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="signAndSubmitTransaction-mock-Wormhole-Claim"
          description="signAndSubmitTransaction-mock-Wormhole-Claim (会报错，是正常的)"
          presupposeParams={[
            {
              id: 'script',
              name: 'script',
              description: 'script',
              value: '',
            },
          ]}
          onExecute={async (request: string) => {
            const script = new TxnBuilderTypes.Script(
              hexToBytes(
                '0a11ce70b0700000a0601000402040403080c05141617050e161640537f087d403f0072010100020000030203030001010403040400010303060c0a020a020003060c0c060a02060a0201080800010104136d6561736167655f7472616e736d697474657210746f6b656e5f6d657373656e676572075265636569707415726563656976655f6d657373616765167468616e646c655f726563656976655f6d657373616765177e171882e6653018738cb3f3c888c0647fae3b8784f5c65a4d9b38c67c3b73888ed9a3c1b64257aef27b6e40f24896eae8b13e83ba701e38d51a086e637f8972d87f85f2e8370fae3db5d0b471a7f9892743d75e9c0e5f4a3f7ba5634f889cd6403becc804d57d34b64879d18181c80e0b00e1e020f070b000e010e020011000011010102',
              ),
              [],
              [
                new TxnBuilderTypes.TransactionArgumentU8Vector(
                  hexToBytes(
                    '0000000000000000600000000090000000007ca6e000000000000000000000000001682ae6375c4e4a97e4b583bc394c861a46d89629e6702a472080ea3caaf6ba9dffaa6effad2290a9ba9adaaad5af5c618e42782d00000000000000000000000000000000000000000000000000000000833589fcd6edb6e08f4c7c32d4f71b54bda02913eb2d1d9bbfca9d892e124e858f1dc449935a3f785f8860892e03fb9814db183900000000000000000000000000000000000000000000000000000000000000000027100000000000000000000000005618207d27d78f09f61a5d92190d58c453feb4b7',
                  ),
                ),
                new TxnBuilderTypes.TransactionArgumentU8Vector(
                  hexToBytes(
                    '1f8799b9e37368636df06804e4c575a431bb279b7dfae2375e5b274873ea8948024872966e1bf8b39607b2312e6337452d53139b68fa7d981dbbab0b94534e211c1e78000f700303aa5534ddaa4397fcaa1eaea194447e9357218b88cc4942507f7b14bb727686ff941a43beae83695dc7007df40e9bef1bff146b39e7a8b436831c',
                  ),
                ),
              ],
            );

            const payload = new TxnBuilderTypes.TransactionPayloadScript(script);
            const res = await provider?.signAndSubmitTransaction({
              payload,
            });
            return JSON.stringify(res);
          }}
        />
        {/* <ApiPayload
          title="transferToken"
          description="代币转账"
          presupposeParams={params.transferToken(account?.address ?? '')}
          onExecute={async (request: string) => {
            const payload = JSON.parse(request);
            // 将amount转换为原子单位 (1 APT = 100000000 原子单位)
            const amount = Number(payload.arguments[1]) * 100000000;

            const transaction = {
              ...payload,
              arguments: [payload.arguments[0], amount.toString()],
            };

            const res = await provider?.signAndSubmitTransaction(transaction);
            return JSON.stringify(res);
          }}
        /> */}
      </ApiGroup>

      <DappList dapps={dapps} />
    </>
  );
}
