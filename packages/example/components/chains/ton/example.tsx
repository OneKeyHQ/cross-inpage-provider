/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { dapps } from './dapps.config';
import { ApiPayload, ApiGroup } from '../../ApiActuator';
import DappList from '../../../components/DAppList';
import {
  TonConnectButton,
  TonConnectUIProvider,
  useTonAddress,
  useTonConnectUI,
  useTonWallet,
} from '@tonconnect/ui-react';
import InfoLayout from '../../InfoLayout';
import params from './params';

export function Example() {
  const userFriendlyAddress = useTonAddress();
  const rawAddress = useTonAddress(false);
  const wallet = useTonWallet();
  const [tonConnectUI, setOptions] = useTonConnectUI();

  return (
    <>
      <TonConnectButton />

      <InfoLayout title="Base Info">
        {userFriendlyAddress && <p>userFriendlyAddress: {userFriendlyAddress}</p>}
        {rawAddress && <p>rawAddress: {rawAddress}</p>}
        {wallet?.device?.appName && <p>Wallet AppName: {wallet?.device?.appName}</p>}
        {wallet?.device?.appVersion && <p>Wallet appVersion: {wallet?.device?.appVersion}</p>}
        {wallet?.device?.platform && <p>Wallet platform: {wallet?.device?.platform}</p>}
        {wallet?.device?.features && (
          <p>Wallet features: {JSON.stringify(wallet?.device?.features)}</p>
        )}
      </InfoLayout>

      <ApiGroup title="Send Transaction">
        <ApiPayload
          title="sendTransaction"
          description="转账普通 Native"
          allowCallWithoutProvider={!!userFriendlyAddress}
          presupposeParams={params.sendTransaction(rawAddress)}
          onExecute={async (request: string) => {
            const res = await tonConnectUI?.sendTransaction(JSON.parse(request));
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="sendTransaction"
          description="带评论的转账普通 Native"
          allowCallWithoutProvider={!!userFriendlyAddress}
          presupposeParams={params.sendTransactionWithBody(rawAddress)}
          onExecute={async (request: string) => {
            const res = await tonConnectUI?.sendTransaction(JSON.parse(request));
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>

      <DappList dapps={dapps} />
    </>
  );
}

export default function App() {
  return (
    <TonConnectUIProvider manifestUrl="https://dapp-example.onekeytest.com/tonconnect-manifest.json">
    {/* <TonConnectUIProvider manifestUrl="https://ton-connect.github.io/demo-dapp-with-react-ui/tonconnect-manifest.json"> */}
      <Example />
    </TonConnectUIProvider>
  );
}
