/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
/* eslint-disable no-unsafe-optional-chaining */
import { dapps } from './dapps.config';
import ConnectButton from '../../../components/connect/ConnectButton';
import { memo, useEffect, useRef, useState } from 'react';
import { get } from 'lodash';
import { IProviderApi, IProviderInfo, ITIP6963AnnounceProviderEvent, ITIP6963ProviderDetail } from './types';
import { ApiPayload, ApiGroup } from '../../ApiActuator';
import { useWallet } from '../../../components/connect/WalletContext';
import type { IKnownWallet } from '../../../components/connect/types';
import DappList from '../../../components/DAppList';
import params from './params';
import { InputWithSave } from '../../InputWithSave';
import { toast } from '../../ui/use-toast';
import { ApiComboboxRef, ApiForm, ApiFormRef, ComboboxOption } from '../../ApiForm';
import { okLinkRequest } from '../utils/OkLink';
import { Buffer } from 'buffer';

type ITokenOption = {
  type: string;
  options: {
    address: string;
    symbol: string;
    decimals: string;
    image: string;
  };
};


const WalletWatchAsset = memo(() => {
  const apiFromRef = useRef<ApiFormRef>(null);
  const apiFromComboboxRef = useRef<ApiComboboxRef<ITokenOption>>(null);

  const { provider } = useWallet<IProviderApi>();

  useEffect(() => {
    void okLinkRequest.getTokenList('TRON', 'TRC20').then((tokens) => {
      const tokenOptions: ComboboxOption<ITokenOption>[] = tokens.map((token) => ({
        value: token.tokenContractAddress,
        label: `${token.token} - ${token.tokenContractAddress}`,
        extra: {
          type: 'trc20',
          options: {
            address: token.tokenContractAddress,
            symbol: token.token,
            decimals: token.precision,
            image: token.logoUrl,
          },
        },
      }));

      apiFromComboboxRef.current?.setOptions(tokenOptions);
    });
  }, []);

  return (
    <ApiForm
      title="wallet_watchAsset TRC20"
      description="(V5 不支持) 添加 TRC20 资产"
      ref={apiFromRef}
    >
      <ApiForm.Combobox
        ref={apiFromComboboxRef}
        id="tokenSelector"
        label="预设参数"
        placeholder="请选择 TRC20 Token"
        onOptionChange={(option) => {
          apiFromRef.current?.setJsonValue('request', option?.extra);
        }}
      />

      <ApiForm.JsonEdit id="request" label="请求(可以手动编辑)" required />

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
        availableDependencyFields={[{ fieldIds: ['request'] }]}
        validation={{
          fields: ['request'],
          validator: (values) => {
            if (!values.request) {
              return '请选择 TRC20 Token';
            }
          },
        }}
      />

      <ApiForm.TextArea id="response" label="执行结果" />
    </ApiForm>
  );
});

export default function Example() {
  const walletsRef = useRef<ITIP6963ProviderDetail[]>([
    {
      info: {
        uuid: 'injected',
        name: 'Injected Wallet',
        inject: 'tronLink',
      }
    },
    {
      info: {
        uuid: 'injected-onekey',
        name: 'Injected OneKey',
        inject: '$onekey.tron',
      }
    },
  ]);

  const { provider, setAccount, account } = useWallet<IProviderApi>();
  const [receiveAddress, setReceiveAddress] = useState<string>('');

  const onConnectWallet = async (selectedWallet: IKnownWallet) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const providerDetail = walletsRef.current?.find((w) => w.info.uuid === selectedWallet.id);
    if (!providerDetail) {
      return Promise.reject('Wallet not found');
    }

    const provider = providerDetail.provider ?? get(window, providerDetail.info.inject) as IProviderApi | undefined;

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

    let address = tronWeb?.defaultAddress?.base58 as string
    if(!address) {
      const [addr] = await provider.request<string[]>({ method: 'tron_accounts' });
      address = addr;
    }

    // const [address] = await provider.request<string[]>({ method: 'tron_accounts' });
    return {
      provider,
      address,
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

  useEffect(() => {
    const listener = (event: ITIP6963AnnounceProviderEvent) => {
      console.log('tron tip6963 [listener]', event);
      const { info, provider } = event.detail;
      const wallet = walletsRef.current.find((wallet) => wallet.info.uuid === info.uuid);
      if (!wallet) {
        walletsRef.current = [
          ...walletsRef.current,
          {
            info,
            provider,
          },
        ];
      }
    };

    // @ts-expect-error
    window.addEventListener('TIP6963:announceProvider', listener);

    window.dispatchEvent(new Event('TIP6963:requestProvider'));

    return () => {
      // @ts-expect-error
      window.removeEventListener('TIP6963:announceProvider', listener);
    };
  }, []);

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

  useEffect(() => {
    if (!provider) return;
    provider.on('accountsChanged', (accounts: string[]) => {
      console.log('TIP6963 tron [accountsChanged]', accounts);
    });

    provider.on('chainChanged', (chainId: string) => {
      console.log('TIP6963 tron [chainChanged]', chainId);
    });

    return () => {
      provider.removeListener('accountsChanged', (accounts: string[]) => {
        console.log('TIP6963 tron [accountsChanged]', accounts);
      });

      provider.removeListener('chainChanged', (chainId: string) => {
        console.log('TIP6963 tron [chainChanged]', chainId);
      });
    };
  }, [provider]);

  return (
    <>
      <ConnectButton<IProviderApi>
        fetchWallets={() => {
          return Promise.resolve(
            walletsRef.current.map((wallet) => {
              return {
                id: wallet.info.uuid,
                name: `${wallet.info.name}${wallet.provider ? ' (TIP6963)' : ''}`,
                logo: wallet.info.icon,
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
            const res = await tronWeb.trx.getNodeInfo();
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="listNodes"
          description="获取节点"
          disableRequestContent
          onExecute={async () => {
            const tronWeb = provider.tronWeb;
            const res = await tronWeb.trx.listNodes();
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>

      {/* eslint-disable @typescript-eslint/require-await -- sync checks wrapped in async for onExecute signature */}
      <ApiGroup title="Stub Compatibility Tests (Bundle Size Optimization)">
        <ApiPayload
          title="window.tronWeb 存在性"
          description="验证 tronWeb 已注入到 window"
          disableRequestContent
          allowCallWithoutProvider
          onExecute={async () => {
            const checks: Record<string, boolean> = {};
            checks['window.tronWeb exists'] = (window as any).tronWeb !== undefined;
            checks['window.sunWeb exists'] = (window as any).sunWeb !== undefined;
            checks['provider.tronWeb exists'] = provider?.tronWeb != null;
            checks['provider.isTronLink'] = (provider as any)?.isTronLink === true;
            checks['provider.ready'] = (provider as any)?.ready === true;
            const allPassed = Object.values(checks).every(Boolean);
            return JSON.stringify({ allPassed, checks }, null, 2);
          }}
        />
        <ApiPayload
          title="tronWeb.isAddress()"
          description="地址验证 — Provider 内部用于 _handleAccountsChanged"
          disableRequestContent
          onExecute={async () => {
            const tronWeb = provider.tronWeb;
            const checks: Record<string, boolean> = {};
            checks['valid T-address'] = tronWeb.isAddress(account.address);
            checks['invalid address → false'] = !tronWeb.isAddress('not_an_address');
            checks['empty string → false'] = !tronWeb.isAddress('');
            const allPassed = Object.values(checks).every(Boolean);
            return JSON.stringify({ allPassed, checks }, null, 2);
          }}
        />
        <ApiPayload
          title="tronWeb.defaultAddress"
          description="检查 defaultAddress 结构（hex / base58）"
          disableRequestContent
          onExecute={async () => {
            const tronWeb = provider.tronWeb;
            const addr = tronWeb.defaultAddress;
            return JSON.stringify({
              base58: addr?.base58,
              hex: addr?.hex,
              hasBase58: typeof addr?.base58 === 'string' && addr.base58.length > 0,
              hasHex: typeof addr?.hex === 'string' && addr.hex.length > 0,
            }, null, 2);
          }}
        />
        <ApiPayload
          title="tronWeb.utils 工具方法"
          description="验证 utils.isHex, utils.ethersUtils.toUtf8Bytes 可用"
          disableRequestContent
          onExecute={async () => {
            const tronWeb = provider.tronWeb;
            const checks: Record<string, boolean> = {};
            checks['utils exists'] = tronWeb.utils != null;
            checks['isHex("0x1234") → true'] = tronWeb.utils.isHex('0x1234');
            checks['isHex("not_hex") → false'] = !tronWeb.utils.isHex('not_hex');
            checks['ethersUtils exists'] = tronWeb.utils.ethersUtils != null;
            checks['toUtf8Bytes exists'] = typeof tronWeb.utils.ethersUtils?.toUtf8Bytes === 'function';
            if (typeof tronWeb.utils.ethersUtils?.toUtf8Bytes === 'function') {
              const bytes = tronWeb.utils.ethersUtils.toUtf8Bytes('hello');
              checks['toUtf8Bytes("hello") works'] = bytes?.length === 5;
            }
            const allPassed = Object.values(checks).every(Boolean);
            return JSON.stringify({ allPassed, checks }, null, 2);
          }}
        />
        <ApiPayload
          title="tronWeb 网络配置方法"
          description="验证 setFullNode/setSolidityNode/setEventServer 方法存在"
          disableRequestContent
          onExecute={async () => {
            const tronWeb = provider.tronWeb;
            const checks: Record<string, boolean> = {};
            checks['setFullNode is function'] = typeof tronWeb.setFullNode === 'function';
            checks['setSolidityNode is function'] = typeof tronWeb.setSolidityNode === 'function';
            checks['setEventServer is function'] = typeof tronWeb.setEventServer === 'function';
            checks['fullNode.host exists'] = !!tronWeb.fullNode?.host;
            checks['solidityNode.host exists'] = !!tronWeb.solidityNode?.host;
            checks['eventServer.host exists'] = !!tronWeb.eventServer?.host;
            const allPassed = Object.values(checks).every(Boolean);
            return JSON.stringify({
              allPassed,
              checks,
              nodes: {
                fullNode: tronWeb.fullNode?.host,
                solidityNode: tronWeb.solidityNode?.host,
                eventServer: tronWeb.eventServer?.host,
              },
            }, null, 2);
          }}
        />
        <ApiPayload
          title="tronWeb.transactionBuilder 存在性"
          description="验证 transactionBuilder 命名空间可用（sendTrx, triggerSmartContract 等）"
          disableRequestContent
          onExecute={async () => {
            const tronWeb = provider.tronWeb;
            const checks: Record<string, boolean> = {};
            checks['transactionBuilder exists'] = tronWeb.transactionBuilder != null;
            checks['sendTrx is function'] = typeof tronWeb.transactionBuilder?.sendTrx === 'function';
            checks['triggerSmartContract is function'] = typeof tronWeb.transactionBuilder?.triggerSmartContract === 'function';
            checks['freezeBalanceV2 is function'] = typeof tronWeb.transactionBuilder?.freezeBalanceV2 === 'function';
            checks['unfreezeBalanceV2 is function'] = typeof tronWeb.transactionBuilder?.unfreezeBalanceV2 === 'function';
            const allPassed = Object.values(checks).every(Boolean);
            return JSON.stringify({ allPassed, checks }, null, 2);
          }}
        />
        <ApiPayload
          title="tronWeb.trx 签名方法覆盖检查"
          description="验证 trx.sign/signMessage/signMessageV2/getNodeInfo 已被 Provider 覆盖"
          disableRequestContent
          onExecute={async () => {
            const tronWeb = provider.tronWeb;
            const checks: Record<string, boolean> = {};
            checks['trx exists'] = tronWeb.trx != null;
            checks['trx.sign is function'] = typeof tronWeb.trx?.sign === 'function';
            checks['trx.signMessage is function'] = typeof tronWeb.trx?.signMessage === 'function';
            checks['trx.signMessageV2 is function'] = typeof tronWeb.trx?.signMessageV2 === 'function';
            checks['trx.getNodeInfo is function'] = typeof tronWeb.trx?.getNodeInfo === 'function';
            checks['trx.getAccount is function'] = typeof tronWeb.trx?.getAccount === 'function';
            checks['trx.getBalance is function'] = typeof tronWeb.trx?.getBalance === 'function';
            checks['trx.sendRawTransaction is function'] = typeof tronWeb.trx?.sendRawTransaction === 'function';
            checks['trx.verifyMessage is function'] = typeof tronWeb.trx?.verifyMessage === 'function';
            checks['trx.verifyMessageV2 is function'] = typeof tronWeb.trx?.verifyMessageV2 === 'function';
            const allPassed = Object.values(checks).every(Boolean);
            return JSON.stringify({ allPassed, checks }, null, 2);
          }}
        />
        <ApiPayload
          title="tronWeb.request() (TIP 兼容)"
          description="验证 tronWeb.request() 方法可用"
          disableRequestContent
          onExecute={async () => {
            const tronWeb = provider.tronWeb;
            const checks: Record<string, boolean> = {};
            checks['request is function'] = typeof (tronWeb as any).request === 'function';
            const allPassed = Object.values(checks).every(Boolean);
            return JSON.stringify({ allPassed, checks }, null, 2);
          }}
        />
      </ApiGroup>
      {/* eslint-enable @typescript-eslint/require-await */}

      <ApiGroup title="资产相关">
        <WalletWatchAsset />
      </ApiGroup>
      <ApiGroup title="SignMessage">
        <ApiPayload
          title="SignMessage"
          description="（官方废弃，暂不支持）签名消息"
          presupposeParams={params.signMessage}
          onExecute={async (request: string) => {
            const tronWeb = provider.tronWeb;
            const signedString = await tronWeb.trx.signMessage(request);
            return signedString;
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
            const signedString = tronWeb.trx.signMessageV2(request);
            return Promise.resolve(signedString);
          }}
          onValidate={async (request: string, result: string) => {
            const tronWeb = provider.tronWeb;

            // verify the signature
            const res = await tronWeb.trx.verifyMessageV2(request, result);
            const isValid = res === tronWeb.defaultAddress.base58;
            return Promise.resolve(isValid.toString());
          }}
        />
        <ApiPayload
          title="SignMessage V2 Array"
          description="签名消息 Array(only support hex)"
          presupposeParams={params.signMessageArray}
          onExecute={async (request: string) => {
            const tronWeb = provider.tronWeb;
            const signedString = tronWeb.trx.signMessageV2(Buffer.from(request, 'hex'));
            return Promise.resolve(signedString);
          }}
          onValidate={async (request: string, result: string) => {
            const tronWeb = provider.tronWeb;

            // verify the signature
            const res = await tronWeb.trx.verifyMessageV2(Buffer.from(request, 'hex'), result);
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
            const signedTx = await tronWeb.trx.sign(tx);
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
              tronWeb.defaultAddress.base58 as string,
            );
            const signedTx = await tronWeb.trx.sign(tx);
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
            const signedTx = await tronWeb.trx.sign(tx);
            const broastTx = await tronWeb.trx.sendRawTransaction(signedTx);
            return JSON.stringify(broastTx);
          }}
        />
      </ApiGroup>

      <ApiGroup title="TIP6963 Only" >
        <ApiPayload
          title="eth_requestAccounts"
          description="请求连接 Wallet 获取账户"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await provider?.request<string[]>({
              method: 'eth_requestAccounts',
            });
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="wallet_accounts"
          description="获取已连接账户"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await provider?.request<string[]>({
              method: 'wallet_accounts',
            });
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="eth_chainId"
          description="获取当前网络"
          onExecute={async (request: string) => {
            const res = await provider?.request<string>({
              method: 'eth_chainId',
            });
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="wallet_switchEthereumChain"
          description="切换网络"
          presupposeParams={[
            {
              id: 'chainId-mainnet',
              name: '网络 ID Mainnet',
              value: JSON.stringify({
                "chainId": "0x2b6653dc",
              }),
            },
            {
              id: 'chainId-mainnet',
              name: '网络 ID Mainnet',
              value: JSON.stringify({
                "chainId": "0x7a69d1ed",
              }),
            },
          ]}
          onExecute={async (request: string) => {
            const res = await provider?.request<string[]>({
              method: 'wallet_switchEthereumChain',
              params: [JSON.parse(request)],
            });
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="personal_sign"
          description="签名"
          presupposeParams={params.signMessage}
          onExecute={async (request: string) => {
            const tronWeb = provider?.request({
              method: 'personal_sign',
              params: [request],
            });
            return Promise.resolve(tronWeb);
          }}
          onValidate={async (request: string, result: string) => {
            const tronWeb = provider.tronWeb;

            // verify the signature
            const res = await tronWeb.trx.verifyMessageV2(request, result);
            const isValid = res === tronWeb.defaultAddress.base58;
            return Promise.resolve(isValid.toString());
          }}
        />
        <ApiPayload
          title="eth_signTransaction"
          description="签名交易"
          presupposeParams={params.nativeTransfer(receiveAddress ?? '')}
          onExecute={async (request: string) => {
            checkReceiveAddress();

            const { to, amount } = JSON.parse(request);

            const tronWeb = provider.tronWeb;
            const tx = await tronWeb.transactionBuilder.sendTrx(to, amount, account.address);
            console.log('tx', tx);

            const signedTx = await provider?.request<any>({
              method: 'eth_signTransaction',
              params: [tx],
            });
            const broastTx = await tronWeb.trx.sendRawTransaction(signedTx);
            console.log('broastTx', broastTx);

            return JSON.stringify(broastTx);
          }}
        />
        <ApiPayload
          title="wallet_disconnect"
          description="断开连接"
          onExecute={async (request: string) => {
            const tronWeb = provider?.request({
              method: 'wallet_disconnect'
            });
            return Promise.resolve(tronWeb);
          }}
        />
      </ApiGroup>
      <DappList dapps={dapps} />
    </>
  );
}
