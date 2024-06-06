/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable no-unsafe-optional-chaining */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
import { Blockfrost, Lucid, type SignedMessage } from 'lucid-cardano';
import { InputWithSave } from '../../InputWithSave';

// https://use-cardano.alangaming.com/
// https://github.com/spacebudz/lucid

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

  const { provider, setAccount,account } = useWallet<IProviderApi>();
  const projectIdRef = useRef<string | null>(null);

  const [walletApi, setWalletApi] = useState<any | null>(null);
  const [lucid, setLucid] = useState<Lucid | null>(null);

  const onConnectWallet = async (selectedWallet: IKnownWallet) => {
    if (!projectIdRef.current || !process.env.NEXT_PUBLIC_BLOCKFROST_CARDANO_PROJECT_ID) {
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

    let projectId = projectIdRef.current
    if(!projectId || isEmpty(projectId)) {
      projectId = process.env.NEXT_PUBLIC_BLOCKFROST_CARDANO_PROJECT_ID
    }
    const lucid = await Lucid.new(
      // test id
      new Blockfrost('https://cardano-mainnet.blockfrost.io/api/v0', projectIdRef.current),
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
    if (!provider) return
    
    const onConnectListener = (address: string) => {
      console.log(`cardano on [connect] ${address}`);
    }
    const onAccountChangeListener = (address: string) => {
      console.log(`cardano on [accountChange] ${address}`);
      if(!address) return
      setAccount({
        ...account,
        address,
      });
    }
  
    provider.on('connect',onConnectListener)
    provider.on('accountChanged', onAccountChangeListener);

    return () => {
      provider.removeListener('connect', onConnectListener);
      provider.removeListener('accountChanged', onAccountChangeListener);
    }
  }, [account, provider, setAccount])

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
          .filter((name)=>['onekey','lace','nami','yoroi'].includes(name)).map((key) => {
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
            return JSON.stringify(provider?.apiVersion);
          }}
        />
        <ApiPayload
          title="name"
          description="获取钱包名称"
          disableRequestContent
          onExecute={async (request: string) => {
            return JSON.stringify(provider?.name);
          }}
        />
        <ApiPayload
          title="icon"
          description="获取图标"
          disableRequestContent
          onExecute={async (request: string) => {
            return JSON.stringify(provider?.icon);
          }}
        />
        <ApiPayload
          title="supportedExtensions"
          description="获取支持的扩展"
          disableRequestContent
          onExecute={async (request: string) => {
            return JSON.stringify(provider?.supportedExtensions);
          }}
        />
        <ApiPayload
          title="getExtensions"
          description="获取扩展"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await provider?.getExtensions();
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="getNetworkId"
          description="获取网络 ID"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await provider?.getNetworkId();
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
        /><ApiPayload
          title="getRewardAddresses"
          description="获取奖励地址"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await walletApi?.getRewardAddresses();
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
        /><ApiPayload
          title="getUtoxs"
          description="获取 UTXO 列表"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await walletApi?.getUtoxs();
            return JSON.stringify(res);
          }}
        /><ApiPayload
          title="getCollateral"
          description="获取抵押物"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await walletApi?.getCollateral();
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

            const signedMessage = JSON.parse(response) as SignedMessage

            console.log('signedMessage', signedMessage);
          
            const res = lucid.verifyMessage(
              account.address,
              request,
              signedMessage,
            );
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
          generateRequestFrom={() => {
            return (
              <>
                <Input
                  label="转账地址"
                  type="text"
                  name="toAddress"
                  defaultValue={account?.address ?? ''}
                />
                <Input
                  label="转账金额(最小值大约 0.96 ADA)"
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

            console.log('toAddress', toAddress);
            console.log('amount', amount);

            if (!walletApi) {
              throw new Error('walletApi is required');
            }

            if (!toAddress || !amount) {
              throw new Error('toAddress or amount is required');
            }

            try {
              
            
            const tx = await lucid
              .newTx()
              .payToAddress(toAddress, { lovelace: BigInt(amount) })
              .complete();

            console.log('tx', tx.toString());

            return Promise.resolve(tx.toString());
          } catch (error) {
            console.log('error', error);
            
            throw error;   
          }
          }}
        />
        <ApiPayload
          title="submitTx"
          description="广播交易"
          presupposeParams={[{
            id: 'submitTx',
            name: 'submitTx',
            value: '复制 signTx 签名结果到这里'          
          }]}
          onExecute={async (request: string) => {
            const res = await walletApi?.submitTx(request, true);
            return res as string;
          }}
        />
      </ApiGroup>
      <DappList dapps={dapps} />
    </>
  );
}
