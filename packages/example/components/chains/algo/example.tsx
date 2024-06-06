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

export default function Example() {
  const walletsRef = useRef<IProviderInfo[]>([
    {
      uuid: 'injected',
      name: 'Injected Wallet',
      inject: 'algorand',
    },
    {
      uuid: 'injected-onekey',
      name: 'Injected OneKey',
      inject: '$onekey.algorand',
    },
  ]);

  const { provider, setAccount, account } = useWallet<IProviderApi>();

  const onConnectWallet = async (selectedWallet: IKnownWallet) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const providerDetail = walletsRef.current?.find((w) => w.uuid === selectedWallet.id);
    if (!providerDetail) {
      return Promise.reject('Wallet not found');
    }

    const provider = get(window, providerDetail.inject) as IProviderApi | undefined;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, no-unsafe-optional-chaining
    const { address } = await provider?.connect();

    return {
      provider,
      address: address,
    };
  };

  useEffect(() => {
    const accountsChangedHandler = (address: string) => {
      console.log('algo [accountChanged]', address);

      if (address) {
        setAccount({
          ...account,
          address: address,
        });
      }
    };
    const connectHandler = (connectInfo: { address: string }) => {
      console.log('algo [connect]', connectInfo);
    };
    const disconnectHandler = () => {
      console.log('algo [disconnect]');
    };

    provider?.on('accountChanged', accountsChangedHandler);
    provider?.on('connect', connectHandler);
    provider?.on('disconnect', disconnectHandler);

    return () => {
      provider?.off('accountChanged', accountsChangedHandler);
      provider?.off('connect', connectHandler);
      provider?.off('disconnect', disconnectHandler);
    };
  }, [account, provider, setAccount]);

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

      <ApiGroup title="Legacy Basics">
        <ApiPayload
          title="connect"
          description="(Legacy) 连接钱包"
          onExecute={async (request: string) => {
            const res = await provider?.connect();
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>
      <ApiGroup title="Basics">
        <ApiPayload
          title="enable"
          description="获取账户权限"
          onExecute={async (request: string) => {
            const res = await provider?.enable();
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>

      <DappList dapps={dapps} />
    </>
  );
}
