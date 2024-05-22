/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { dapps } from './dapps.config';
import ConnectButton from '../../../components/connect/ConnectButton';
import { useRef } from 'react';
import { get } from 'lodash';
import { IProviderApi, IProviderInfo } from './types';
import { ApiPayload, ApiGroup } from '../../../components/ApisContainer';
import { useWallet } from '../../../components/connect/WalletContext';
import type { IKnownWallet } from '../../../components/connect/types';
import DappList from '../../../components/DAppList';
import params from './params';

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

  const { provider, account } = useWallet<IProviderApi>();

  const onConnectWallet = async (selectedWallet: IKnownWallet) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const providerDetail = walletsRef.current?.find((w) => w.uuid === selectedWallet.id);
    if (!providerDetail) {
      return Promise.reject('Wallet not found');
    }

    const provider = get(window, providerDetail.inject) as IProviderApi | undefined;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, no-unsafe-optional-chaining
    const [address] = await provider?.requestAccounts();

    return {
      provider,
      address,
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
                name: wallet.name,
              };
            }),
          );
        }}
        onConnect={onConnectWallet}
      />

      <ApiGroup title="Basics">
        <ApiPayload
          title="RequestAccounts"
          description="请求连接 Wallet 获取账户"
          onExecute={async (request: string) => {
            const res = await provider?.requestAccounts();
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="GetAccounts"
          description="获取当前账户地址"
          onExecute={async () => {
            const res = await provider?.getAccounts();
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="GetPublicKey"
          description="获取当前账户公钥"
          onExecute={async () => {
            const res = await provider?.getPublicKey();
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="GetBalance"
          description="获取当前账户余额"
          onExecute={async () => {
            const res = await provider?.getBalance();
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="GetNetwork"
          description="获取当前网络"
          onExecute={async () => {
            const res = await provider?.getNetwork();
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="SwitchNetwork"
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
            return JSON.stringify(res);
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
          presupposeParams={params.pushTx}
          onExecute={async (request: string) => {
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
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="pushPsbt"
          description="pushPsbt"
          presupposeParams={params.pushPsbt}
          onExecute={async (request: string) => {
            const res = await provider?.pushPsbt(request);
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>

      <DappList dapps={dapps} />
    </>
  );
}
