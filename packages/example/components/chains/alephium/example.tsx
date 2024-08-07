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
            return wallet.signer.signAndSubmitTransferTx(JSON.parse(request));
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
        /><ApiPayload
          title="signMessage"
          description=""
          allowCallWithoutProvider={!!wallet}
          presupposeParams={params.signMessage(wallet?.account?.address ?? '')}
          onExecute={async (request: string) => {
            return wallet.signer.signMessage(JSON.parse(request));
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
