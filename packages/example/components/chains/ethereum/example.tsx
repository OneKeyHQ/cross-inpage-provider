/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-inferrable-types */
/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
import { dapps } from './dapps.config';
import TokenList from '@uniswap/default-token-list';
import { ethers } from 'ethers';
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
import { Input } from '../../ui/input';
import { isEqChainId, parseChainId } from './utils';
import { ApiForm, ApiFormRef, ApiComboboxRef } from '../../ApiForm';
import Contract721 from './case/contract/contract721.json';
import Contract1155 from './case/contract/contract1155.json';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../ui/card';
import maliciousCases from './case/transfer/malicious';
import malformedCases from './case/transfer/malformed';
import { MALICIOUS_ADDRESS } from './case/contract/SampleContracts';

const {
  nftsAbi,
  nftsBytecode
} = Contract721;

const {
  erc1155Abi,
  erc1155Bytecode
} = Contract1155;

const WalletWatchAsset = ({ chainId }: { chainId: string | undefined }) => {
  const apiFromRef = useRef<ApiFormRef>(null);
  const apiFromComboboxRef = useRef<ApiComboboxRef>(null);

  const { provider } = useWallet<IEthereumProvider>();

  useEffect(() => {
    const tokens = TokenList.tokens.filter((token) => parseChainId(chainId) === token.chainId);
    const tokenOptions = tokens.map((token) => ({
      value: token.address,
      label: token.name,
      extra: {
        type: 'ERC20',
        options: {
          address: token.address,
          symbol: token.symbol,
          decimals: token.decimals,
          image: token.logoURI,
        }
      }
    }));
    apiFromComboboxRef.current?.setOptions(tokenOptions);
  }, [chainId]);

  return <ApiForm title="wallet_watchAsset ERC20" description='添加 ERC20 资产' ref={apiFromRef}>
    <ApiForm.Combobox
      ref={apiFromComboboxRef}
      id="tokenSelector"
      label="预设参数"
      placeholder="请选择 ERC20 Token"
      onOptionChange={(option) => {
        apiFromRef.current?.setJsonValue('request', option?.extra);
      }}
    />

    <ApiForm.JsonEdit
      id="request"
      label="请求(可以手动编辑)"
      required
    />

    <ApiForm.Button
      id="watchButton"
      label="观察 Asset"
      onClick={async () => {
        const res = await provider?.request({
          'method': 'wallet_watchAsset',
          'params': JSON.parse(apiFromRef.current?.getValue('request') ?? ''),
        });
        apiFromRef.current?.setValue('response', JSON.stringify(res, null, 2));
      }}
      validation={{
        fields: ['request'],
        validator: (values) => {
          if (!values.request) {
            return '请选择 ERC20 Token';
          }
        }
      }}
    />

    <ApiForm.TextArea
      id="response"
      label="执行结果"
    />
  </ApiForm>
}

const WalletWatchAssetERC721 = ({ chainId }: { chainId: string | undefined }) => {
  const apiFromRef = useRef<ApiFormRef>(null);

  const { provider, account } = useWallet<IEthereumProvider>();

  let nftsContract: ethers.Contract
  let nftsFactory: ethers.ContractFactory

  return <ApiForm title="wallet_watchAsset ERC721" description='添加 ERC721 资产' ref={apiFromRef}>

    <Tabs defaultValue="deploy">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="deploy">部署合约</TabsTrigger>
        <TabsTrigger value="use">使用已有 ERC721 合约</TabsTrigger>
      </TabsList>
      <TabsContent value="deploy">
        <Card>
          <CardHeader>
            <CardTitle>部署 ERC721 合约</CardTitle>
            <CardDescription>
              部署 ERC721 合约，用于测试 wallet_watchAsset ERC721，尽量使用手续费低的链
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <ApiForm.Button
              id="deployButton"
              label="部署 ERC721 合约"
              onClick={async () => {
                try {
                  const ethersProvider = new ethers.providers.Web3Provider(provider, 'any');

                  nftsFactory = new ethers.ContractFactory(
                    nftsAbi,
                    nftsBytecode,
                    ethersProvider.getSigner(),
                  );

                  nftsContract = await nftsFactory.deploy();
                  await nftsContract.deployTransaction.wait();
                } catch (error) {
                  const reason = get(error, 'reason', undefined);
                  const message = get(error, 'message', undefined);
                  apiFromRef.current?.setJsonValue('deployResponse', reason || message);
                  throw error;
                }

                if (nftsContract.address === undefined) {
                  return;
                }

                console.log(
                  `Contract mined! address: ${nftsContract.address} transactionHash: ${nftsContract.deployTransaction.hash}`,
                );

                apiFromRef.current?.setValue('deployResponse', nftsContract.address);
              }}
            />

            <ApiForm.TextArea
              id="deployResponse"
              label="部署结果"
            />

            <ApiForm.Separator />

            <ApiForm.Field
              id="mintAmount"
              label="铸造数量"
              defaultValue="3"
              type="number"
              required
            />

            <ApiForm.Button
              id="mintButton"
              label="铸造"
              onClick={async () => {
                const mintAmount = apiFromRef.current?.getValue('mintAmount');
                try {
                  let result = await nftsContract.mintNFTs(mintAmount, {
                    from: account?.address,
                  });
                  result = await result.wait();
                } catch (error) {
                  apiFromRef.current?.setJsonValue('mintResponse', error);
                  throw error;
                }

                if (nftsContract.address === undefined) {
                  return;
                }

                apiFromRef.current?.setValue('mintResponse', nftsContract.address);
              }}
              validation={{
                fields: ['mintAmount'],
                validator: (values) => {
                  if (!values.mintAmount.value) {
                    return '请输入铸造数量';
                  }
                  if (!account) {
                    return '请连接钱包';
                  }
                  if (!nftsContract) {
                    return '请部署 ERC721 合约';
                  }
                }
              }}
            />

            <ApiForm.TextArea
              id="mintResponse"
              label="铸造结果"
            />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="use">
        <Card>
          <CardHeader>
            <CardTitle>使用 ERC721 合约</CardTitle>
            <CardDescription>
              使用当前帐户已经部署的 ERC721 合约，测试 wallet_watchAsset ERC721，在区块浏览器中查找 Owner 为当前帐户的 ERC721 资产，填写 Contract Address 和 TokenId 进行观察
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <ApiForm.Field
              id="watchContractAddress"
              label="已经部署的 ERC721 合约地址"
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>

    <ApiForm.Field
      id="watchTokenId"
      label="观察 TokenId"
      defaultValue="1"
      type="number"
      required
    />

    <ApiForm.Button
      id="watchButton"
      label="观察 Asset"
      onClick={async () => {
        const watchTokenId = apiFromRef.current?.getValue('watchTokenId');
        const watchContractAddress = apiFromRef.current?.getValue('watchContractAddress');
        const nftsContractAddress = nftsContract?.address ?? watchContractAddress;

        let watchNftsResult;
        try {
          watchNftsResult = await provider?.request({
            method: 'wallet_watchAsset',
            params: {
              type: 'ERC721',
              options: {
                address: nftsContractAddress,
                tokenId: watchTokenId,
              },
            },
          }
          );
        } catch (error) {
          console.error(error);
        }

        apiFromRef.current?.setValue('watchResponse', JSON.stringify(watchNftsResult, null, 2));
      }}
      validation={{
        fields: ['watchTokenId', 'watchContractAddress'],
        validator: (values) => {
          if (!values.watchTokenId?.value) {
            return '请输入观察 TokenId';
          }
          if (!account) {
            return '请连接钱包';
          }
          if (!nftsContract && !values.watchContractAddress?.value) {
            return '请部署 ERC721 合约 或 填写已经部署的 ERC721 合约地址';
          }
        }
      }}
    />

    <ApiForm.TextArea
      id="watchResponse"
      label="观察结果"
    />
  </ApiForm>
}

const WalletWatchAssetERC1155 = ({ chainId }: { chainId: string | undefined }) => {
  const apiFromRef = useRef<ApiFormRef>(null);

  const { provider, account } = useWallet<IEthereumProvider>();

  let erc1155Contract: ethers.Contract
  let erc1155Factory: ethers.ContractFactory

  return <ApiForm title="wallet_watchAsset ERC1155" description='添加 ERC1155 资产 尽量使用手续费低的链' ref={apiFromRef}>

    <Tabs defaultValue="deploy">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="deploy">部署合约</TabsTrigger>
        <TabsTrigger value="use">使用已有 ERC1155 合约</TabsTrigger>
      </TabsList>
      <TabsContent value="deploy">
        <Card>
          <CardHeader>
            <CardTitle>部署 ERC1155 合约</CardTitle>
            <CardDescription>
              部署 ERC1155 合约，用于测试 wallet_watchAsset ERC1155，尽量使用手续费低的链
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <ApiForm.Button
              id="deployButton"
              label="部署 ERC1155 合约"
              onClick={async () => {
                try {
                  const ethersProvider = new ethers.providers.Web3Provider(provider, 'any');

                  erc1155Factory = new ethers.ContractFactory(
                    erc1155Abi,
                    erc1155Bytecode,
                    ethersProvider.getSigner(),
                  );

                  erc1155Contract = await erc1155Factory.deploy();
                  await erc1155Contract.deployTransaction.wait();
                } catch (error) {
                  const reason = get(error, 'reason', undefined);
                  const message = get(error, 'message', undefined);
                  apiFromRef.current?.setJsonValue('deployResponse', reason || message);
                  throw error;
                }

                if (erc1155Contract.address === undefined) {
                  return;
                }

                console.log(
                  `Contract mined! address: ${erc1155Contract.address} transactionHash: ${erc1155Contract.deployTransaction.hash}`,
                );

                apiFromRef.current?.setValue('deployResponse', erc1155Contract.address);
              }}
            />

            <ApiForm.TextArea
              id="deployResponse"
              label="部署结果"
            />

            <ApiForm.Separator />

            <ApiForm.Field
              id="mintTokenId"
              label="铸造的 Token IDs"
              defaultValue="1, 2, 3"
              required
            />

            <ApiForm.Field
              id="mintAmount"
              label="Token IDs 对应铸造数量"
              defaultValue="1, 10, 100"
              required
            />

            <ApiForm.Button
              id="mintButton"
              label="铸造"
              onClick={async () => {
                const mintTokenIds = apiFromRef.current?.getValue('mintTokenId');
                const mintAmounts = apiFromRef.current?.getValue('mintAmount');
                try {
                  const params = [
                    account?.address,
                    mintTokenIds.split(',').map(Number),
                    mintAmounts.split(',').map(Number),
                    '0x',
                  ];
                  let result = await erc1155Contract.mintBatch(...params);
                  result = await result.wait();

                  console.log('mint success', result);
                } catch (error) {
                  const reason = get(error, 'reason', undefined);
                  const message = get(error, 'message', undefined);
                  apiFromRef.current?.setJsonValue('mintResponse', reason || message);
                  throw error;
                }

                if (erc1155Contract.address === undefined) {
                  return;
                }

                apiFromRef.current?.setValue('mintResponse', erc1155Contract.address);
              }}
              validation={{
                fields: ['mintTokenId', 'mintAmount'],
                validator: (values) => {
                  if (!values.mintTokenId.value) {
                    return '请输入铸造的 Token IDs';
                  }
                  if (!values.mintAmount.value) {
                    return '请输入铸造数量';
                  }

                  if (values.mintTokenId.value.split(',').length !== values.mintAmount.value.split(',').length) {
                    return '铸造的 Token IDs 和铸造数量数量不一致';
                  }

                  if (!account) {
                    return '请连接钱包';
                  }
                  if (!erc1155Contract) {
                    return '请部署 ERC1155 合约';
                  }
                }
              }}
            />

            <ApiForm.TextArea
              id="mintResponse"
              label="铸造结果"
            />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="use">
        <Card>
          <CardHeader>
            <CardTitle>使用 ERC1155 合约</CardTitle>
            <CardDescription>
              使用当前帐户已经部署的 ERC1155 合约，测试 wallet_watchAsset ERC1155，在区块浏览器中查找 Owner 为当前帐户的 ERC1155 资产，填写 Contract Address 和 TokenId 进行观察
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <ApiForm.Field
              id="watchContractAddress"
              label="已经部署的 ERC1155 合约地址"
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>

    <ApiForm.Field
      id="watchTokenId"
      label="观察 TokenId"
      defaultValue="1"
      type="number"
      required
    />

    <ApiForm.Button
      id="watchButton"
      label="观察 Asset"
      onClick={async () => {
        const watchContractAddress = apiFromRef.current?.getValue('watchContractAddress');
        const nftsContractAddress = erc1155Contract?.address ?? watchContractAddress;

        const watchTokenId = apiFromRef.current?.getValue('watchTokenId');
        let watchNftsResult;
        try {
          watchNftsResult = await provider?.request({
            method: 'wallet_watchAsset',
            params: {
              type: 'ERC1155',
              options: {
                address: nftsContractAddress,
                tokenId: watchTokenId,
              },
            },
          }
          );
        } catch (error) {
          console.error(error);
        }

        apiFromRef.current?.setValue('watchResponse', JSON.stringify(watchNftsResult, null, 2));
      }}
      validation={{
        fields: ['watchTokenId', 'watchContractAddress'],
        validator: (values) => {
          if (!values.watchTokenId.value) {
            return '请输入观察 TokenId';
          }
          if (!account) {
            return '请连接钱包';
          }
          if (!erc1155Contract && !values.watchContractAddress?.value) {
            return '请部署 ERC1155 合约 或 填写已经部署的 ERC1155 合约地址';
          }
        }
      }}
    />

    <ApiForm.TextArea
      id="watchResponse"
      label="观察结果"
    />
  </ApiForm>
}

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

  const getTokenTransferFrom = (chainId: string | undefined, approve: boolean = false) => {
    const tokens: {
      name: string;
      address: string;
    }[] = [];
    // EVM MainNet
    if (isEqChainId(chainId, '0x1')) {
      tokens.push({
        name: 'USDC',
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      });
      tokens.push({
        name: 'USDT',
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      });
    }
    // Polygon
    if (isEqChainId(chainId, '0x89')) {
      tokens.push({
        name: 'USDC.e',
        address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      });
      tokens.push({
        name: 'USDT',
        address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      });
      tokens.push({
        name: 'USDC',
        address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
      });
    }
    // BSC
    if (isEqChainId(chainId, '0x38')) {
      tokens.push({
        name: 'USDC',
        address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
      });
      tokens.push({
        name: 'anyUSDC',
        address: '0x8965349fb649A33a30cbFDa057D8eC2C48AbE2A2',
      });
    }
    // arb
    if (isEqChainId(chainId, '0xa4b1')) {
      tokens.push({
        name: 'USDC',
        address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      });
      tokens.push({
        name: 'USDT.e',
        address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
      });
      tokens.push({
        name: 'USDT',
        address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      });
    }
    // Optimism
    if (isEqChainId(chainId, '0xa')) {
      tokens.push({
        name: 'USDC',
        address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
      });
      tokens.push({
        name: 'USDC.e',
        address: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
      });
      tokens.push({
        name: 'USDT',
        address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
      });
    }

    if (!tokens.length) {
      tokens.push({
        name: 'MainNet USDC',
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      });
    }
    return (
      <>
        <Input
          label="收款地址"
          type="text"
          name="toAddress"
          defaultValue={account?.address ?? ''}
        />
        <Input label="金额" type="number" name="amount" defaultValue="10000" />

        {approve && (
          <>
            <div>
              <input id="max_approve" name="maxApprove" type="checkbox" />
              <label htmlFor="max_approve">无限授权</label>
            </div>
            <div>
              <input id="mock_uniswap" name="mockUniSwap" type="checkbox" />
              <label htmlFor="mock_uniswap">模拟 UniSwap（不传 Value）</label>
            </div>
          </>
        )}

        <select name="tokenAddress" className="select">
          <option selected>选择 Token</option>
          {tokens.map((token) => (
            <option value={token.address}>{token.name}</option>
          ))}
        </select>
      </>
    );
  };

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

      <ApiGroup title="eth_sendTransaction">
        <ApiPayload
          title="eth_sendTransaction"
          description="发送 ERC20 Token"
          onExecute={requestSendTransactionCommon}
          generateRequestFrom={() => getTokenTransferFrom(account?.chainId)}
          // @ts-expect-error
          onGenerateRequest={(fromData: Record<string, any>) => {
            const from = account?.address ?? '';
            const to = fromData.toAddress ?? from;
            const amount = fromData.amount;
            const tokenAddress = fromData.tokenAddress;

            if (!amount) {
              return 'Amount is required';
            }
            if (!tokenAddress) {
              return 'Token address is required';
            }

            return JSON.stringify({
              from: from,
              to: tokenAddress,
              data: `0xa9059cbb${to.substring(2).padStart(64, '0')}${BigInt(amount)
                .toString(16)
                .padStart(64, '0')}`,
              value: '0x0',
              gasLimit: '0x186a0',
              gasPrice: '0xbebc200',
            });
          }}
        />
        <ApiPayload
          title="eth_sendTransaction"
          description="授权 ERC20 Token，金额为 0 时表示取消授权"
          onExecute={requestSendTransactionCommon}
          generateRequestFrom={() => getTokenTransferFrom(account?.chainId, true)}
          // @ts-expect-error
          onGenerateRequest={(fromData: Record<string, any>) => {
            const from = account?.address ?? '';
            const to = fromData.toAddress ?? from;
            const amount = fromData.amount;
            const tokenAddress = fromData.tokenAddress;
            const maxApprove = fromData.maxApprove;
            const mockUniSwap = fromData.mockUniSwap;

            if (!amount) {
              return 'Amount is required';
            }
            if (!tokenAddress) {
              return 'Token address is required';
            }

            // maxApprove
            let approveAmount;
            if (maxApprove) {
              // 使用最大值 2^256 - 1 表示无限额度
              approveAmount = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
            } else {
              approveAmount = BigInt(amount).toString(16).padStart(64, '0');
            }

            const data = `0x095ea7b3${to.substring(2).padStart(64, '0')}${approveAmount}`;

            if (mockUniSwap) {
              return JSON.stringify({
                from: from,
                to: tokenAddress,
                data,
                gas: '0xc049',
              });
            }

            return JSON.stringify({
              from: from,
              to: tokenAddress,
              data,
              value: '0x0',
              gasLimit: '0x186a0',
              gasPrice: '0xbebc200',
            });
          }}
        />
      </ApiGroup>

      <ApiGroup title="wallet_watchAsset (EIP 747)">
        <WalletWatchAsset chainId={account?.chainId} />
        <WalletWatchAssetERC721 chainId={account?.chainId} />
        <WalletWatchAssetERC1155 chainId={account?.chainId} />
      </ApiGroup>

      <ApiGroup title="PPOM 恶意交易签名测试">
        <ApiPayload
          title="eth_sendTransaction"
          description="测试风险 Native 交易"
          onExecute={requestSendTransactionCommon}
          presupposeParams={maliciousCases.sendTransaction(account?.address ?? '', MALICIOUS_ADDRESS)}
        />

        <ApiPayload
          title="eth_sendTransaction"
          description="测试风险合约调用"
          onExecute={requestSendTransactionCommon}
          presupposeParams={maliciousCases.sendTransactionERC20(
            account?.address ?? '',
            account?.chainId ?? '',
          )}
        />

        <ApiPayload
          title="eth_signTypedData_v4"
          description="测试风险 eth_signTypedData_v4 交易"
          onExecute={async (request: string) => {
            return await provider?.request({
              'method': 'eth_signTypedData_v4',
              'params': [account.address, request],
            })
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
          presupposeParams={malformedCases.sendTransaction(account?.address ?? '', MALICIOUS_ADDRESS)}
        />

        <ApiPayload
          title="eth_signTypedData_v4"
          description="测试参数错误的 eth_signTypedData_v4 交易"
          onExecute={async (request: string) => {
            return await provider?.request({
              'method': 'eth_signTypedData_v4',
              'params': [account.address, request],
            })
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
