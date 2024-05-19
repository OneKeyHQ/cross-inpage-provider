/* eslint-disable no-unsafe-optional-chaining */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { dapps } from './dapps.config';
import ConnectButton from '@/components/connect/ConnectButton';
import { useEffect, useRef } from 'react';
import { get } from 'lodash';
import { IProviderApi, IProviderInfo } from './types';
import { ApiPayload, ApiGroup } from '@/components/ApisContainer';
import { useWallet } from '@/components/connect/WalletContext';
import type { IKnownWallet } from '@/components/connect/types';
import DappList from '@/components/DAppList';
import params from './params';

export default function BTCExample() {
  const walletsRef = useRef<IProviderInfo[]>([
    {
      uuid: 'injected',
      name: 'Injected Wallet',
      inject: 'starcoin',
    },
    {
      uuid: 'injected-onekey',
      name: 'Injected OneKey',
      inject: '$onekey.starcoin',
    },
  ]);

  const { provider } = useWallet<IProviderApi>();

  const onConnectWallet = async (selectedWallet: IKnownWallet) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const providerDetail = walletsRef.current?.find((w) => w.uuid === selectedWallet.id);
    if (!providerDetail) {
      return Promise.reject('Wallet not found');
    }

    const provider = get(window, providerDetail.inject) as IProviderApi | undefined;

    await provider?.request<string[]>({
      method: 'stc_requestAccounts',
    });

    const [address] = await provider.request<string[]>({
      method: 'stc_accounts',
    });
    const chainInfo = await provider.request<{ id: number }>({
      method: 'chain.id',
    });

    return {
      provider,
      address,
      chainId: chainInfo?.id.toString(),
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
          onExecute={async (request: string) => {
            const res = await provider?.request<string[]>({
              method: 'stc_requestAccounts',
            });
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="GetAccounts"
          description="获取账户"
          onExecute={async () => {
            const res = await provider?.request<string[]>({
              method: 'stc_accounts',
            });
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>

      <DappList dapps={dapps} />
    </>
  );
}
