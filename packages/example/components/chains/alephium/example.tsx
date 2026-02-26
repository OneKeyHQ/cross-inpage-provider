/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */

import { dapps } from './dapps.config';
import { ApiPayload, ApiGroup } from '../../ApiActuator';
import DappList from '../../DAppList';
import InfoLayout from '../../InfoLayout';
import params from './params';
import {
  AlephiumWalletProvider,
  AlephiumConnectButton,
  useWallet,
  useBalance,
} from '@alephium/web3-react';
import { verifySignedMessage } from '@alephium/web3';

import { NodeProvider, TransactionBuilder, DUST_AMOUNT } from "@alephium/web3"
import * as fetchRetry from 'fetch-retry'
import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '../../ui/radio-group';
import { Label } from '../../ui/label';
import { useToast } from '../../ui/use-toast';
import { Input } from '../../ui/input';

// 防止限频
const retryFetch = fetchRetry.default(fetch, {
  retries: 10,
  retryDelay: 1000
})

const nodeUrl = "https://node.mainnet.alephium.org"
const nodeProvider = new NodeProvider(nodeUrl, undefined, retryFetch)

export function Example() {
  const wallet = useWallet();
  const balance = useBalance();
  const { toast } = useToast();

  // eslint-disable-next-line @typescript-eslint/no-inferrable-types
  const getTokenTransferFrom = (chainId: string | undefined, approve: boolean = false) => {
    const tokens: {
      name: string;
      address: string;
    }[] = [];

    tokens.push({
      name: 'USDC',
      address: '722954d9067c5a5ad532746a024f2a9d7a18ed9b90e27d0a3a504962160b5600',
    });
    tokens.push({
      name: 'USDT',
      address: '556d9582463fe44fbd108aedc9f409f69086dc78d994b88ea6c9e65f8bf98e00',
    });

    return (
      <>
        <Input
          label="收款地址"
          type="text"
          name="toAddress"
          defaultValue={wallet?.account?.address ?? ''}
        />
        <Input label="金额" type="number" name="amount" defaultValue={DUST_AMOUNT.toString()} />

        <select name="tokenAddress" className="select">
          <option selected value={undefined}>选择 Token</option>
          {tokens.map((token) => (
            <option value={token.address}>{token.name}</option>
          ))}
        </select>
      </>
    );
  };

  const tokenTransferFromToTx = async (fromData: Record<string, any>) => {
    const from = wallet?.account?.address ?? '';
    const senderPublicKey = wallet?.account?.publicKey ?? '';
    const to = fromData.toAddress ?? from;
    const amount = fromData.amount;
    const tokenAddress = fromData.tokenAddress;

    if (!amount) {
      return 'Amount is required';
    }

    const builder = TransactionBuilder.from(nodeUrl)

    if (tokenAddress && tokenAddress !== '选择 Token') {

      const buildTxResultScript = await builder.buildTransferTx(
        {
          signerAddress: from,
          destinations: [
            { address: to, attoAlphAmount: amount },
          ]
        },
        senderPublicKey
      )

      return JSON.stringify({
        unsignedTx: buildTxResultScript.unsignedTx,
        signerAddress: from,
      })
    }

    const buildTxResultScript = await builder.buildTransferTx(
      {
        signerAddress: from,
        destinations: [
          { address: to, attoAlphAmount: DUST_AMOUNT, tokens: [{ id: tokenAddress, amount: amount }] },
        ]
      },
      senderPublicKey
    )

    return JSON.stringify({
      unsignedTx: buildTxResultScript.unsignedTx,
      signerAddress: from,
    })
  }

  return (
    <>
      <AlephiumConnectButton />

      <InfoLayout title="Base Info">
        {wallet && <p>address: {wallet?.account?.address}</p>}
      </InfoLayout>

      <ApiGroup title="Send Transaction">
        <ApiPayload
          title="signAndSubmitTransferTx"
          description="转账普通 Native"
          allowCallWithoutProvider={!!wallet}
          presupposeParams={params.signAndSubmitTransferTx(
            wallet?.account?.address ?? '',
            wallet?.account?.address ?? '',
          )}
          onExecute={async (request: string) => {
            const params = JSON.parse(request);
            return wallet.signer.signAndSubmitTransferTx({
              ...params,
              destinations: params.destinations.map((destination: any) => ({
                address: destination?.address,
                attoAlphAmount: destination?.amount?.toString(),
                tokens: destination?.tokens?.map((token: any) => ({
                  id: token?.id,
                  amount: token?.amount?.toString(),
                })),
                lockTime: destination?.lockTime,
                message: destination?.message,
              })),
              signerAddress: params.signerAddress,
            });
          }}
        />
        <ApiPayload
          title="signAndSubmitDeployContractTx"
          description=""
          allowCallWithoutProvider={!!wallet}
          presupposeParams={params.signAndSubmitDeployContractTx(wallet?.account?.address ?? '')}
          onExecute={async (request: string) => {
            console.log('xxx=====>>>>>>> 1');
            const xxx = await wallet.signer.signAndSubmitDeployContractTx(JSON.parse(request));
            console.log('xxx=====>>>>>>> 2', xxx);

            return xxx;
          }}
        />
        <ApiPayload
          title="signAndSubmitExecuteScriptTx"
          description=""
          allowCallWithoutProvider={!!wallet}
          presupposeParams={params.signAndSubmitExecuteScriptTx(wallet?.account?.address ?? '')}
          onExecute={async (request: string) => {
            return wallet.signer.signAndSubmitExecuteScriptTx(JSON.parse(request));
          }}
        />
        <ApiPayload
          title="signAndSubmitUnsignedTx"
          description=""
          allowCallWithoutProvider={!!wallet}
          presupposeParams={params.signAndSubmitUnsignedTx(wallet?.account?.address ?? '')}
          generateRequestFrom={() => getTokenTransferFrom(wallet?.account?.address ?? '')}
          onGenerateRequest={tokenTransferFromToTx}
          onExecute={async (request: string) => {
            return wallet.signer.signAndSubmitUnsignedTx(JSON.parse(request));
          }}
        />
        <ApiPayload
          title="signUnsignedTx"
          description=""
          allowCallWithoutProvider={!!wallet}
          presupposeParams={params.signUnsignedTx(wallet?.account?.address ?? '')}
          generateRequestFrom={() => getTokenTransferFrom(wallet?.account?.address ?? '')}
          onGenerateRequest={tokenTransferFromToTx}
          onExecute={async (request: string) => {
            return wallet.signer.signUnsignedTx(JSON.parse(request));
          }}
          onValidate={async (request: string, response: string) => {
            const { unsignedTx, signature } = JSON.parse(response);
            const txId = await nodeProvider.transactions.postTransactionsSubmit({
              unsignedTx,
              signature,
            });
            if (!txId.txId) {
              toast({
                title: '交易提交失败',
                description: '请排出网络问题,',
                variant: 'destructive',
              });
            }
            return txId.txId;
          }}
        />
        <ApiPayload
          title="signMessage"
          description=""
          allowCallWithoutProvider={!!wallet}
          presupposeParams={params.signMessage(wallet?.account?.address ?? '')}
          onExecute={async (request: string) => {
            return wallet.signer.signMessage(JSON.parse(request));
          }}
          onValidate={async (request: string, response: string) => {
            const params = JSON.parse(request);
            const signature = JSON.parse(response).signature;

            const signed = verifySignedMessage(
              params.message,
              params.messageHasher,
              wallet.account.publicKey,
              signature,
              params.signerKeyType,
            )

            if (!signed) {
              toast({
                title: '签名验证失败',
                variant: 'destructive',
              });
            }

            return Promise.resolve(signed.toString());
          }}
        />
      </ApiGroup>

      <ApiGroup title="Provider Proxy Tests (nodeProvider / explorerProvider)">
        <ApiPayload
          title="Duck-Typing Check (isWalletObj)"
          description="验证 nodeProvider/explorerProvider 属性存在性，isWalletObj() 依赖这些属性"
          allowCallWithoutProvider
          onExecute={async () => {
            const provider = (window as any).alephium;
            const requiredKeys = [
              'id', 'name', 'icon',
              'unsafeEnable', 'isPreauthorized',
              'nodeProvider', 'explorerProvider',
              'signAndSubmitTransferTx', 'signAndSubmitDeployContractTx',
              'signAndSubmitExecuteScriptTx', 'signAndSubmitUnsignedTx',
              'signUnsignedTx', 'signMessage',
            ];
            const checks: Record<string, boolean> = {};
            for (const key of requiredKeys) {
              checks[key] = provider ? key in provider : false;
            }
            checks['nodeProvider !== undefined'] = provider?.nodeProvider !== undefined;
            checks['explorerProvider !== undefined'] = provider?.explorerProvider !== undefined;
            const allPassed = Object.values(checks).every(Boolean);
            return Promise.resolve(JSON.stringify({ allPassed, checks }, null, 2));
          }}
        />
        <ApiPayload
          title="nodeProvider.infos.getInfosVersion"
          description="nodeProvider namespace API — 获取节点版本（无参数，最简单的 proxy 测试）"
          allowCallWithoutProvider
          onExecute={async () => {
            const provider = (window as any).alephium;
            if (!provider?.nodeProvider) throw new Error('nodeProvider not available');
            const result = await provider.nodeProvider.infos.getInfosVersion();
            return JSON.stringify(result);
          }}
        />
        <ApiPayload
          title="nodeProvider.addresses.getAddressesAddressBalance"
          description="nodeProvider namespace API — 查询地址余额"
          allowCallWithoutProvider={!!wallet}
          presupposeParams={[{
            id: 'proxy-balance-current',
            name: 'Current Address',
            value: JSON.stringify({ address: wallet?.account?.address ?? '' }),
          }]}
          onExecute={async (request: string) => {
            const provider = (window as any).alephium;
            if (!provider?.nodeProvider) throw new Error('nodeProvider not available');
            const { address } = JSON.parse(request);
            const result = await provider.nodeProvider.addresses.getAddressesAddressBalance(address);
            return JSON.stringify(result);
          }}
        />
        <ApiPayload
          title="nodeProvider.blockflow.getBlockflowChainInfo"
          description="nodeProvider namespace API — 获取链信息 (fromGroup=0, toGroup=0)"
          allowCallWithoutProvider
          onExecute={async () => {
            const provider = (window as any).alephium;
            if (!provider?.nodeProvider) throw new Error('nodeProvider not available');
            const result = await provider.nodeProvider.blockflow.getBlockflowChainInfo({ fromGroup: 0, toGroup: 0 });
            return JSON.stringify(result);
          }}
        />
        <ApiPayload
          title="nodeProvider.request() (low-level API)"
          description="nodeProvider.request({ path, method, params }) — 标准低级 API"
          allowCallWithoutProvider
          onExecute={async () => {
            const provider = (window as any).alephium;
            if (!provider?.nodeProvider) throw new Error('nodeProvider not available');
            const result = await provider.nodeProvider.request({
              path: 'infos',
              method: 'getInfosVersion',
              params: [],
            });
            return JSON.stringify(result);
          }}
        />
        <ApiPayload
          title="explorerProvider.infos.getInfosHeights"
          description="explorerProvider namespace API — 获取链高度"
          allowCallWithoutProvider
          onExecute={async () => {
            const provider = (window as any).alephium;
            if (!provider?.explorerProvider) throw new Error('explorerProvider not available');
            const result = await provider.explorerProvider.infos.getInfosHeights();
            return JSON.stringify(result);
          }}
        />
        <ApiPayload
          title="explorerProvider.tokens.getTokensTokenIdAddresses"
          description="explorerProvider namespace API — 查询 ALPH token 持有地址"
          allowCallWithoutProvider
          presupposeParams={[{
            id: 'proxy-explorer-token-alph',
            name: 'ALPH (Native)',
            value: JSON.stringify({
              tokenId: '0000000000000000000000000000000000000000000000000000000000000000',
            }),
          }, {
            id: 'proxy-explorer-token-usdc',
            name: 'USDC',
            value: JSON.stringify({
              tokenId: '722954d9067c5a5ad532746a024f2a9d7a18ed9b90e27d0a3a504962160b5600',
            }),
          }, {
            id: 'proxy-explorer-token-usdt',
            name: 'USDT',
            value: JSON.stringify({
              tokenId: '556d9582463fe44fbd108aedc9f409f69086dc78d994b88ea6c9e65f8bf98e00',
            }),
          }]}
          onExecute={async (request: string) => {
            const provider = (window as any).alephium;
            if (!provider?.explorerProvider) throw new Error('explorerProvider not available');
            const { tokenId } = JSON.parse(request);
            const result = await provider.explorerProvider.tokens.getTokensTokenIdAddresses(tokenId, { page: 1, limit: 5 });
            return JSON.stringify(result);
          }}
        />
      </ApiGroup>

      <ApiGroup title="Stub Compatibility Tests (@alephium/web3 → lightweight stub)">
        <ApiPayload
          title="Proxy 类型检查"
          description="验证 nodeProvider/explorerProvider 是 Proxy 对象且支持任意属性访问"
          allowCallWithoutProvider
          onExecute={async () => {
            const provider = (window as any).alephium;
            const checks: Record<string, boolean> = {};
            // Proxy should allow accessing any property without throwing
            checks['nodeProvider.anyNamespace is callable'] =
              typeof provider?.nodeProvider?.someRandomNamespace === 'function';
            checks['explorerProvider.anyNamespace is callable'] =
              typeof provider?.explorerProvider?.someRandomNamespace === 'function';
            // 'then' should return undefined (prevent Promise coercion)
            checks['nodeProvider.then === undefined'] =
              provider?.nodeProvider?.then === undefined;
            checks['explorerProvider.then === undefined'] =
              provider?.explorerProvider?.then === undefined;
            const allPassed = Object.values(checks).every(Boolean);
            return Promise.resolve(JSON.stringify({ allPassed, checks }, null, 2));
          }}
        />
        <ApiPayload
          title="Signer 方法存在性"
          description="验证签名相关方法仍然可用（stub 保留了 InteractiveSignerProvider 基类）"
          allowCallWithoutProvider
          onExecute={async () => {
            const provider = (window as any).alephium;
            const checks: Record<string, boolean> = {};
            const methods = [
              'signAndSubmitTransferTx',
              'signAndSubmitDeployContractTx',
              'signAndSubmitExecuteScriptTx',
              'signAndSubmitUnsignedTx',
              'signUnsignedTx',
              'signMessage',
              'unsafeEnable',
              'isPreauthorized',
              'disconnect',
            ];
            for (const m of methods) {
              checks[`${m} is function`] = typeof provider?.[m] === 'function';
            }
            const allPassed = Object.values(checks).every(Boolean);
            return Promise.resolve(JSON.stringify({ allPassed, checks }, null, 2));
          }}
        />
      </ApiGroup>

      <DappList dapps={dapps} />
    </>
  );
}

const groupOptions = [
  { label: '不指定', value: -1 },
  { label: 'Group 0', value: 0 },
  { label: 'Group 1', value: 1 },
  { label: 'Group 2', value: 2 },
  { label: 'Group 3', value: 3 },
];

export default function App() {
  const [group, setGroup] = useState(0);

  return (
    <AlephiumWalletProvider network="mainnet" theme="retro" addressGroup={group === -1 ? undefined : group}>
      <InfoLayout title="连接指定 Group 账户">
        <RadioGroup className='flex flex-row space-x-4' aria-labelledby="Select one item" defaultValue={"0"} name="form" onValueChange={(value) => {
          const valueInt = parseInt(value);
          if (valueInt === -1) {
            setGroup(-1);
          } else {
            setGroup(valueInt);
          }
        }}>
          {groupOptions.map((option) => (
            <div className="items-center space-x-2">
              <RadioGroupItem value={option.value.toString()} id={option.value.toString()} />
              <Label htmlFor={option.value.toString()}>{option.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </InfoLayout>
      <Example />
    </AlephiumWalletProvider>
  );
}
