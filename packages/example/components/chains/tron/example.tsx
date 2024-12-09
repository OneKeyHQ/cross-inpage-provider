/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
/* eslint-disable no-unsafe-optional-chaining */
import { dapps } from './dapps.config';
import ConnectButton from '../../../components/connect/ConnectButton';
import { memo, useEffect, useRef, useState } from 'react';
import { get } from 'lodash';
import { IProviderApi, IProviderInfo } from './types';
import { ApiPayload, ApiGroup } from '../../ApiActuator';
import { useWallet } from '../../../components/connect/WalletContext';
import type { IKnownWallet } from '../../../components/connect/types';
import DappList from '../../../components/DAppList';
import params from './params';
import { InputWithSave } from '../../InputWithSave';
import { toast } from '../../ui/use-toast';
import { ApiComboboxRef, ApiForm, ApiFormRef } from '../../ApiForm';
import { okLinkRequest } from '../utils/OkLink';

const WalletWatchAsset = memo(() => {
  const apiFromRef = useRef<ApiFormRef>(null);
  const apiFromComboboxRef = useRef<ApiComboboxRef>(null);

  const { provider } = useWallet<IProviderApi>();

  useEffect(() => {
    okLinkRequest.getTokenList('TRON', 'TRC20').then((tokens) => {
      const tokenOptions = tokens.map((token) => ({
        value: token.tokenContractAddress,
        label: `${token.token} - ${token.tokenContractAddress}`,
        extra: {
          type: 'trc20',
          options: {
            address: token.tokenContractAddress,
            symbol: token.token,
            decimals: token.precision,
            image: token.logoUrl,
          }
        }
      }));

      apiFromComboboxRef.current?.setOptions(tokenOptions);
    })
  }, []);

  return <ApiForm title="wallet_watchAsset TRC20" description='(V5 不支持) 添加 TRC20 资产' ref={apiFromRef}>
    <ApiForm.Combobox
      ref={apiFromComboboxRef}
      id="tokenSelector"
      label="预设参数"
      placeholder="请选择 TRC20 Token"
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
      availableDependencyFields={['request']}
      validation={{
        fields: ['request'],
        validator: (values) => {
          if (!values.request) {
            return '请选择 TRC20 Token';
          }
        }
      }}
    />

    <ApiForm.TextArea
      id="response"
      label="执行结果"
    />
  </ApiForm>
});

export default function Example() {
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

    // const [address] = await provider.request<string[]>({ method: 'tron_accounts' });
    return {
      provider,
      address: tronWeb?.defaultAddress?.base58,
      // address: address,
    };
  };

  useEffect(() => {
    if (!provider) return;
    if (provider?.tronWeb?.defaultAddress?.base58) {
      // @ts-expect-error
      setAccount((pre) => {
        return {
          ...pre,
          address: provider.tronWeb.defaultAddress.base58,
        };
      });
    }
  }, [provider]);

  const checkReceiveAddress = () => {
    if (account.address === receiveAddress) {
      toast({
        title: '温馨提示 (不是报错)',
        description: 'Tron 收款地址不能与发送地址相同',
      });
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
      };
    }) => {
      if (e.data.message && e.data.message.action === 'accountsChanged') {
        console.log('tron [accountsChanged]', e?.data?.message?.data);

        const { address } = e?.data?.message?.data;
        if (address) {
          setAccount({
            ...account,
            address,
          });
        }
      }
      if (e.data.message && e.data.message.action === 'setNode') {
        console.log('tron [setNode]', e?.data?.message?.data);
        // const { address } = e.data.message.data;
        // setAccount({
        //   ...account,
        //   address,
        // });
      }
      if (e.data.message && e.data.message.action === 'setAccount') {
        console.log('tron [setAccount]', e?.data?.message?.data);
      }
      if (e.data.message && e.data.message.action === 'connect') {
        console.log('tron [connect]', e?.data?.message?.data);
      }

      if (e.data.message && e.data.message.action === 'disconnect') {
        console.log('tron [disconnect]', e?.data?.message?.data);
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
      <ApiGroup title="设置所有 Case 收款地址">
        <InputWithSave
          storageKey="tron-receive-address"
          onChange={setReceiveAddress}
          defaultValue={account?.address}
        />
      </ApiGroup>

      <ApiGroup title="Primitive Basics">
        <ApiPayload
          title="tron_requestAccounts"
          description="连接钱包, TronLink 需要解锁不然失败。"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await provider?.request<string[]>({
              method: 'tron_requestAccounts',
            });
            return JSON.stringify(res);
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

      <ApiGroup title="TronWeb Basics">
        <ApiPayload
          title="getAccount"
          description="获取账户信息"
          disableRequestContent
          onExecute={async () => {
            const tronWeb = provider.tronWeb;
            const res = await tronWeb.trx.getAccount(account.address);
            return res;
          }}
        />
        <ApiPayload
          title="getBalance"
          description="获取账户余额"
          disableRequestContent
          onExecute={async () => {
            const tronWeb = provider.tronWeb;
            const res = await tronWeb.trx.getBalance(account.address);
            return res;
          }}
        />
        <ApiPayload
          title="getNodeInfo"
          description="获取节点"
          disableRequestContent
          onExecute={async () => {
            const tronWeb = provider.tronWeb;
            const res = await await tronWeb.trx.getNodeInfo();
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="listNodes"
          description="获取节点"
          disableRequestContent
          onExecute={async () => {
            const tronWeb = provider.tronWeb;
            const res = await await tronWeb.trx.listNodes();
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>

      <ApiGroup title="资产相关">
        <WalletWatchAsset />
      </ApiGroup>
      <ApiGroup title="SignMessage">
        <ApiPayload
          title="SignMessage"
          description="（暂不支持）签名消息存在安全风险，硬件不支持"
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
          description="（暂不支持）签名消息"
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

            const { to, amount } = JSON.parse(request);

            const tronWeb = provider.tronWeb;
            const tx = await tronWeb.transactionBuilder.sendTrx(to, amount, account.address);
            console.log('tx', tx);

            const signedTx = await tronWeb.trx.sign(tx);
            const broastTx = await tronWeb.trx.sendRawTransaction(signedTx);
            console.log('broastTx', broastTx);

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

        <ApiPayload
          title="sign (FreezeBalanceV2)"
          description="冻结余额 V2"
          presupposeParams={params.freezeBalanceV2(receiveAddress ?? '')}
          onExecute={async (request: string) => {
            checkReceiveAddress();

            const { amount, resource, address, options } = JSON.parse(request);

            const tronWeb = provider.tronWeb;
            const tx = await tronWeb.transactionBuilder.freezeBalanceV2(
              amount,
              resource,
              address,
              options,
            );
            const signedTx = await tronWeb.trx.sign(tx.transaction);
            const broastTx = await tronWeb.trx.sendRawTransaction(signedTx);
            return JSON.stringify(broastTx);
          }}
        />
        <ApiPayload
          title="sign (CancelUnfreezeBalanceV2)"
          description="取消等待中的质押"
          onExecute={async (request: string) => {
            checkReceiveAddress();
            const tronWeb = provider.tronWeb;
            const tx = await tronWeb.transactionBuilder.cancelUnfreezeBalanceV2(
              tronWeb.defaultAddress.base58,
            );
            const signedTx = await tronWeb.trx.sign(tx.transaction);
            const broastTx = await tronWeb.trx.sendRawTransaction(signedTx);
            return JSON.stringify(broastTx);
          }}
        />
        <ApiPayload
          title="sign (UnfreezeBalanceV2)"
          description="解除质押资源 V2"
          presupposeParams={params.unfreezeBalanceV2(receiveAddress ?? '')}
          onExecute={async (request: string) => {
            checkReceiveAddress();

            const { amount, resource, address, options } = JSON.parse(request);
            const tronWeb = provider.tronWeb;
            const tx = await tronWeb.transactionBuilder.unfreezeBalanceV2(
              amount,
              resource,
              address,
              options,
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
