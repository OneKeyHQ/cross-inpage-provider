/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { dapps } from './dapps.config';
import ConnectButton from '@/components/connect/ConnectButton';
import { useRef } from 'react';
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
      inject: 'nostr',
    },
    {
      uuid: 'injected-onekey',
      name: 'Injected OneKey',
      inject: '$onekey.nostr',
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, no-unsafe-optional-chaining
    const address = await provider?.getPublicKey();

    return {
      provider,
      address,
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
      />

      <ApiGroup title="Basics">
        <ApiPayload
          title="getPublicKey"
          description="获取账户权限"
          onExecute={async (request: string) => {
            const res = await provider?.getPublicKey();
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>

      <DappList dapps={dapps} />
    </>
  );
}
