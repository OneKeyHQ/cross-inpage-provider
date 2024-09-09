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

import { NodeProvider, TransactionBuilder, buildScriptByteCode, buildContractByteCode, ONE_ALPH, DUST_AMOUNT } from "@alephium/web3"
import * as fetchRetry from 'fetch-retry'
import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '../../ui/radio-group';
import { Label } from '../../ui/label';
import { useToast } from '../../ui/use-toast';

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
