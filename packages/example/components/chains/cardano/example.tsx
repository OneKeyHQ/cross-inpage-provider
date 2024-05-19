/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { dapps } from './dapps.config';
import ConnectButton from '@/components/connect/ConnectButton';
import { useRef, useState } from 'react';
import { get } from 'lodash';
import { IProviderApi, IProviderInfo } from './types';
import { ApiPayload, ApiGroup } from '@/components/ApisContainer';
import { useWallet } from '@/components/connect/WalletContext';
import type { IKnownWallet } from '@/components/connect/types';
import DappList from '@/components/DAppList';

export default function Example() {
  const walletsRef = useRef<IProviderInfo[]>([
    {
      uuid: 'injected',
      name: 'Injected Wallet',
      inject: 'cardano',
    },
    {
      uuid: 'injected-onekey',
      name: 'Injected OneKey',
      inject: '$onekey.cardano',
    },
  ]);

  const { provider } = useWallet<IProviderApi>();

  const [walletApi, setWalletApi] = useState<any | null>(null);

  const onConnectWallet = async (selectedWallet: IKnownWallet) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const providerDetail = walletsRef.current?.find((w) => w.uuid === selectedWallet.id);
    if (!providerDetail) {
      return Promise.reject('Wallet not found');
    }

    const provider = get(window, providerDetail.inject) as IProviderApi | undefined;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, no-unsafe-optional-chaining
    const walletApi = await provider?.enable();

    setWalletApi(walletApi);

    const [address] = await walletApi.getUsedAddresses();
    const chainId = await walletApi.getNetworkId();

    return {
      provider,
      address,
      chainId: chainId.toString(),
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
                name: wallet.inject ? wallet.name : `${wallet.name} (EIP6963)`,
              };
            }),
          );
        }}
        onConnect={onConnectWallet}
        onDisconnect={() => {
          setWalletApi(null);
          return Promise.resolve();
        }}
      />

      <ApiGroup title="Basics">
        <ApiPayload
          title="enable"
          description="获取账户权限"
          onExecute={async (request: string) => {
            const res = await provider?.enable();
            setWalletApi(res);
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="getUsedAddresses"
          description="签名消息"
          onExecute={async (request: string) => {
            const res = await walletApi?.getUsedAddresses();
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>

      <DappList dapps={dapps} />
    </>
  );
}
