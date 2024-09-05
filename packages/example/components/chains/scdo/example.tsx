/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { dapps } from './dapps.config';
import ConnectButton from '../../../components/connect/ConnectButton';
import { useRef } from 'react';
import { get } from 'lodash';
import { IProviderApi, IProviderInfo } from './types';
import { ApiPayload, ApiGroup } from '../../ApiActuator';
import { useWallet } from '../../../components/connect/WalletContext';
import type { IKnownWallet } from '../../../components/connect/types';
import DappList from '../../../components/DAppList';
import params from './params';
import { Input } from '../../ui/input';
import { ScdoNodeClient } from './rpc';

// https://demo.scdo.org/
export default function Example() {
  const walletsRef = useRef<IProviderInfo[]>([
    {
      uuid: 'injected',
      name: 'Injected Wallet',
      inject: 'scdo',
    },
    {
      uuid: 'injected-onekey',
      name: 'Injected OneKey',
      inject: '$onekey.scdo',
    },
  ]);

  const client = new ScdoNodeClient();

  const { account, provider } = useWallet<IProviderApi>();

  const onConnectWallet = async (selectedWallet: IKnownWallet) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const providerDetail = walletsRef.current?.find((w) => w.uuid === selectedWallet.id);
    if (!providerDetail) {
      return Promise.reject('Wallet not found');
    }

    const provider = get(window, providerDetail.inject) as IProviderApi | undefined;

    const [address] = await provider?.request<string[]>({ method: 'scdo_requestAccounts' });

    return {
      provider,
      address: address,
    };
  };

  const getTokenTransferFrom = (chainId: string | undefined, approve: boolean = false) => {
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
      </>
    );
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
        onDisconnect={async () => {
          await provider?.request({ method: 'scdo_disconnect' });
        }}
      />

      <ApiGroup title="Basics">
        <ApiPayload
          title="scdo_requestAccounts"
          description="请求链接账户"
          onExecute={async (request: string) => {
            return await provider?.request<string[]>({ method: 'scdo_requestAccounts' });
          }}
        />
        <ApiPayload
          title="scdo_getAccounts"
          description="获取账户"
          onExecute={async (request: string) => {
            return await provider?.request<string[]>({ method: 'scdo_getAccounts' });
          }}
        />
        <ApiPayload
          title="scdo_getBalance"
          description="获取账户余额"
          presupposeParams={[
            {
              id: 'scdo_getBalance',
              name: 'getBalance',
              value: account?.address,
            },
          ]}
          onExecute={async (request: string) => {
            const res = await provider?.request<string[]>({
              method: 'scdo_getBalance',
              params: [request ?? '', '', -1],
            });
            console.log('scdo_getBalance', res);

            return res;
          }}
        />
      </ApiGroup>

      <ApiGroup title="Sign Message">
        <ApiPayload
          title="scdo_signMessage"
          description="签署消息"
          onExecute={async (request: string) => {
            return await provider?.request<string>({
              method: 'scdo_signMessage',
              params: [request],
            });
          }}
          onValidate={async (request: string, response: string) => {
            return await provider?.request<string>({
              method: 'scdo_ecRecover',
              params: [request, response],
            });
          }}
        />
      </ApiGroup>

      <ApiGroup title="Sign Transaction">
        <ApiPayload
          title="scdo_estimateGas"
          description="估算交易费用"
          presupposeParams={params.estimateGas(account?.address ?? '', account?.address ?? '')}
          onExecute={async (request: string) => {
            const tx = JSON.parse(request);
            return await provider?.request<string>({
              method: 'scdo_estimateGas',
              params: [tx],
            });
          }}
        />
        <ApiPayload
          title="scdo_signTransaction"
          description="签署交易"
          presupposeParams={params.signTransaction(account?.address ?? '', account?.address ?? '')}
          onExecute={async (request: string) => {
            const tx = JSON.parse(request);
            return await provider?.request<string>({
              method: 'scdo_signTransaction',
              params: [tx],
            });
          }}
          generateRequestFrom={() => getTokenTransferFrom(account?.chainId)}
          onGenerateRequest={async (fromData: Record<string, any>) => {
            const from = account?.address ?? '';
            const to = fromData.toAddress ?? from;
            const amount = fromData.amount;

            if (!amount) {
              return 'Amount is required';
            }

            const nonce = await client.getNonce(from);
            console.log('nonce', nonce);

            return JSON.stringify({
              accountNonce: nonce,
              from: from,
              to: to,
              amount: amount,
              gasLimit: 21000,
              gasPrice: 1,
              payload: '',
            });
          }}
        />
        <ApiPayload
          title="scdo_sendTransaction"
          description="发送交易"
          presupposeParams={params.sendTransaction(account?.address ?? '', account?.address ?? '')}
          onExecute={async (request: string) => {
            const tx = JSON.parse(request);
            return await provider?.request<string>({
              method: 'scdo_sendTransaction',
              params: [tx],
            });
          }}
        />
      </ApiGroup>

      <DappList dapps={dapps} />
    </>
  );
}
