/* eslint-disable no-unsafe-optional-chaining */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { dapps } from './dapps.config';
import ConnectButton from '../../../components/connect/ConnectButton';
import { use, useEffect, useRef, useState } from 'react';
import { get, isEmpty } from 'lodash';
import { IProviderApi, IProviderInfo } from './types';
import { ApiPayload, ApiGroup } from '../../ApiActuator';
import { useWallet } from '../../../components/connect/WalletContext';
import type { IKnownWallet } from '../../../components/connect/types';
import DappList from '../../../components/DAppList';
import params from './params';
import { InputWithSave } from '../../InputWithSave';
import { toast } from '../../ui/use-toast';

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

  const { provider, setAccount, account } = useWallet<IProviderApi>();
  const [receiveAddress, setReceiveAddress] = useState<string>('');

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

    let tronWeb;
    // @ts-expect-error
    if (provider.ready) {
      tronWeb = provider.tronWeb;
    } else {
      const res = await provider.request({ method: 'tron_requestAccounts' });
      // @ts-expect-error
      if (res.code === 200) {
        tronWeb = provider.tronWeb;
      }
    }

    const [address] = await provider.request<string[]>({ method: 'tron_accounts' });
    return {
      provider,
      // address: tronWeb.defaultAddress.base58,
      address: address,
    };
  };

  const checkReceiveAddress = () => {
    if (!receiveAddress || isEmpty(receiveAddress)) {
      toast({
        title: 'Invalid Address',
        description: '请在 Example 顶部填写接收地址，转账地址不能与发送地址相同',
      });
      throw new Error('Invalid Address');
    }

    if (account.address === receiveAddress) {
      toast({
        title: 'Invalid Address',
        description: '转账地址不能与发送地址相同',
      });
      throw new Error('Invalid Address');
    }
  };

  useEffect(() => {
    const accountsChangedHandler = (e: {
      data: {
        isTronLink: boolean;
        message: {
          action: string;
          data: any;
        };
      }
    }) => {
      console.log('tron on message', e.data);

      if (e.data.message && e.data.message.action === 'accountsChanged') {
        const { address } = e.data.message.data;
        setAccount({
          ...account,
          address,
        });
      }
      if (e.data.message && e.data.message.action === 'setNode') {
        // const { address } = e.data.message.data;
        // setAccount({
        //   ...account,
        //   address,
        // });
      }
    };

    window.addEventListener('message', accountsChangedHandler);

    return () => {
      window.removeEventListener('message', accountsChangedHandler);
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
      <ApiGroup title="转账地址">
        <InputWithSave
          storageKey="tron-receive-address"
          onChange={setReceiveAddress}
          defaultValue={account?.address}
        />
      </ApiGroup>

      <ApiGroup title="Basics">
        <ApiPayload
          title="tron_requestAccounts"
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
          title="tron_chainid"
          description="获取链 ID"
          disableRequestContent
          onExecute={async () => {
            const res = await provider?.request<string>({
              method: 'tron_chainid',
            });
            return res;
          }}
        />
        <ApiPayload
          title="tron_getProviderState"
          description="获取钱包状态"
          disableRequestContent
          onExecute={async () => {
            const res = await provider?.request<string>({
              method: 'tron_getProviderState',
            });
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="tron_accounts"
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

      <ApiGroup title="资产相关">
        <ApiPayload
          title="wallet_watchAsset"
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
      </ApiGroup>
      <ApiGroup title="SignMessage">
        <ApiPayload
          title="SignMessage"
          description="签名消息存在安全风险，硬件不支持"
          presupposeParams={params.signMessage}
          onExecute={async (request: string) => {
            const tronWeb = provider.tronWeb;
            const signedString = await tronWeb.trx.sign(request);
            return signedString as string;
          }}
          onValidate={async (request: string, result: string) => {
            const tronWeb = provider.tronWeb;

            let signedStr = result;
            const tail = signedStr.substring(128, 130);
            if (tail == '01') {
              signedStr = `${signedStr.substring(0, 128)}1c`;
            } else if (tail == '00') {
              signedStr = `${signedStr.substring(0, 128)}1b`;
            }

            // verify the signature
            const res = await tronWeb.trx.verifyMessage(
              request,
              signedStr,
              tronWeb.defaultAddress.base58,
            );

            return Promise.resolve(res.toString());
          }}
        />
        <ApiPayload
          title="SignMessage V2"
          description="签名消息"
          presupposeParams={params.signMessage}
          onExecute={async (request: string) => {
            const tronWeb = provider.tronWeb;
            const signedString = await tronWeb.trx.signMessageV2(request);
            return signedString as string;
          }}
          onValidate={async (request: string, result: string) => {
            const tronWeb = provider.tronWeb;

            // verify the signature
            const res = await tronWeb.trx.verifyMessageV2(request, result);
            const isValid = res === tronWeb.defaultAddress.base58;
            return Promise.resolve(isValid.toString());
          }}
        />
      </ApiGroup>
      <ApiGroup title="Transfer">
        <ApiPayload
          title="sign (NativeTransfer)"
          description="发送普通交易"
          presupposeParams={params.nativeTransfer(receiveAddress ?? '')}
          onExecute={async (request: string) => {
            checkReceiveAddress();

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
          title="sign (SmartContractTransfer)"
          description="发送合约交易"
          presupposeParams={params.contractTransfer(receiveAddress ?? '')}
          onExecute={async (request: string) => {
            checkReceiveAddress();

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
