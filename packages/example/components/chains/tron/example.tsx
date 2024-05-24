/* eslint-disable no-unsafe-optional-chaining */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { dapps } from './dapps.config';
import ConnectButton from '../../../components/connect/ConnectButton';
import { useEffect, useRef } from 'react';
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
      inject: 'tronLink',
    },
    {
      uuid: 'injected-onekey',
      name: 'Injected OneKey',
      inject: '$onekey.tron',
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

    await provider?.request<string[]>({
      method: 'tron_requestAccounts',
    });

    const [address] = await provider.request<string[]>({
      method: 'tron_accounts',
    });

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
          description="连接钱包"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await provider?.request<string[]>({
              method: 'tron_requestAccounts',
            });
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="GetAccounts"
          description="获取账户"
          disableRequestContent
          onExecute={async () => {
            const res = await provider?.request<string[]>({
              method: 'tron_accounts',
            });
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>

      <ApiGroup title="Transfer">
        <ApiPayload
          title="Add Token"
          description="添加 TRC20 资产"
          presupposeParams={params.addToken}
          onExecute={async (request: string) => {
            const obj = JSON.parse(request);
            const res = await provider?.request<string>({
              method: 'wallet_watchAsset',
              params: obj,
            });
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="SignMessage"
          description="发送普通交易"
          presupposeParams={params.signMessage}
          onExecute={async (request: string) => {
            const tronWeb = provider.tronWeb;
            const signedString = await tronWeb.trx.sign(request);
            return JSON.stringify(signedString);
          }}
        />

        <ApiPayload
          title="NativeTransfer"
          description="发送普通交易"
          presupposeParams={params.nativeTransfer(account?.address ?? '')}
          onExecute={async (request: string) => {
            const [connectedAddress] = await provider.request<string[]>({
              method: 'tron_accounts',
            });

            

            const { to, amount } = JSON.parse(request);

            const tronWeb = provider.tronWeb;
            const tx = await tronWeb.transactionBuilder.sendTrx(to, amount, connectedAddress);
            const signedTx = await tronWeb.trx.sign(tx);
            const broastTx = await tronWeb.trx.sendRawTransaction(signedTx);
            return JSON.stringify(broastTx);
          }}
        />

        <ApiPayload
          title="SmartContractTransfer"
          description="发送合约交易"
          presupposeParams={params.contractTransfer(account?.address ?? '')}
          onExecute={async (request: string) => {
            const { contractAddress, contractFunction, options, params } = JSON.parse(request);

            const tronWeb = provider.tronWeb;
            const tx = await tronWeb.transactionBuilder.triggerSmartContract(
              contractAddress,
              contractFunction,
              options,
              params,
            );
            const signedTx = await tronWeb.trx.sign(tx.transaction);
            const broastTx = await tronWeb.trx.sendRawTransaction(signedTx);
            return JSON.stringify(broastTx);
          }}
        />
      </ApiGroup>
      <DappList dapps={dapps} />
    </>
  );
}
