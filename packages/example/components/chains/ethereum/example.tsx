/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-inferrable-types */
/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
import { dapps } from './dapps.config';
import TokenList from '@uniswap/default-token-list';
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
import { parseChainId } from './utils';
import maliciousCases from './case/transfer/malicious';
import malformedCases from './case/transfer/malformed';
import uniswapV2Cases from './case/transfer/uniswapV2';
import uniswapUniversalCases from './case/transfer/uniswapUniversal';
import sushiSwapCases from './case/transfer/sushiswap';
import morphoCases from './case/transfer/morpho';
import inchV5Cases from './case/transfer/inchV5';
import inchV6Cases from './case/transfer/inchV6';
import okxCases from './case/transfer/okx';
import {
  checkSupportNetwork,
  getSupportNetworkNames,
  MALICIOUS_ADDRESS,
} from './case/contract/SampleContracts';
import { IOption } from '../../ApiForm/ApiCombobox';
import { WalletWatchAsset, WrapAssets } from './components/ERC20';
import { WalletWatchAssetERC721 } from './components/ERC721';
import { WalletWatchAssetERC1155 } from './components/ERC1155';

type ITokenOption = {
  type: string;
  options: {
    address: string;
    symbol: string;
    decimals: number;
    image: string;
  };
};

const getTokens = (chainId: string) => {
  const tokens = TokenList.tokens.filter((token) => parseChainId(chainId) === token.chainId);
  const tokenOptions: IOption<ITokenOption>[] = tokens.map((token) => ({
    value: token.address,
    label: `${token.name} - ${token.address}`,
    extra: {
      type: 'ERC20',
      options: {
        address: token.address,
        symbol: token.symbol,
        decimals: token.decimals,
        image: token.logoURI,
      },
    },
  }));
  // 排序 USDC、USDT、DAI、WETH 优先
  tokenOptions.sort((a, b) => {
    const aName = a.extra.options.symbol;
    const bName = b.extra.options.symbol;
    const aPriority = ['USDC', 'USDT', 'WETH'].includes(aName) ? 0 : 1;
    const bPriority = ['USDC', 'USDT', 'WETH'].includes(bName) ? 0 : 1;
    return aPriority - bPriority;
  });
  return tokenOptions;
};

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
      console.log('evm eip6963 [listener]', event);
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

  const requestSendTransactionCommon = async (request: string) => {
    return await provider?.request({
      'method': 'eth_sendTransaction',
      'params': [JSON.parse(request)],
    });
  };

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
        />
        <ApiPayload
          title="wallet_revokePermissions"
          description="删除权限"
          presupposeParams={params.revokePermissions}
          onExecute={async (param) => {
            const res = await provider?.request({
              'method': 'wallet_revokePermissions',
              'params': [JSON.parse(param)],
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
          title="添加自定义网络"
          description="添加并切换到自定义 EVM 网络，请替换rpc和chainId"
          presupposeParams={[
            {
              id: 'networkConfig',
              name: '网络配置',
              value: JSON.stringify(
                {
                  chainId: '0x32', // 80
                  // chainName: "XDC",
                  // nativeCurrency: {
                  //   name: "XDC",
                  //   symbol: "XDC",
                  //   decimals: 18
                  // },
                  rpcUrls: ['https://rpc1.xinfin.network'],
                  // blockExplorerUrls: ["https://explorer.testnet.test"]
                },
                null,
                2,
              ),
              description: '自定义网络配置（可编辑）',
            },
          ]}
          onExecute={async (request: string) => {
            try {
              // 先尝试添加网络
              await provider?.request({
                method: 'wallet_addEthereumChain',
                params: [JSON.parse(request)],
              });

              // 添加成功后再切换网络
              await provider?.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: JSON.parse(request).chainId }],
              });

              return '网络添加并切换成功';
            } catch (error: any) {
              console.error('添加/切换网络失败:', error);
              throw error;
            }
          }}
        />

        <ApiPayload
          title="添加自定义代币"
          description="添加当前网络的自定义代币(默认添加Sepolia USDT)"
          presupposeParams={params.watchAssets(getTokens(account?.chainId ?? ''))}
          onExecute={async (request: string) => {
            try {
              const result = await provider?.request({
                method: 'wallet_watchAsset',
                params: JSON.parse(request),
              });

              return `代币添加${result ? '成功' : '失败'}`;
            } catch (error: any) {
              console.error('添加代币失败:', error);
              throw error;
            }
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
          description="存在严重安全风险，已经废弃（硬件无法使用）"
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
          onExecute={requestSendTransactionCommon}
        />
      </ApiGroup>

      <ApiGroup title="ERC20、ERC721、ERC1155 代币操作">
        <WalletWatchAsset chainId={account?.chainId} />
        <WalletWatchAssetERC721 chainId={account?.chainId} />
        <WalletWatchAssetERC1155 chainId={account?.chainId} />
        <WrapAssets chainId={account?.chainId} />
      </ApiGroup>

      <ApiGroup title="主流 dApp 操作模拟,只能验证交易解析，大部分用例无法执行交易">
        <ApiPayload
          title="UniSwap V2"
          description="测试 UniSwap V2 交易"
          presupposeParams={uniswapV2Cases.sendTransaction(
            account?.address ?? '',
            account?.address ?? '',
            account?.chainId,
          )}
          onExecute={async (request: string) => {
            const res = await provider?.request({
              'method': 'eth_sendTransaction',
              'params': [JSON.parse(request)],
            });
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="UniSwap Universal"
          description="测试 UniSwap Universal 交易"
          presupposeParams={uniswapUniversalCases.sendTransaction(
            account?.address ?? '',
            account?.address ?? '',
            account?.chainId,
          )}
          onExecute={async (request: string) => {
            const res = await provider?.request({
              'method': 'eth_sendTransaction',
              'params': [JSON.parse(request)],
            });
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="SushiSwap"
          description="测试 SushiSwap 交易"
          presupposeParams={sushiSwapCases.sendTransaction(
            account?.address ?? '',
            account?.address ?? '',
            account?.chainId,
          )}
          onExecute={async (request: string) => {
            const res = await provider?.request({
              'method': 'eth_sendTransaction',
              'params': [JSON.parse(request)],
            });
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="Morpho"
          description="测试 Morpho 交易"
          presupposeParams={morphoCases.sendTransaction(
            account?.address ?? '',
            account?.address ?? '',
            account?.chainId,
          )}
          onExecute={async (request: string) => {
            const res = await provider?.request({
              'method': 'eth_sendTransaction',
              'params': [JSON.parse(request)],
            });
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="InchV5"
          description="测试 InchV5 交易"
          presupposeParams={inchV5Cases.sendTransaction(
            account?.address ?? '',
            account?.address ?? '',
            account?.chainId,
          )}
          onExecute={async (request: string) => {
            const res = await provider?.request({
              'method': 'eth_sendTransaction',
              'params': [JSON.parse(request)],
            });
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="InchV6"
          description="测试 InchV6 交易"
          presupposeParams={inchV6Cases.sendTransaction(
            account?.address ?? '',
            account?.address ?? '',
            account?.chainId,
          )}
          onExecute={async (request: string) => {
            const res = await provider?.request({
              'method': 'eth_sendTransaction',
              'params': [JSON.parse(request)],
            });
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="OKX"
          description="测试 OKX 交易"
          presupposeParams={okxCases.sendTransaction(
            account?.address ?? '',
            account?.address ?? '',
            account?.chainId,
          )}
          onExecute={async (request: string) => {
            const res = await provider?.request({
              'method': 'eth_sendTransaction',
              'params': [JSON.parse(request)],
            });
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>

      <ApiGroup title="PPOM 恶意交易签名测试">
        <ApiPayload
          title="eth_sendTransaction"
          description="测试风险 Native 交易"
          onExecute={requestSendTransactionCommon}
          presupposeParams={maliciousCases.sendTransaction(
            account?.address ?? '',
            MALICIOUS_ADDRESS,
          )}
        />

        <ApiPayload
          title="eth_sendTransaction"
          description="测试风险合约调用"
          onExecute={(request: string) => {
            if (!checkSupportNetwork(parseChainId(account?.chainId))) {
              return Promise.resolve(`不支持的网络: 支持 ${getSupportNetworkNames().join(', ')}`);
            }
            return requestSendTransactionCommon(request);
          }}
          presupposeParams={maliciousCases.sendTransactionERC20(
            account?.address ?? '',
            account?.chainId ?? '',
          )}
        />

        <ApiPayload
          title="eth_signTypedData_v4"
          description="测试风险 eth_signTypedData_v4 交易"
          onExecute={async (request: string) => {
            if (!checkSupportNetwork(parseChainId(account?.chainId))) {
              return `不支持的网络: 支持 ${getSupportNetworkNames().join(', ')}`;
            }
            return await provider?.request({
              'method': 'eth_signTypedData_v4',
              'params': [account.address, request],
            });
          }}
          presupposeParams={maliciousCases.signTypedData(
            account?.address ?? '',
            parseInt(account?.chainId ?? '0x1', 16),
          )}
        />
      </ApiGroup>

      <ApiGroup title="参数缺失或不正确的交易 & 签名 （此部分交易都应该报错 或 无法执行）">
        <ApiPayload
          title="eth_sendTransaction"
          description="测试参数错误的 Native 交易"
          onExecute={requestSendTransactionCommon}
          presupposeParams={malformedCases.sendTransaction(
            account?.address ?? '',
            MALICIOUS_ADDRESS,
          )}
        />

        <ApiPayload
          title="eth_signTypedData_v4"
          description="测试参数错误的 eth_signTypedData_v4 交易"
          onExecute={async (request: string) => {
            return await provider?.request({
              'method': 'eth_signTypedData_v4',
              'params': [account.address, request],
            });
          }}
          presupposeParams={malformedCases.signTypedData(
            account?.address ?? '',
            parseInt(account?.chainId ?? '0x1', 16),
          )}
        />
      </ApiGroup>

      <DappList dapps={dapps} />
    </>
  );
}
