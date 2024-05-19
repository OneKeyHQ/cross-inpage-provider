/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { dapps } from './dapps.config';
import ConnectButton from '@/components/connect/ConnectButton';
import { useRef, useState } from 'react';
import { bytesToHex } from '@noble/hashes/utils';
import { get } from 'lodash';
import { IProviderApi, IProviderInfo } from './types';
import { ApiPayload, ApiGroup } from '@/components/ApisContainer';
import { useWallet } from '@/components/connect/WalletContext';
import type { IKnownWallet } from '@/components/connect/types';
import DappList from '@/components/DAppList';
import InfoLayout from '@/components/InfoLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const networks = ['cosmoshub-4'];

export default function Example() {
  const walletsRef = useRef<IProviderInfo[]>([
    {
      uuid: 'injected',
      name: 'Injected Wallet',
      inject: 'keplr',
    },
    {
      uuid: 'injected-onekey',
      name: 'Injected OneKey',
      inject: '$onekey.cosmos',
    },
  ]);

  const { provider } = useWallet<IProviderApi>();

  const [network, setNetwork] = useState<string>(networks[0]);

  const onConnectWallet = async (selectedWallet: IKnownWallet) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const providerDetail = walletsRef.current?.find((w) => w.uuid === selectedWallet.id);
    if (!providerDetail) {
      return Promise.reject('Wallet not found');
    }

    const provider = get(window, providerDetail.inject) as IProviderApi | undefined;

    
    await provider?.enable(network);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, no-unsafe-optional-chaining
    const { bech32Address } = await provider?.getKey(network);

    return {
      provider,
      address: bech32Address,
    };
  };

  return (
    <>
      <InfoLayout title="Base Info">
        <Select defaultValue={network} onValueChange={setNetwork}>
          <SelectTrigger className="w-full">
            <SelectValue className="text-base font-medium" placeholder="选择参数" />
          </SelectTrigger>
          <SelectContent>
            {networks.map((item) => {
              return (
                <SelectItem key={item} value={item} className="text-base font-medium">
                  {item}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </InfoLayout>

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
          title="getKey"
          description="获取账户权限"
          onExecute={async (request: string) => {
            const res = await provider?.getKey(network);
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>

      <DappList dapps={dapps} />
    </>
  );
}
