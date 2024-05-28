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
import { toast } from '../../ui/use-toast';

export default function BTCExample() {
  const walletsRef = useRef<IProviderInfo[]>([
    {
      uuid: 'injected',
      name: 'Injected Wallet',
      inject: 'webln',
    },
    {
      uuid: 'injected-onekey',
      name: 'Injected OneKey',
      inject: '$onekey.webln',
    },
  ]);

  const { provider } = useWallet<IProviderApi>();

  const onConnectWallet = async (selectedWallet: IKnownWallet) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const providerDetail = walletsRef.current?.find((w) => w.uuid === selectedWallet.id);
    if (!providerDetail) {
      return Promise.reject('Wallet not found');
    }

    const provider = get(window, providerDetail.inject) as IProviderApi | undefined;

    await provider?.enable();

    const {
      node: { pubkey },
    } = await provider?.getInfo();

    return {
      provider,
      pubkey,
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
          title="Enable"
          description="连接钱包"
          onExecute={async (request: string) => {
            const res = await provider?.enable();
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="GetInfo"
          description="获取 Info 信息"
          onExecute={async () => {
            const res = await provider?.getInfo();
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>
      <ApiGroup title="Message">
        <ApiPayload
          title="signMessage"
          description="signMessage"
          presupposeParams={params.signMessage}
          onExecute={async (request: string) => {
            const res = await provider?.signMessage(request);
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="verifyMessage"
          description="verifyMessage"
          presupposeParams={params.signMessage}
          onExecute={async (request: string) => {
            const res = await provider?.signMessage(request);
            await provider?.verifyMessage(res.signature, res.message);
            return 'success';
          }}
        />
      </ApiGroup>

      <ApiGroup title="Invoice">
        <ApiPayload
          title="makeInvoice"
          description="makeInvoice"
          presupposeParams={params.makeInvoice}
          onExecute={async (request: string) => {
            const obj = JSON.parse(request);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const res = await provider?.makeInvoice(obj);
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="sendPayment"
          description="支付 invoice，要通过 makeInvoice 生成 invoice，复制 paymentRequest 到 request 中"
          onExecute={async (request: string) => {
            if (!request) {
              toast({
                title: '请通过 makeInvoice 生成 invoice，复制 paymentRequest 到 request 中',
              });
              return;
            }
            const res = await provider?.sendPayment(request);
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="keysend"
          description="keysend"
          presupposeParams={params.keysend}
          onExecute={async (request: string) => {
            const obj = JSON.parse(request);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const res = await provider?.keysend(obj);
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>
      <DappList dapps={dapps} />
    </>
  );
}
