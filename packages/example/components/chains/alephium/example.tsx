/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
            return wallet.signer.signAndSubmitDeployContractTx(JSON.parse(request));
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

            return signed.toString();
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
