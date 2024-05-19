/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { dapps } from './dapps.config';
import ConnectButton from '@/components/connect/ConnectButton';
import { useEffect, useRef, useState } from 'react';
import { IProviderApi, IProviderInfo } from './types';
import { ApiPayload, ApiGroup } from '@/components/ApisContainer';
import { useWallet } from '@/components/connect/WalletContext';
import type { IKnownWallet } from '@/components/connect/types';
import DappList from '@/components/DAppList';
import {
  web3Accounts,
  web3AccountsSubscribe,
  web3Enable,
  web3FromSource,
} from '@polkadot/extension-dapp';
import { ApiPromise, WsProvider } from '@polkadot/api';

export default function Example() {
  const walletsRef = useRef<IProviderInfo[]>([]);

  const { provider, account } = useWallet<IProviderApi>();

  const [api, setApi] = useState<ApiPromise>();

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
      const wsProvider = new WsProvider('wss://rpc.polkadot.io');
      const api = await ApiPromise.create({ provider: wsProvider });
      setApi(api);
    })();
  }, [provider]);

  const onConnectWallet = async (selectedWallet: IKnownWallet) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const providerDetail = walletsRef.current?.find((w) => w.uuid === selectedWallet.id);
    if (!providerDetail) {
      return Promise.reject('Wallet not found');
    }

    const provider = providerDetail.provider;

    const [account] = await provider.accounts.get();

    return {
      provider,
      address: account.address,
    };
  };

  return (
    <>
      <ConnectButton<IProviderApi>
        fetchWallets={async () => {
          const allInjected = await web3Enable('Test Dapp');

          walletsRef.current = allInjected.map((injected) => ({
            uuid: injected.name,
            name: injected.name,
            provider: injected,
          }));

          console.log('walletsRef.current', walletsRef.current);

          return walletsRef.current.map((wallet) => {
            return {
              id: wallet.uuid,
              name: wallet.name,
            };
          });
        }}
        onConnect={onConnectWallet}
      />

      <ApiGroup title="Basics">
        <ApiPayload
          title="accounts get"
          description="获取账户权限"
          onExecute={async (request: string) => {
            const res = await provider?.accounts.get();
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="signRaw"
          description="签名消息"
          onExecute={async (request: string) => {
            const res = await provider?.signer.signRaw({
              data: request,
              address: account.address,
              type: 'bytes',
            });
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>

      <DappList dapps={dapps} />
    </>
  );
}
