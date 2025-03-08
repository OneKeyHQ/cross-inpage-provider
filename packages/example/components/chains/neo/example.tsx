import React, { useEffect, useRef } from 'react';
import { get } from 'lodash';
import { dapps } from './dapps.config';
import ConnectButton from '../../../components/connect/ConnectButton';
import { IProviderApi, IProviderInfo } from './types';
import { ApiPayload, ApiGroup } from '../../ApiActuator';
import { useWallet } from '../../../components/connect/WalletContext';
import type { IKnownWallet } from '../../../components/connect/types';
import DappList from '../../../components/DAppList';
import params from './params';
import { toast } from '../../ui/use-toast';

export default function NeoExample() {
  const walletsRef = useRef<IProviderInfo[]>([
    {
      uuid: 'injected',
      name: 'NeoLine Wallet',
      inject: 'neolineN3',
    },
    {
      uuid: 'injected-onekey',
      name: 'Injected OneKey',
      inject: '$onekey.neo',
    },
  ]);

  const { provider, setAccount, account } = useWallet<IProviderApi>();

  const onConnectWallet = async (selectedWallet: IKnownWallet) => {
    const providerDetail = walletsRef.current?.find((w) => w.uuid === selectedWallet.id);
    if (!providerDetail) {
      return Promise.reject('Wallet not found');
    }

    const provider = get(window, providerDetail?.inject || '') as IProviderApi | undefined;

    if (!provider) {
      toast({
        title: 'Wallet not found',
        description: 'Please install the wallet extension',
      });
      return {
        provider: undefined as unknown as IProviderApi,
        address: '',
      };
    }

    const accounts = await provider?.requestAccounts();
    const network = await provider?.getNetwork();

    return {
      provider,
      address: accounts[0],
      chainId: network,
    };
  };

  useEffect(() => {
    const accountsChangedHandler = (accounts: string[]) => {
      console.log('neo [accountsChanged]', accounts);

      if (accounts.length) {
        setAccount({
          ...account,
          address: accounts[0],
        });
      }
    };

    const networkChangedHandler = (network: string) => {
      console.log('neo [networkChanged]', network);

      if (network) {
        setAccount({
          ...account,
          chainId: network,
        });
      }
    };

    provider?.on('accountsChanged', accountsChangedHandler);
    provider?.on('networkChanged', networkChangedHandler);

    return () => {
      provider?.removeListener('accountsChanged', accountsChangedHandler);
      provider?.removeListener('networkChanged', networkChangedHandler);
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
                name: wallet.name,
              };
            }),
          );
        }}
        onConnect={onConnectWallet}
      />

      <ApiGroup title="Basics">
        <ApiPayload
          title="requestAccounts"
          description="Request connection to wallet and get accounts"
          disableRequestContent
          allowCallWithoutProvider={true}
          onExecute={async () => {
            const res = await provider?.requestAccounts();
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="getAccounts"
          description="Get current account addresses"
          disableRequestContent
          onExecute={async () => {
            const res = await provider?.getAccounts();
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="getProvider"
          description="Get provider information"
          disableRequestContent
          onExecute={async () => {
            const res = await provider?.getProvider();
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="getNetwork"
          description="Get current network"
          disableRequestContent
          onExecute={async () => {
            const res = await provider?.getNetwork();
            return res;
          }}
        />

        <ApiPayload
          title="switchNetwork"
          description="Switch current network"
          presupposeParams={params.switchNetwork}
          onExecute={async (request: string) => {
            const res = await provider?.switchNetwork(request);
            return res;
          }}
        />
      </ApiGroup>

      <ApiGroup title="Read Methods">
        <ApiPayload
          title="invokeRead"
          description="Execute a contract invocation in read-only mode"
          presupposeParams={params.invokeRead}
          onExecute={async (request: string) => {
            const params = JSON.parse(request);
            const res = await provider?.invokeRead(params);
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>

      <ApiGroup title="Sign Message">
        <ApiPayload
          title="signMessage"
          description="Sign a message"
          presupposeParams={params.signMessage}
          onExecute={async (request: string) => {
            const res = await provider?.signMessage(request);
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>

      <DappList dapps={dapps} />
    </>
  );
}
