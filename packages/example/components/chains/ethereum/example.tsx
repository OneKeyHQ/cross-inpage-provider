/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { dapps } from './dapps.config';
import ConnectButton from '../../../components/connect/ConnectButton';
import { useEffect, useRef } from 'react';
import { get } from 'lodash';
import { IEIP6963AnnounceProviderEvent, IEIP6963ProviderDetail, IEthereumProvider } from './types';
import { ApiPayload, ApiGroup } from '../../../components/ApisContainer';
import { useWallet } from '../../../components/connect/WalletContext';
import type { IKnownWallet } from '../../../components/connect/types';
import DappList from '../../../components/DAppList';
import params from './params';

export default function Example() {
  const walletsRef = useRef<IEIP6963ProviderDetail[]>([
    {
      info: {
        uuid: 'injected',
        name: 'Injected Wallet (EIP1193)',
        inject: 'ethereum',
      },
    },
    {
      info: {
        uuid: 'injected-onekey',
        name: 'Injected OneKey (EIP1193)',
        inject: '$onekey.ethereum',
      },
    },
  ]);

  const { provider, account } = useWallet<IEthereumProvider>();

  const onConnectWallet = async (selectedWallet: IKnownWallet) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const providerDetail = walletsRef.current?.find((w) => w.info.uuid === selectedWallet.id);
    if (!providerDetail) {
      return Promise.reject('Wallet not found');
    }

    const provider =
      providerDetail.provider ??
      (get(window, providerDetail.info.inject) as IEthereumProvider | undefined);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, no-unsafe-optional-chaining
    const [address] = (await provider?.request({
      'method': 'eth_requestAccounts',
      'params': [],
    })) as string[];

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const chainId = (await provider?.request({
      'method': 'eth_chainId',
      'params': [],
    })) as string;

    return {
      provider,
      address,
      chainId,
    };
  };

  useEffect(() => {
    const listener = (event: IEIP6963AnnounceProviderEvent) => {
      const { info, provider } = event.detail;
      const wallet = walletsRef.current.find((wallet) => wallet.info.uuid === info.uuid);
      if (!wallet) {
        walletsRef.current = [
          ...walletsRef.current,
          {
            info,
            provider,
          },
        ];
      }
    };

    // @ts-expect-error
    window.addEventListener('eip6963:announceProvider', listener);

    window.dispatchEvent(new Event('eip6963:requestProvider'));

    return () => {
      // @ts-expect-error
      window.removeEventListener('eip6963:announceProvider', listener);
    };
  }, []);

  return (
    <>
      <ConnectButton<IEthereumProvider>
        fetchWallets={() => {
          return Promise.resolve(
            walletsRef.current.map((wallet) => {
              return {
                id: wallet.info.uuid,
                name: wallet.info.inject ? wallet.info.name : `${wallet.info.name} (EIP6963)`,
                logo: wallet.info.icon,
              };
            }),
          );
        }}
        onConnect={onConnectWallet}
      />

      <ApiGroup title="Basics">
        <ApiPayload
          title="RequestPermissions"
          description="获取账户权限"
          presupposeParams={params.requestPermissions}
          onExecute={async (request: string) => {
            const res = await provider?.request({
              'method': 'wallet_requestPermissions',
              'params': [JSON.parse(request)],
            });
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="RequestAccounts"
          description="获取账户"
          onExecute={async () => {
            const res = await provider?.request({
              'method': 'eth_requestAccounts',
              'params': [],
            });
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="RevokePermissions"
          description="删除权限，暂时不支持"
          presupposeParams={params.revokePermissions}
          onExecute={async () => {
            const res = await provider?.request({
              'method': 'wallet_revokePermissions',
              'params': [],
            });
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>

      <ApiGroup title="Chain">
        <ApiPayload
          title="AddEthereumChain"
          description="添加 Chain"
          presupposeParams={params.addEthereumChain}
          onExecute={async (request: string) => {
            const res = await provider?.request({
              'method': 'wallet_addEthereumChain',
              'params': [JSON.parse(request)],
            });
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="SwitchEthereumChain"
          description="切换 Chain"
          presupposeParams={params.switchEthereumChain}
          onExecute={async (request) => {
            const res = await provider?.request({
              'method': 'wallet_switchEthereumChain',
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
          title="GetEncryptionPublicKey"
          description="获取公钥"
          onExecute={async () => {
            const res = await provider?.request({
              'method': 'eth_getEncryptionPublicKey',
              'params': [account.address],
            });
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="eth_decrypt"
          description="ethDecrypt"
          presupposeParams={params.ethDecrypt}
          onExecute={async (request: string) => {
            const res = await provider?.request({
              'method': 'eth_decrypt',
              'params': [request, account.address],
            });
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="eth_sign"
          description="eth_sign 存在严重安全风险，已经废弃"
          presupposeParams={params.ethSign}
          onExecute={async (request: string) => {
            const res = await provider?.request({
              'method': 'eth_sign',
              'params': [account.address, request],
            });
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="personal_sign"
          description="personal_sign"
          presupposeParams={params.personalSign}
          onExecute={async (request) => {
            const res = await provider?.request({
              'method': 'personal_sign',
              'params': [request, account.address, 'Example password'],
            });
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="eth_signTypedData"
          description="SignTypedData v1"
          presupposeParams={params.signTypedData}
          onExecute={async (request) => {
            const res = await provider?.request({
              'method': 'eth_signTypedData',
              'params': [JSON.parse(request), account.address],
            });
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="signTypedDataV3"
          description="SignTypedData V3"
          presupposeParams={params.signTypedDataV3}
          onExecute={async (request) => {
            const res = await provider?.request({
              'method': 'eth_signTypedData_v3',
              'params': [account.address, request],
            });
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="signTypedDataV4"
          description="SignTypedData V4"
          presupposeParams={params.signTypedDataV4}
          onExecute={async (request) => {
            const res = await provider?.request({
              'method': 'eth_signTypedData_v4',
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
              'method': 'eth_sendTransaction',
              'params': [JSON.parse(request)],
            });
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>
      <DappList dapps={dapps} />
    </>
  );
}
