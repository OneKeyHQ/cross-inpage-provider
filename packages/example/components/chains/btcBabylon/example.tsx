/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
import { dapps } from './dapps.config';
import ConnectButton from '../../connect/ConnectButton';
import { useEffect, useRef } from 'react';
import { get, isEmpty } from 'lodash';
import { IProviderApi, IProviderInfo } from './types';
import { ApiPayload, ApiGroup } from '../../ApiActuator';
import { useWallet } from '../../connect/WalletContext';
import type { IKnownWallet } from '../../connect/types';
import DappList from '../../DAppList';
import params from './params';
import { verifyMessage } from '@unisat/wallet-utils';
import { toast } from '../../ui/use-toast';
import * as bitcoin from 'bitcoinjs-lib';
import { Input } from '../../ui/input';
import { createPSBT } from '../btc/utils';
import { Verifier } from 'bip322-js';

export default function BTCExample() {
  const walletsRef = useRef<IProviderInfo[]>([
    {
      uuid: 'injected',
      name: 'Injected Wallet',
      inject: 'btcwallet',
    },
    {
      uuid: 'injected-onekey',
      name: 'Injected OneKey',
      inject: '$onekey.btcwallet',
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

    return {
      provider,
      address,
    };
  };

  useEffect(() => {
    const accountsChangedHandler = (accounts: string[]) => {
      console.log('btc babylon [accountsChanged]', accounts);

      if (accounts.length) {
        setAccount({
          ...account,
          address: accounts[0],
        });
      }
    };

    const networkChangedHandler = (network: string) => {
      console.log('btc babylon [networkChanged]', network);

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
          title="connectWallet"
          description="请求连接 Wallet 获取账户"
          disableRequestContent
          allowCallWithoutProvider
          onExecute={async (request: string) => {
            const res = await provider?.connectWallet();
            console.log('connectWallet result:', res);
            return JSON.stringify(res, (key, value) => {
              if (['bridge', 'config', 'debugLogger', '_log'].indexOf(key) !== -1) {
                return undefined;
              }
              return value;
            });
          }}
        />
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
          title="getAddress"
          description="获取当前账户地址"
          disableRequestContent
          onExecute={async () => {
            const res = await provider?.getAddress();
            return res;
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
          title="getPublicKeyHex"
          description="获取当前账户公钥"
          disableRequestContent
          onExecute={async () => {
            const res = await provider?.getPublicKeyHex();
            return res;
          }}
        />
        <ApiPayload
          title="getBalance"
          description="获取当前账户余额"
          disableRequestContent
          onExecute={async () => {
            const res = await provider?.getBalance();
            return res.toString();
          }}
        />
        <ApiPayload
          title="getUtxos"
          description="获取当前账户 UTXO 列表"
          presupposeParams={params.getUtxos(account?.address ?? '')}
          onExecute={async (request: string) => {
            const {
              address,
              amount,
            }: {
              address: string;
              amount: number;
            } = JSON.parse(request);
            const res = await provider?.getUtxos(address, amount);
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="getWalletProviderName"
          description="获取当前钱包提供商名称"
          disableRequestContent
          onExecute={async () => {
            const res = await provider?.getWalletProviderName();
            return res.toString();
          }}
        />
        <ApiPayload
          title="getNetworkFees"
          description="获取当前网络费用"
          disableRequestContent
          onExecute={async () => {
            const res = await provider?.getNetworkFees();
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="getBTCTipHeight"
          description="获取 BTC 区块高度"
          disableRequestContent
          onExecute={async () => {
            const res = await provider?.getBTCTipHeight();
            return res?.toString();
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
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>

      <ApiGroup title="Sign Message">
        <ApiPayload
          title="SignMessage"
          description="签名消息"
          presupposeParams={params.signMessage}
          onExecute={async (request: string) => {
            const obj = JSON.parse(request) as { msg: string; type: string | undefined };
            const res = await provider?.signMessage(obj.msg, obj.type);
            return res;
          }}
          onValidate={async (request: string, response: string) => {
            const obj = JSON.parse(request) as { msg: string; type: string | undefined };
            const publicKey = await provider?.getPublicKey();

            if (!obj.type || obj.type === 'ecdsa') {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-return
              return verifyMessage(publicKey, obj.msg, response);
            }

            if (obj.type === 'bip322-simple') {
              return Verifier.verifySignature(account.address, obj.msg, response);
            }
            return 'Dapp Example: 不支持的类型签字的验证';
          }}
        />
        <ApiPayload
          title="SignMessageBIP322"
          description="签名消息 BIP322"
          presupposeParams={params.signMessageBip322}
          onExecute={async (request: string) => {
            const res = await provider?.signMessageBIP322(request);
            return res;
          }}
          onValidate={async (request: string, response: string) => {
            return Promise.resolve(Verifier.verifySignature(account.address, request, response));
          }}
        />
      </ApiGroup>

      <ApiGroup title="Transaction">
        <ApiPayload
          title="SendBitcoin"
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

            const network = await provider.getNetwork();

            const psbt = createPSBT(
              account?.address ?? '',
              toAddress,
              amount,
              gasPrice,
              network === 'livenet' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet,
            );

            return Promise.resolve(psbt);
          }}
          onValidate={async (request: string, response: string) => {
            const res = await provider?.pushPsbt(response);
            return JSON.stringify(res);
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

            const network = await provider.getNetwork();

            const psbt = await createPSBT(
              account?.address ?? '',
              toAddress,
              amount,
              gasPrice,
              network === 'livenet' ? bitcoin.networks.bitcoin : bitcoin.networks.testnet,
            );

            const pabtObj = JSON.parse(psbt);

            return Promise.resolve(
              JSON.stringify({
                psbtHexs: [pabtObj.psbtHex],
                options: [pabtObj.options],
              }),
            );
          }}
          onValidate={async (request: string, response: string) => {
            const [psbtHexs] = JSON.parse(response)
            return await provider?.pushPsbt(psbtHexs);
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
