/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable no-unsafe-optional-chaining */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { dapps } from './dapps.config';
import ConnectButton from '../../../components/connect/ConnectButton';
import { useRef, useState } from 'react';
import { get } from 'lodash';
import { IProviderApi, IProviderInfo } from './types';
import { ApiPayload, ApiGroup } from '../../ApiActuator';
import { useWallet } from '../../../components/connect/WalletContext';
import type { IKnownWallet } from '../../../components/connect/types';
import DappList from '../../../components/DAppList';
import params from './params';
import { toast } from '../../ui/use-toast';

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

    if (!provider) {
      toast({
        title: 'Wallet not found',
        description: 'Please install the wallet extension',
      });
      return;
    }

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
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await provider?.enable();
            setWalletApi(res);
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="getUsedAddresses"
          description="获取地址列表"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await walletApi?.getUsedAddresses();
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="getUnusedAddresses"
          description="获取未使用地址"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await walletApi?.getUnusedAddresses();
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="getChangeAddress"
          description="获取找零地址"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await walletApi?.getChangeAddress();
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="getBalance"
          description="获取余额"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await walletApi?.getBalance();
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>
      <ApiGroup title="Sign Message">
        <ApiPayload
          title="signData"
          description="(报错) 签名消息"
          presupposeParams={params.signData}
          onExecute={async (request: string) => {
            const [address] = await walletApi?.getUsedAddresses();
            const res = await walletApi?.signData(
              address,
              Buffer.from(request, 'utf8').toString('hex'),
            );
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>

      <ApiGroup title="Transafer">
        <ApiPayload
          title="signTx"
          description="签署交易"
          presupposeParams={params.signTx}
          onExecute={async (request: string) => {
            const res = await walletApi?.signTx(request, true);
            setWalletApi(res);
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="submitTx"
          description="广播交易"
          onExecute={async (request: string) => {
            const res = await walletApi?.submitTx(request, true);
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>

      <DappList dapps={dapps} />
    </>
  );
}
