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

  const { provider, setAccount, account } = useWallet<IProviderApi>();

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

  useEffect(() => {
    const accountsChangedHandler = (accounts: string[]) => {
      console.log('accountsChanged', accounts);

      if (accounts.length) {
        setAccount({
          ...account,
          address: accounts[0],
        });
      }
    };

    const chainChangedHandler = (chainId: string) => {
      console.log('chainChanged', chainId);

      if (chainId) {
        setAccount({
          ...account,
          chainId: chainId,
        });
      }
    };
    const connectHandler = (connectInfo: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      console.log('connect', connectInfo);
    };
    const disconnectHandler = (error: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      console.log('disconnect', error);
    };

    provider?.on('accountsChanged', accountsChangedHandler);
    provider?.on('chainChanged', chainChangedHandler);
    provider?.on('connect', connectHandler);
    provider?.on('disconnect', disconnectHandler);

    return () => {
      provider?.removeListener('accountsChanged', accountsChangedHandler);
      provider?.removeListener('chainChanged', chainChangedHandler);
      provider?.removeListener('connect', connectHandler);
      provider?.removeListener('disconnect', disconnectHandler);
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
          title="cfx_requestAccounts"
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
          title="enable"
          description="（废弃）连接钱包"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await provider?.enable();
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="isConnected"
          description="（isConnected"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await provider?.isConnected();
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="cfx_accounts"
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
          title="net_version"
          description="获取网络"
          disableRequestContent
          onExecute={async () => {
            const res = await provider?.request<string>({
              method: 'net_version',
            });
            return res;
          }}
        />
        <ApiPayload
          title="cfx_getMaxGasLimit"
          description="获取最大 Gas Limit"
          disableRequestContent
          onExecute={async () => {
            const res = await provider?.request<string[]>({
              method: 'cfx_getMaxGasLimit',
              params: [account.address],
            });
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="cfx_getNextUsableNonce"
          description="获取下一个可用 Nonce"
          disableRequestContent
          onExecute={async () => {
            const res = await provider?.request<string>({
              method: 'cfx_getNextUsableNonce',
              params: [account.address],
            });
            return res;
          }}
        />
        <ApiPayload
          title="wallet_getBalance"
          description="获取余额"
          disableRequestContent
          onExecute={async () => {
            const res = await provider?.request<string>({
              method: 'wallet_getBalance',
              params: [account.address],
            });
            return res;
          }}
        />
        <ApiPayload
          title="wallet_getBlockTime"
          description="获取区块时间"
          disableRequestContent
          onExecute={async () => {
            const res = await provider?.request<string[]>({
              method: 'wallet_getBlockTime',
            });
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="wallet_getBlockchainExplorerUrl"
          description="获取区块链浏览器地址"
          disableRequestContent
          onExecute={async () => {
            const res = await provider?.request<string[]>({
              method: 'wallet_getBlockchainExplorerUrl',
            });
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="wallet_requestPermissions"
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
          title="request"
          description="request 调用 eth 各种 RPC 方法"
          presupposeParams={params.requestMothed}
          onExecute={async (request: string) => {
            const requestObj = JSON.parse(request);
            const res = await provider?.request({
              method: requestObj.method,
              params: requestObj.params,
            });
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="send"
          description="send 调用 eth 各种 RPC 方法"
          presupposeParams={params.requestMothed}
          onExecute={async (request: string) => {
            const requestObj = JSON.parse(request);
            const res = await provider?.send({
              method: requestObj.method,
              params: requestObj.params,
            });
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="sendAsync"
          description="sendAsync 调用 eth 各种 RPC 方法"
          presupposeParams={params.requestMothed}
          onExecute={async (request: string) => {
            return new Promise((resolve) => {
              const requestObj = JSON.parse(request);
              provider?.sendAsync(
                {
                  method: requestObj.method,
                  params: requestObj.params,
                },
                (err, res) => {
                  resolve(JSON.stringify(res));
                },
              );
            });
          }}
        />
      </ApiGroup>
      <ApiGroup title="Chain">
        <ApiPayload
          title="wallet_addConfluxChain"
          description="（不需要支持）添加 Chain"
          presupposeParams={params.addConfluxChain}
          onExecute={async (request) => {
            const res = await provider?.request({
              'method': 'wallet_addConfluxChain',
              'params': [JSON.parse(request)],
            });
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="wallet_switchConfluxChain"
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
          title="wallet_watchAsset"
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
          title="cfx_signTypedData_v4"
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
          title="cfx_sendTransaction"
          description="发送交易"
          presupposeParams={params.sendTransaction(account?.address ?? '', account?.address ?? '')}
          onExecute={async (request: string) => {
            const res = await provider?.request({
              'method': 'cfx_sendTransaction',
              'params': [JSON.parse(request)],
            });
            return res as string;
          }}
        />{' '}
        <ApiPayload
          title="wallet_sendTransaction"
          description="发送交易"
          presupposeParams={params.sendTransaction(account?.address ?? '', account?.address ?? '')}
          onExecute={async (request: string) => {
            const res = await provider?.request({
              'method': 'wallet_sendTransaction',
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
