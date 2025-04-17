/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { dapps } from './dapps.config';
import ConnectButton from '../../../components/connect/ConnectButton';
import { useEffect, useRef } from 'react';
import { get } from 'lodash';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { IProviderApi, IProviderInfo } from './types';
import { ApiPayload, ApiGroup } from '../../ApiActuator';
import { useWallet } from '../../../components/connect/WalletContext';
import type { IKnownWallet } from '../../../components/connect/types';
import DappList from '../../../components/DAppList';
import { toast } from '../../ui/use-toast';
import { SignMessagePayload, SignMessageResponse } from '../aptos/types';
import { stripHexPrefix } from '../../../lib/hex';
import nacl from 'tweetnacl';
import params from './params';
import { Textarea } from '../../ui/textarea';

export default function Example() {
  const walletsRef = useRef<IProviderInfo[]>([
    {
      uuid: 'injected',
      name: 'Injected Wallet',
      inject: 'martian',
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
    const { address } = await provider?.connect();

    const chainId = await provider?.network();

    return {
      provider,
      address,
      chainId,
    };
  };

  useEffect(() => {
    if (!provider) return;

    provider.onNetworkChange((network: string) => {
      setAccount({
        ...account,
        chainId: network,
      });
      console.log(`aptos [onNetworkChange] ${network}`);
    });
    provider.onAccountChange((address: string | null) => {
      console.log(`aptos [onAccountChange] ${address}`);
      if (!address) return;
      setAccount({
        ...account,
        address,
      });
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
        <ApiPayload
          title="getAccount"
          description="getAccount"
          presupposeParams={[
            {
              id: 'getAccount',
              name: 'getAccount',
              value: `${account?.address}`,
            },
          ]}
          onExecute={async (request: string) => {
            const res = await provider?.getAccount(request);
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="getChainId"
          description="getChainId"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await provider?.getChainId();
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="getLedgerInfo"
          description="getLedgerInfo"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await provider?.getLedgerInfo();
            return JSON.stringify(res);
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
            const res = await provider?.signMessage(obj);
            return JSON.stringify(res);
          }}
          onValidate={async (request: string, result: string) => {
            const { fullMessage, signature } = JSON.parse(result) as SignMessageResponse;
            const account = await provider?.account();
            const isValidSignature = nacl.sign.detached.verify(
              Buffer.from(fullMessage),
              hexToBytes(stripHexPrefix(signature)),
              hexToBytes(stripHexPrefix(account?.publicKey ?? '')),
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
            const tx = await provider?.generateTransaction(account?.address, obj);
            return await provider?.signTransaction(tx);
          }}
          onValidate={async (request: string, result: string) => {
            return await provider?.submitTransaction(new Uint8Array(result.split(",").map((item) => parseInt(item, 10))));
          }}
        />
        <ApiPayload
          title="signAndSubmitTransaction"
          description="signAndSubmitTransaction"
          presupposeParams={params.signTransaction(account?.address ?? '')}
          onExecute={async (request: string) => {
            const obj = JSON.parse(request);
            const tx = await provider?.generateTransaction(account?.address, obj);
            const res = await provider?.signAndSubmitTransaction(tx);
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="generateSignAndSubmitTransaction"
          description="（暂不支持）generateSignAndSubmitTransaction"
          presupposeParams={params.signTransaction(account?.address ?? '')}
          onExecute={async (request: string) => {
            const obj = JSON.parse(request);
            return await provider?.generateSignAndSubmitTransaction(account?.address, obj);
          }}
        />
        <ApiPayload
          title="generateTransaction"
          description="generateTransaction"
          presupposeParams={params.signTransaction(account?.address ?? '')}
          onExecute={async (request: string) => {
            const obj = JSON.parse(request);
            const res = await provider?.generateTransaction(account?.address, obj);
            return res;
          }}
          onValidate={async (request: string, result: string) => {
            const signedRawTx = await provider?.signTransaction(result);
            const res = await provider?.submitTransaction(signedRawTx);
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="signGenericTransaction"
          description="signGenericTransaction 会广播上链"
          presupposeParams={params.signGenericTransaction(account?.address ?? '')}
          onExecute={async (request: string) => {
            const obj = JSON.parse(request);
            const res = await provider?.signGenericTransaction(obj);
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="submitTransaction"
          description="submitTransaction"
          onExecute={async (request: string) => {
            const obj = Buffer.from(request.split(',')?.map((v) => parseInt(v, 10)));
            const res = await provider?.submitTransaction(obj);
            return JSON.stringify(res);
          }}
          generateRequestFrom={() => {
            return (
              <Textarea
                name="tx"
                placeholder="将 generateTransaction 请求复制到这里"
                defaultValue={JSON.stringify(
                  {
                    arguments: [account?.address ?? '', '100000'],
                    function: '0x1::coin::transfer',
                    type: 'entry_function_payload',
                    type_arguments: ['0x1::aptos_coin::AptosCoin'],
                  },
                  null,
                  2,
                )}
              />
            );
          }}
          onGenerateRequest={async (fromData: Record<string, any>) => {
            const requestTx = JSON.parse(fromData?.['tx'] as string);
            return await provider?.generateTransaction(account?.address, requestTx);
          }}
        />
        <ApiPayload
          title="getTransactions"
          description="获取交易列表"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await provider?.getTransactions();
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="getTransaction"
          description="获取交易"
          presupposeParams={[
            {
              id: 'getTransaction',
              name: 'getTransaction',
              value: '0x407c189992aa2b5a25b3645a3dc6a8b5c9ec2792d214ab9a04b7acc6b7465a00',
            },
          ]}
          onExecute={async (request: string) => {
            const res = await provider?.getTransaction(request);
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="getAccountTransactions"
          description="获取账户交易列表"
          presupposeParams={[
            {
              id: 'getAccountTransactions',
              name: 'getAccountTransactions',
              value: `${account?.address}`,
            },
          ]}
          onExecute={async (request: string) => {
            const res = await provider?.getAccountTransactions(request);
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="getAccountResources"
          description="获取账户资源列表"
          presupposeParams={[
            {
              id: 'getAccountResources',
              name: 'getAccountResources',
              value: `${account?.address}`,
            },
          ]}
          onExecute={async (request: string) => {
            const res = await provider?.getAccountResources(request);
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>
      <ApiGroup title="NFT">
        <ApiPayload
          title="createCollection"
          description="创建 NFT Collection (名字不能重复)"
          presupposeParams={[
            {
              id: 'createCollection',
              name: 'createCollection',
              value: JSON.stringify({
                name: 'Collection 1',
                description: 'Collection 1 description',
                uri: 'https://onekey.so',
              }),
            },
          ]}
          onExecute={async (request: string) => {
            const obj = JSON.parse(request);
            const res = await provider?.createCollection(obj.name, obj.description, obj.uri);
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="createToken"
          description="创建 NFT (名字不能重复)"
          presupposeParams={[
            {
              id: 'createToken',
              name: 'createToken',
              value: JSON.stringify({
                collectionName: 'Collection 1',
                name: 'NFT 1',
                description: 'TokenDescription',
                supply: 1,
                uri: 'https://aptos.dev/img/nyan.jpeg',
                max: 1,
              }),
            },
          ]}
          onExecute={async (request: string) => {
            const obj = JSON.parse(request);
            const res = await provider?.createToken(
              obj.collectionName,
              obj.name,
              obj.description,
              obj.supply,
              obj.uri,
              obj.max,
            );
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>
      <DappList dapps={dapps} />
    </>
  );
}
