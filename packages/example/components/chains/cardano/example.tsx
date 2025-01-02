/* eslint-disable @typescript-eslint/no-unused-vars, */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/require-await, @typescript-eslint/restrict-template-expressions */
import { dapps } from './dapps.config';
import ConnectButton from '../../../components/connect/ConnectButton';
import { useEffect, useRef, useState } from 'react';
import { get, isEmpty } from 'lodash';
import { IProviderApi, IProviderInfo } from './types';
import { ApiPayload, ApiGroup } from '../../ApiActuator';
import { useWallet } from '../../../components/connect/WalletContext';
import type { IKnownWallet } from '../../../components/connect/types';
import DappList from '../../../components/DAppList';
import params from './params';
import { toast } from '../../ui/use-toast';
import { Input } from '../../ui/input';
import { Blockfrost, Lucid, C, coreToUtxo } from 'lucid-cardano';
import type { WalletApi, SignedMessage } from 'lucid-cardano';
import { InputWithSave } from '../../InputWithSave';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';

// https://use-cardano.alangaming.com/
// https://github.com/spacebudz/lucid

function cborToAddress(cbor: string) {
  return C.Address.from_bytes(hexToBytes(cbor)).to_bech32(undefined);
}

// 添加代币配置
const TOKENS: Record<string, { unit: string; decimals: number }> = {
  ADA: {
    unit: 'lovelace',
    decimals: 6
  },
  MIN: {
    unit: '29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c64d494e',
    decimals: 6
  }
};

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

  const { provider, setAccount, account } = useWallet<IProviderApi>();
  const projectIdRef = useRef<string | null>(null);

  const [walletApi, setWalletApi] = useState<WalletApi | null>(null);
  const [lucid, setLucid] = useState<Lucid | null>(null);

  const onConnectWallet = async (selectedWallet: IKnownWallet) => {
    if (!projectIdRef.current && !process.env.NEXT_PUBLIC_BLOCKFROST_CARDANO_PROJECT_ID) {
      toast({
        title: 'Project ID is required',
        description: 'Please set the project ID in the input box above',
      });

      window.open('https://blockfrost.io/dashboard');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const providerDetail = walletsRef.current?.find((w) => w.uuid === selectedWallet.id);
    if (!providerDetail) {
      return Promise.reject('Wallet not found');
    }

    console.log('providerDetail', providerDetail);

    const provider = get(window, providerDetail.inject) as IProviderApi | undefined;

    console.log('provider', provider);

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

    let chainId;
    try {
      chainId = await walletApi.getNetworkId();
    } catch (error) {
      console.log('error', error);
    }

    let projectId = projectIdRef.current;
    if (!projectId || isEmpty(projectId)) {
      projectId = process.env.NEXT_PUBLIC_BLOCKFROST_CARDANO_PROJECT_ID;
    }
    const lucid = await Lucid.new(
      // test id
      new Blockfrost('https://cardano-mainnet.blockfrost.io/api/v0', projectId),
      'Mainnet',
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    lucid.selectWallet(walletApi);
    setLucid(lucid);

    const address = await lucid.wallet.address();

    return {
      provider,
      address,
      chainId: chainId.toString(),
    };
  };

  useEffect(() => {
    if (!provider) return;

    const onConnectListener = (address: string) => {
      console.log(`cardano on [connect] ${address}`);
    };
    const onAccountChangeListener = (address: string[]) => {
      console.log(`cardano on [accountChange] ${address}`);
      if (!address.length) return;
      setAccount({
        ...account,
        address: address[0],
      });
    };
    const onNetworkChangeListener = (network: any) => {
      console.log(`cardano on [networkChange] ${network}`);
    };

    const onAction = walletApi?.experimental?.on || provider?.on;

    if (onAction) {
      try {
        onAction?.('connect', onConnectListener);
        onAction?.('accountChange', onAccountChangeListener);
        onAction?.('networkChange', onNetworkChangeListener);
      } catch (error) {
        // ignore
      }
    }

    return () => {
      const offAction = provider?.experimental?.off || provider?.off;
      if (offAction) {
        try {
          offAction?.('connect', onConnectListener);
          offAction?.('networkChange', onAccountChangeListener);
          offAction?.('networkChange', onNetworkChangeListener);
        } catch (error) {
          // ignore
        }
      }
    };
  }, [account, provider, setAccount]);

  return (
    <>
      <ApiGroup title="Blockfrost Project ID">
        <div className="flex flex-col">
          <p>
            动态生成交易需要一个公开的 RPC 节点，在这里 https://cardano-mainnet.blockfrost.io
            创建一个 Project 复制 project_id 粘贴到这里（会自动保存）
          </p>
          <InputWithSave
            storageKey="cardano-wallet-projectid"
            onChange={(value) => (projectIdRef.current = value)}
          />
        </div>
      </ApiGroup>
      <ConnectButton<IProviderApi>
        fetchWallets={() => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          const wallets = Object.keys(window?.cardano ?? {})
            .filter((name) => ['onekey', 'lace', 'nami', 'yoroi'].includes(name))
            .map((key) => {
              return {
                uuid: key,
                name: key,
                inject: `cardano.${key}`,
              };
            });

          // walletsRef.current =   walletsRef.current + wallets 保证不会重复
          wallets.forEach((wallet) => {
            if (!walletsRef.current.find((w) => w.uuid === wallet.uuid)) {
              walletsRef.current.push(wallet);
            }
          });

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
          title="isEnabled"
          description="是否已经连接"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await provider?.isEnabled();
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="apiVersion"
          description="获取 API 版本"
          disableRequestContent
          onExecute={async (request: string) => {
            return provider?.apiVersion;
          }}
        />
        <ApiPayload
          title="name"
          description="获取钱包名称"
          disableRequestContent
          onExecute={async (request: string) => {
            return provider?.name;
          }}
        />
        <ApiPayload
          title="icon"
          description="获取图标"
          disableRequestContent
          onExecute={async (request: string) => {
            return provider?.icon;
          }}
        />
        <ApiPayload
          title="getNetworkId"
          description="获取网络 ID"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await walletApi?.getNetworkId();
            return res.toString();
          }}
        />
        <ApiPayload
          title="getUsedAddresses"
          description="获取地址列表。(origin 是接口原始信息，decode 是本网站解析的结果)"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await walletApi?.getUsedAddresses();
            const decode = res.map((address) => {
              return cborToAddress(address);
            });
            return JSON.stringify({
              origin: res,
              decode,
            });
          }}
        />
        <ApiPayload
          title="getUnusedAddresses"
          description="获取未使用地址。(origin 是接口原始信息，decode 是本网站解析的结果)"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await walletApi?.getUnusedAddresses();
            const decode = res.map((address) => {
              return cborToAddress(address);
            });
            return JSON.stringify({
              origin: res,
              decode,
            });
          }}
        />
        <ApiPayload
          title="getChangeAddress"
          description="获取找零地址。(origin 是接口原始信息，decode 是本网站解析的结果)"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await walletApi?.getChangeAddress();
            const address = cborToAddress(res);

            return JSON.stringify({
              origin: res,
              decode: address,
            });
          }}
        />
        <ApiPayload
          title="getRewardAddresses"
          description="获取奖励地址。(origin 是接口原始信息，decode 是本网站解析的结果)"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await walletApi?.getRewardAddresses();
            const decode = res.map((address) => {
              return cborToAddress(address);
            });
            return JSON.stringify({
              origin: res,
              decode,
            });
          }}
        />
        <ApiPayload
          title="getBalance"
          description="获取余额。(origin 是接口原始信息，decode 是本网站解析的结果)"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await walletApi?.getBalance();
            const decode = C.Value.from_bytes(hexToBytes(res));
            return JSON.stringify({
              origin: res,
              decode: JSON.parse(decode.to_json()),
            });
          }}
        />
        <ApiPayload
          title="getUtxos"
          description="获取 UTXO 列表。(origin 是接口原始信息，decode 是本网站解析的结果)"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await walletApi?.getUtxos();
            const decode = res.map((utxo) => {
              const decodeUtxo = C.TransactionUnspentOutput.from_bytes(hexToBytes(utxo));
              return coreToUtxo(decodeUtxo);
            });

            return JSON.stringify(
              {
                origin: res,
                decode,
              },
              (key, value) =>
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                typeof value === 'bigint' ? value.toString() : value,
            );
          }}
        />
        <ApiPayload
          title="getCollateral"
          description="（暂不支持）获取抵押物"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await walletApi?.experimental?.getCollateral();
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
            const res = await lucid.newMessage(account.address, request).sign();
            return JSON.stringify(res);
          }}
          onValidate={async (request: string, response: string) => {
            const signedMessage = JSON.parse(response) as SignedMessage;

            console.log('signedMessage', signedMessage);

            const res = lucid.verifyMessage(account.address, request, signedMessage);
            return Promise.resolve(JSON.stringify(res));
          }}
        />
      </ApiGroup>
      <ApiGroup title="Transafer">
        <ApiPayload
          title="signTx"
          description="签署交易"
          onExecute={async (request: string) => {
            // const res = await walletApi?.signTx(request, true);

            const signedTx = await lucid.fromTx(request).sign().complete();
            return signedTx.toString();
          }}
          // onValidate={async (request: string, response: string) => {
          //   return await walletApi?.submitTx(response);
          // }}
          generateRequestFrom={() => {
            return (
              <>
                <Input
                  label="收款地址"
                  type="text"
                  name="toAddress"
                  defaultValue={account?.address ?? ''}
                />
                <select
                  name="coin"
                  defaultValue="ADA"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {Object.keys(TOKENS).map(token => (
                    <option key={token} value={token}>{token}</option>
                  ))}
                </select>
                <Input
                  label="转账金额(转ADA最小值大约 0.96 ADA)"
                  type="number"
                  name="amount"
                  defaultValue="1000000"
                />
              </>
            );
          }}
          onGenerateRequest={async (fromData: Record<string, any>) => {
            const toAddress = fromData['toAddress'] as string;
            const amount = parseInt(fromData['amount'] as string);
            const coin = (fromData['coin'] as string)?.toUpperCase();

            if (!walletApi) {
              throw new Error('walletApi is required');
            }

            if (!toAddress || !amount) {
              throw new Error('toAddress or amount is required');
            }

            try {
              // 查找代币配置
              const tokenConfig = TOKENS[coin];
              if (!tokenConfig) {
                throw new Error(`不支持的代币: ${coin}`);
              }

              // 构建支付金额
              const assets: { [key: string]: bigint } = { [tokenConfig.unit]: BigInt(amount) };
              
              // 如果不是 ADA，需要添加最小 ADA 作为交易费
              if (coin !== 'ADA') {
                assets.lovelace = BigInt(2000000); // 添加 2 ADA 作为最小 ADA 要求
              }

              const tx = await lucid
                .newTx()
                .payToAddress(toAddress, assets)
                .complete({
                  coinSelection: true,
                });

              return Promise.resolve(tx.toString());
            } catch (error) {
              console.log('error', error);

              if (error === 'InputsExhaustedError') {
                throw new Error('余额不足, InputsExhaustedError');
              }

              throw error;
            }
          }}
        />
        <ApiPayload
          title="submitTx"
          description="广播交易"
          presupposeParams={[
            {
              id: 'submitTx',
              name: 'submitTx',
              value:
                '复制 signTx 签名结果到这里、然后点击执行。\nsignTx 验证流程会自动广播交易。重复广播会报错。',
            },
          ]}
          onExecute={async (request: string) => {
            const res = await walletApi?.submitTx(request);
            return res;
          }}
        />
      </ApiGroup>
      <DappList dapps={dapps} />
    </>
  );
}
