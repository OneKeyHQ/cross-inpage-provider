/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { dapps } from './dapps.config';
import ConnectButton from '../../../components/connect/ConnectButton';
import { useCallback, useEffect, useRef, useState } from 'react';
import { get, isEmpty } from 'lodash';
import { IProviderApi, IProviderInfo } from './types';
import { ApiPayload, ApiGroup } from '../../ApiActuator';
import { useWallet } from '../../../components/connect/WalletContext';
import type { IKnownWallet } from '../../../components/connect/types';
import DappList from '../../../components/DAppList';
import params from './params';
import { verifyMessage } from '@unisat/wallet-utils';
import { toast } from '../../ui/use-toast';
import { Input } from '../../ui/input';
import { createPSBT } from './utils';
import * as bitcoin from 'bitcoinjs-lib';

function SignMessageApiPayload({ provider }: { provider: IProviderApi | undefined }) {
  const [allowValidate, setAllowValidate] = useState(true);

  return (
    <ApiPayload
      title="SignMessage"
      description="签名消息"
      presupposeParams={params.signMessage}
      onExecute={async (request: string) => {
        const obj = JSON.parse(request) as { msg: string; type: string | undefined };
        const res = await provider?.signMessage(obj.msg, obj.type);
        return res;
      }}
      onPresupposeParamChange={(paramId: string) => {
        console.log('paramId', paramId);

        if (paramId.indexOf('bip322-simple') > -1) {
          setAllowValidate(false);
        } else {
          setAllowValidate(true);
        }
      }}
      onValidate={
        allowValidate
          ? async (request: string, response: string) => {
              const obj = JSON.parse(request) as { msg: string; type: string | undefined };
              const publicKey = await provider?.getPublicKey();

              if (!obj.type || obj.type === 'ecdsa') {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return verifyMessage(publicKey, obj.msg, response);
              }

              return 'Dapp Example: 不支持 bip322-simple 类型签字的验证';
            }
          : undefined
      }
    />
  );
}

// https://docs.unisat.io/dev/unisat-developer-center/unisat-wallet
export default function BTCExample() {
  const walletsRef = useRef<IProviderInfo[]>([
    {
      uuid: 'injected',
      name: 'Injected Wallet',
      inject: 'unisat',
    },
    {
      uuid: 'injected-onekey',
      name: 'Injected OneKey',
      inject: '$onekey.btc',
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, no-unsafe-optional-chaining
    const [address] = await provider?.requestAccounts();
    const network = await provider?.getNetwork();

    return {
      provider,
      address,
      chainId: network,
    };
  };

  useEffect(() => {
    const accountsChangedHandler = (accounts: string[]) => {
      console.log('btc [accountsChanged]', accounts);

      if (accounts.length) {
        setAccount({
          ...account,
          address: accounts[0],
        });
      }
    };

    const networkChangedHandler = (network: string) => {
      console.log('btc [networkChanged]', network);

      if (network) {
        setAccount({
          ...account,
          chainId: network,
        });
      }
    };

    provider?.on('accountsChanged', accountsChangedHandler);
    provider?.on('networkChanged', networkChangedHandler);

    return () => {
      provider?.removeListener('accountsChanged', accountsChangedHandler);
      provider?.removeListener('networkChanged', networkChangedHandler);
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
          title="requestAccounts"
          description="请求连接 Wallet 获取账户"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await provider?.requestAccounts();
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="getAccounts"
          description="获取当前账户地址"
          disableRequestContent
          onExecute={async () => {
            const res = await provider?.getAccounts();
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="getPublicKey"
          description="获取当前账户公钥"
          disableRequestContent
          onExecute={async () => {
            const res = await provider?.getPublicKey();
            return res;
          }}
        />
        <ApiPayload
          title="getBalance"
          description="获取当前账户余额"
          disableRequestContent
          onExecute={async () => {
            const res = await provider?.getBalance();
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="getNetwork"
          description="获取当前网络"
          disableRequestContent
          onExecute={async () => {
            const res = await provider?.getNetwork();
            return res;
          }}
        />
        <ApiPayload
          title="switchNetwork"
          description="切换当前网络"
          presupposeParams={params.switchNetwork}
          onExecute={async (request: string) => {
            const res = await provider?.switchNetwork(request);
            return res;
          }}
        />
      </ApiGroup>

      <ApiGroup title="Sign Message">
        <SignMessageApiPayload provider={provider} />
      </ApiGroup>

      <ApiGroup title="Transaction">
        <ApiPayload
          title="sendBitcoin"
          description="发送交易"
          presupposeParams={params.sendBitcoin(account?.address ?? '')}
          onExecute={async (request: string) => {
            const obj = JSON.parse(request) as { toAddress: string; satoshis: number };
            const res = await provider?.sendBitcoin(obj.toAddress, obj.satoshis);
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="pushTx"
          description="广播交易"
          onExecute={async (request: string) => {
            if (!request || isEmpty(request)) {
              toast({
                title: 'Error',
                description: '请填写需要广播的交易信息',
              });
              throw new Error('request is empty');
            }

            const res = await provider?.pushTx({
              rawtx: request,
            });
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="signPsbt"
          description="signPsbt"
          presupposeParams={params.signPsbt}
          onExecute={async (request: string) => {
            const { psbtHex, options } = JSON.parse(request) as {
              psbtHex: string;
              options?: any;
            };
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const res = await provider?.signPsbt(psbtHex, options);

            const psbt = bitcoin.Psbt.fromHex(res);
            if (!options?.autoFinalized) {
              psbt.finalizeAllInputs();
            }
            return psbt.toHex();
          }}
          generateRequestFrom={() => {
            return (
              <>
                <Input
                  label="收款地址"
                  type="text"
                  name="toAddress"
                  defaultValue={account?.address ?? ''}
                />
                <Input label="转账金额" type="number" name="amount" defaultValue="1000" />
                <Input label="手续费 sat/vB" type="number" name="gasPrice" defaultValue="20" />
              </>
            );
          }}
          onGenerateRequest={async (fromData: Record<string, any>) => {
            const toAddress = fromData['toAddress'] as string;
            const amount = parseInt(fromData['amount'] as string);
            const gasPrice = parseInt((fromData['gasPrice'] as string) ?? '20');

            if (!toAddress || !amount) {
              throw new Error('toAddress or amount is required');
            }

            const psbt = createPSBT(
              account?.address ?? '',
              toAddress,
              amount,
              gasPrice,
              bitcoin.networks.bitcoin,
            );

            return Promise.resolve(psbt);
          }}
        />
        <ApiPayload
          title="signPsbts"
          description="signPsbts"
          presupposeParams={params.signPsbts}
          onExecute={async (request: string) => {
            const { psbtHexs, options } = JSON.parse(request) as {
              psbtHexs: string[];
              options?: any[];
            };
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const res = await provider?.signPsbts(psbtHexs, options);

            const result: string[] = [];
            res.forEach((psbt, index) => {
              const psbtObj = bitcoin.Psbt.fromHex(psbt);
              if (!options?.[index]?.autoFinalized) {
                psbtObj.finalizeAllInputs();
              }
              result.push(psbtObj.toHex());
            });

            return JSON.stringify(result);
          }}
          generateRequestFrom={() => {
            return (
              <>
                <Input
                  label="收款地址"
                  type="text"
                  name="toAddress"
                  defaultValue={account?.address ?? ''}
                />
                <Input label="转账金额" type="number" name="amount" defaultValue="1000" />
                <Input label="手续费 sat/vB" type="number" name="gasPrice" defaultValue="20" />
              </>
            );
          }}
          onGenerateRequest={async (fromData: Record<string, any>) => {
            const toAddress = fromData['toAddress'] as string;
            const amount = parseInt(fromData['amount'] as string);
            const gasPrice = parseInt((fromData['gasPrice'] as string) ?? '20');

            if (!toAddress || !amount) {
              throw new Error('toAddress or amount is required');
            }

            const psbt = await createPSBT(
              account?.address ?? '',
              toAddress,
              amount,
              gasPrice,
              bitcoin.networks.bitcoin,
            );

            const pabtObj = JSON.parse(psbt);

            return Promise.resolve(
              JSON.stringify({
                psbtHexs: [pabtObj.psbtHex],
                options: [pabtObj.options],
              }),
            );
          }}
        />
        <ApiPayload
          title="pushPsbt"
          description="pushPsbt"
          onExecute={async (request: string) => {
            if (!request || isEmpty(request)) {
              toast({
                title: 'Error',
                description: '请填写需要广播的交易信息',
              });
              throw new Error('request is empty');
            }
            const res = await provider?.pushPsbt(request);
            return res;
          }}
        />
      </ApiGroup>

      <DappList dapps={dapps} />
    </>
  );
}
