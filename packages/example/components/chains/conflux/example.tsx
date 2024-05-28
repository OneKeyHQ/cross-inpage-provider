/* eslint-disable no-unsafe-optional-chaining */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { dapps } from './dapps.config';
import ConnectButton from '../../../components/connect/ConnectButton';
import { useEffect, useRef } from 'react';
import { get } from 'lodash';
import { IProviderApi, IProviderInfo } from './types';
import { ApiPayload, ApiGroup } from '../../ApiActuator';
import { useWallet } from '../../../components/connect/WalletContext';
import type { IKnownWallet } from '../../../components/connect/types';
import DappList from '../../../components/DAppList';
import params from './params';
import { recoverPersonalSignature } from '@metamask/eth-sig-util';
import { toast } from '../../ui/use-toast';

export default function BTCExample() {
  const walletsRef = useRef<IProviderInfo[]>([
    {
      uuid: 'injected',
      name: 'Injected Wallet',
      inject: 'conflux',
    },
    {
      uuid: 'injected-onekey',
      name: 'Injected OneKey',
      inject: '$onekey.conflux',
    },
  ]);

  const { provider, account } = useWallet<IProviderApi>();

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

    await provider?.request<string[]>({
      method: 'cfx_requestAccounts',
    });

    const [address] = await provider.request<string[]>({
      method: 'cfx_accounts',
    });
    const [chainId] = await provider.request<string[]>({
      method: 'cfx_chainId',
    });

    return {
      provider,
      address,
      chainId,
    };
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
      />

      <ApiGroup title="Basics">
        <ApiPayload
          title="RequestAccounts"
          description="连接钱包"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await provider?.request<string[]>({
              method: 'cfx_requestAccounts',
            });
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="GetAccounts"
          description="获取账户"
          disableRequestContent
          onExecute={async () => {
            const res = await provider?.request<string[]>({
              method: 'cfx_accounts',
            });
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="AddConfluxChain"
          description="（不需要支持）添加 Chain"
          presupposeParams={params.addConfluxChain}
          onExecute={async (request) => {
            const res = await provider?.request({
              'method': 'wallet_addConfluxChain',
              'params': [JSON.parse(request)],
            });
            return JSON.stringify(res);
          }}
        />{' '}
        <ApiPayload
          title="switchConfluxChain"
          description="（不需要支持）切换 Chain"
          presupposeParams={params.addConfluxChain}
          onExecute={async (request) => {
            const res = await provider?.request({
              'method': 'wallet_switchConfluxChain',
              'params': [JSON.parse(request)],
            });
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="WatchAsset"
          description="添加 Token"
          presupposeParams={params.watchAsset}
          onExecute={async (request) => {
            const res = await provider?.request({
              'method': 'wallet_watchAsset',
              'params': [JSON.parse(request)],
            });
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>

      <ApiGroup title="Sign Message">
        <ApiPayload
          title="personal_sign"
          description="personal_sign"
          presupposeParams={params.personalSign}
          onExecute={async (request) => {
            const res = await provider?.request({
              'method': 'personal_sign',
              'params': [request, account.address, 'Example password'],
            });
            return res as string;
          }}
          onValidate={async (request: string, response: string) => {
            const res = recoverPersonalSignature({ data: request, signature: response });
            return Promise.resolve((res === account.address).toString());
          }}
        />

        <ApiPayload
          title="signTypedDataV4"
          description="signTypedDataV4"
          presupposeParams={params.signTypedDataV4}
          onExecute={async (request) => {
            const res = await provider?.request({
              'method': 'cfx_signTypedData_v4',
              'params': [account.address, request],
            });
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>

      <ApiGroup title="Transaction">
        <ApiPayload
          title="SendTransaction"
          description="发送交易"
          presupposeParams={params.sendTransaction(account?.address ?? '', account?.address ?? '')}
          onExecute={async (request: string) => {
            const res = await provider?.request({
              'method': 'cfx_sendTransaction',
              'params': [JSON.parse(request)],
            });
            return res as string;
          }}
        />
      </ApiGroup>

      <DappList dapps={dapps} />
    </>
  );
}
