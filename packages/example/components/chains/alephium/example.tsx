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

// 防止限频
const retryFetch = fetchRetry.default(fetch, {
  retries: 10,
  retryDelay: 1000
})

const nodeUrl = "https://node.testnet.alephium.org"
const nodeProvider = new NodeProvider(nodeUrl, undefined, retryFetch)

export function Example() {
  const wallet = useWallet();
  const balance = useBalance();

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

            return verifySignedMessage(
              params.message,
              params.messageHasher,
              wallet.account.publicKey,
              signature,
              params.signerKeyType,
            ).toString();
          }}
        />
      </ApiGroup>

      <DappList dapps={dapps} />
    </>
  );
}

export default function App() {
  return (
    <AlephiumWalletProvider network="mainnet" theme="retro">
      <Example />
    </AlephiumWalletProvider>
  );
}
