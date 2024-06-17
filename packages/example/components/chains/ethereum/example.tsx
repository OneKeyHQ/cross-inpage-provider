/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { dapps } from './dapps.config';
import ConnectButton from '../../../components/connect/ConnectButton';
import { useEffect, useRef } from 'react';
import { get } from 'lodash';
import { IEIP6963AnnounceProviderEvent, IEIP6963ProviderDetail, IEthereumProvider } from './types';
import { ApiPayload, ApiGroup } from '../../ApiActuator';
import { useWallet } from '../../../components/connect/WalletContext';
import type { IKnownWallet } from '../../../components/connect/types';
import DappList from '../../../components/DAppList';
import params from './params';
import { ecrecover, pubToAddress, toBuffer, bufferToHex } from 'ethereumjs-util';
import {
  SignTypedDataVersion,
  recoverPersonalSignature,
  recoverTypedSignature,
} from '@metamask/eth-sig-util';
import { toast } from '../../ui/use-toast';

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

  const { provider, account, setAccount } = useWallet<IEthereumProvider>();

  const onConnectWallet = async (selectedWallet: IKnownWallet) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const providerDetail = walletsRef.current?.find((w) => w.info.uuid === selectedWallet.id);
    if (!providerDetail) {
      return Promise.reject('Wallet not found');
    }

    const provider =
      providerDetail.provider ??
      (get(window, providerDetail.info.inject) as IEthereumProvider | undefined);

    if (!provider) {
      toast({
        title: 'Wallet not found',
        description: 'Please install the wallet extension',
      });
      return;
    }

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

  useEffect(() => {
    const accountsChangedHandler = (accounts: string[]) => {
      console.log('evm [accountsChanged]', accounts);

      if (accounts.length) {
        setAccount({
          ...account,
          address: accounts[0],
        });
      }
    };

    const chainChangedHandler = (chainId: string) => {
      console.log('evm [chainChanged]', chainId);

      if (chainId) {
        setAccount({
          ...account,
          chainId: chainId,
        });
      }
    };
    const connectHandler = (connectInfo: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      console.log('evm [connect]', connectInfo);
    };
    const disconnectHandler = (error: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      console.log('evm [disconnect]', error);
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
          title="eth_requestAccounts"
          description="获取账户"
          disableRequestContent
          onExecute={async () => {
            const res = await provider?.request({
              'method': 'eth_requestAccounts',
              'params': [],
            });
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="wallet_getPermissions"
          description="（暂不支持）获取权限"
          disableRequestContent
          onExecute={async () => {
            const res = await provider?.request({
              'method': 'wallet_getPermissions',
              'params': [],
            });
            return JSON.stringify(res);
          }}
        />{' '}
        <ApiPayload
          title="wallet_revokePermissions"
          description="（暂不支持）删除权限"
          presupposeParams={params.revokePermissions}
          onExecute={async () => {
            const res = await provider?.request({
              'method': 'wallet_revokePermissions',
              'params': [],
            });
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="eth_coinbase"
          description="返回 coinbase 地址"
          disableRequestContent
          onExecute={async (request) => {
            const res = await provider?.request({
              'method': 'eth_coinbase',
              'params': [],
            });
            return res as string;
          }}
        />
        <ApiPayload
          title="eth_accounts"
          description="返回地址"
          disableRequestContent
          onExecute={async (request) => {
            const res = await provider?.request({
              'method': 'eth_accounts',
              'params': [],
            });
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="eth_chainId"
          description="返回 chainId"
          disableRequestContent
          onExecute={async (request) => {
            const res = await provider?.request({
              'method': 'eth_chainId',
              'params': [],
            });
            return res as string;
          }}
        />
        <ApiPayload
          title="net_version"
          description="返回 net version"
          disableRequestContent
          onExecute={async (request) => {
            const res = await provider?.request({
              'method': 'net_version',
              'params': [],
            });
            return res as string;
          }}
        />
        <ApiPayload
          title="isConnected"
          description="isConnected"
          disableRequestContent
          allowCallWithoutProvider
          onExecute={async (request: string) => {
            // @ts-expect-error
            const res = (await provider?.isConnected()) ?? false;
            return res as string;
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
      </ApiGroup>

      <ApiGroup title="Chain">
        <ApiPayload
          title="wallet_addEthereumChain"
          description="(暂不支持) 添加 Chain"
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
          title="wallet_switchEthereumChain"
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
          title="eth_getEncryptionPublicKey"
          description="（已经弃用）获取公钥"
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
          description="（已经弃用）ethDecrypt"
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
          description="存在严重安全风险，已经废弃，硬件无法使用"
          presupposeParams={params.ethSign}
          onExecute={async (request: string) => {
            const res = await provider?.request({
              'method': 'eth_sign',
              'params': [account.address, request],
            });
            return res as string;
          }}
          onValidate={async (request: string, response: string) => {
            const signatureBuffer = toBuffer(response);
            const r = signatureBuffer.slice(0, 32);
            const s = signatureBuffer.slice(32, 64);
            const v = bufferToHex(signatureBuffer.slice(64, 65));

            const publicKey = ecrecover(toBuffer(request), v, r, s);
            const addrBuf = pubToAddress(publicKey);
            const recoveredAddress = bufferToHex(addrBuf);

            console.log('recoveredAddress', recoveredAddress, account?.address);

            return Promise.resolve(
              (recoveredAddress?.toLowerCase() === account?.address?.toLowerCase()).toString(),
            );
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
            return res as string;
          }}
          onValidate={async (request: string, response: string) => {
            const res = recoverPersonalSignature({ data: request, signature: response });
            return Promise.resolve((res === account.address).toString());
          }}
        />

        <ApiPayload
          title="personal_ecRecover"
          description="通过 personal_sign 签名的数据恢复地址"
          presupposeParams={params.personalEcRecover}
          onExecute={async (request) => {
            const requestObj = JSON.parse(request);
            const res = await provider?.request({
              'method': 'personal_ecRecover',
              'params': [requestObj.message, requestObj.signature],
            });
            return res as string;
          }}
          onValidate={async (request: string, response: string) => {
            return Promise.resolve((response === account.address).toString());
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
            return res as string;
          }}
          onValidate={async (request: string, response: string) => {
            const res = recoverTypedSignature({
              data: JSON.parse(request),
              signature: response,
              version: SignTypedDataVersion.V1,
            });
            return Promise.resolve((res === account.address).toString());
          }}
        />

        <ApiPayload
          title="eth_signTypedData_v3"
          description="SignTypedData V3"
          // @ts-expect-error
          presupposeParams={params.signTypedDataV3(Number(account?.chainId ?? '0x1', 'hex'))}
          onExecute={async (request) => {
            const res = await provider?.request({
              'method': 'eth_signTypedData_v3',
              'params': [account.address, request],
            });
            return res as string;
          }}
          onValidate={async (request: string, response: string) => {
            const res = recoverTypedSignature({
              data: JSON.parse(request),
              signature: response,
              version: SignTypedDataVersion.V3,
            });
            return Promise.resolve((res === account.address).toString());
          }}
        />

        <ApiPayload
          title="eth_signTypedData_v4"
          description="SignTypedData V4"
          // @ts-expect-error
          presupposeParams={params.signTypedDataV4(Number(account?.chainId ?? '0x1', 'hex'))}
          onExecute={async (request) => {
            const res = await provider?.request({
              'method': 'eth_signTypedData_v4',
              'params': [account.address, request],
            });
            return res as string;
          }}
          onValidate={async (request: string, response: string) => {
            const res = recoverTypedSignature({
              data: JSON.parse(request),
              signature: response,
              version: SignTypedDataVersion.V4,
            });
            return Promise.resolve((res === account.address).toString());
          }}
        />
      </ApiGroup>

      <ApiGroup title="Transaction">
        <ApiPayload
          title="eth_signTransaction"
          description="(不支持)签名交易"
          presupposeParams={params.sendTransaction(account?.address ?? '', account?.address ?? '')}
          onExecute={async (request: string) => {
            const res = await provider?.request({
              'method': 'eth_signTransaction',
              'params': [JSON.parse(request)],
            });
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="eth_sendTransaction"
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
