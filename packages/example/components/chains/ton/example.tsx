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
import { TonProofDemoApi } from './TonProofDemoApi';
import { Switch } from '../../ui/switch';

const TON_SCAM_DAPP_ENABLE_KEY = 'ton_scam_dapp_enable';

export function Example() {
  const userFriendlyAddress = useTonAddress();
  const rawAddress = useTonAddress(false);
  const wallet = useTonWallet();
  const [tonConnectUI, setOptions] = useTonConnectUI();

  const enable = localStorage.getItem(TON_SCAM_DAPP_ENABLE_KEY);

  return (
    <>
      <TonConnectButton />

      <InfoLayout title="Base Info">
        <div>
          <p>伪装欺诈模式</p>
          <Switch checked={!!enable} onCheckedChange={async (checked) => {
            if (tonConnectUI.connected) {
              await tonConnectUI?.disconnect();
              TonProofDemoApi.reset();
            }
            if (checked) {
              localStorage.setItem(TON_SCAM_DAPP_ENABLE_KEY, 'true');
            } else {
              localStorage.removeItem(TON_SCAM_DAPP_ENABLE_KEY);
            }
            window.location.reload();
          }} />
        </div>
        {userFriendlyAddress && <p>userFriendlyAddress: {userFriendlyAddress}</p>}
        {rawAddress && <p>rawAddress: {rawAddress}</p>}
        {wallet?.device?.appName && <p>Wallet AppName: {wallet?.device?.appName}</p>}
        {wallet?.device?.appVersion && <p>Wallet appVersion: {wallet?.device?.appVersion}</p>}
        {wallet?.device?.platform && <p>Wallet platform: {wallet?.device?.platform}</p>}
        {wallet?.device?.features && (
          <p>Wallet features: {JSON.stringify(wallet?.device?.features)}</p>
        )}
      </InfoLayout>

      <ApiGroup title='Sign Proof 按步骤操作'>
        <ApiPayload
          title="步骤1: Loading Proof Data"
          description="步骤1: 断开连接，生成 Proof Payload"
          allowCallWithoutProvider={true}
          onExecute={async (request: string) => {
            // 断开连接，重置 accessToken
            if (tonConnectUI.connected) {
              await tonConnectUI?.disconnect();
              TonProofDemoApi.reset();
            }

            // 设置 loading 状态
            tonConnectUI.setConnectRequestParameters({ state: 'loading' });

            const payload = await TonProofDemoApi.generatePayload();
            if (payload) {
              tonConnectUI.setConnectRequestParameters({ state: 'ready', value: payload });
            } else {
              tonConnectUI.setConnectRequestParameters(null);
            }

            return payload;
          }}
        />
        <ApiPayload
          title="步骤2: 连接 Wallet"
          description="步骤2: 连接 Wallet"
          allowCallWithoutProvider={true}
          onExecute={async (request: string) => {
            void tonConnectUI.openModal();
            return 'success';
          }}
          onValidate={async (request: string, response: string) => {
            if (wallet.connectItems?.tonProof && 'proof' in wallet.connectItems.tonProof) {
              try {
                const result = await TonProofDemoApi.checkProof(wallet.connectItems.tonProof.proof, wallet.account);
                return JSON.stringify({
                  success: result,
                  proof: wallet.connectItems.tonProof.proof
                });
              } catch (e: any) {
                return JSON.stringify({
                  success: false,
                  errorMessage: e?.message,
                  proof: null
                });
              }
            }
            return Promise.resolve('error');
          }}
        />
        <ApiPayload
          title="步骤3: 测试获取 Account Info"
          description="步骤3: 测试获取 Account Info"
          allowCallWithoutProvider={!!wallet}
          onExecute={async (request: string) => {
            const response = await TonProofDemoApi.getAccountInfo(wallet.account);
            return response;
          }}
        />
      </ApiGroup>

      <ApiGroup title="Send Transaction">
        <ApiPayload
          title="sendTransaction"
          description="转账普通 Native"
          allowCallWithoutProvider={!!userFriendlyAddress}
          presupposeParams={params.sendTransaction(userFriendlyAddress || '')}
          onExecute={async (request: string) => {
            const res = await tonConnectUI?.sendTransaction(JSON.parse(request));
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="sendTransaction"
          description="带评论的转账普通 Native"
          allowCallWithoutProvider={!!userFriendlyAddress}
          presupposeParams={params.sendTransactionWithBody(userFriendlyAddress || '')}
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

  const enable = localStorage.getItem(TON_SCAM_DAPP_ENABLE_KEY);

  const manifestUrl = enable ? "https://dapp-example.onekeytest.com/scam-tonconnect-manifest.json" : "https://dapp-example.onekeytest.com/tonconnect-manifest.json";

  return (
    <>
      <TonConnectUIProvider manifestUrl={manifestUrl}
        walletsListConfiguration={{
          includeWallets: [
            {
              appName: "onekey",
              name: "OneKey",
              imageUrl: "https://common.onekey-asset.com/logo/onekey.png",
              aboutUrl: "https://onekey.so",
              jsBridgeKey: "onekeyTonWallet",
              platforms: ["chrome"]
            },
          ]
        }}>
        {/* <TonConnectUIProvider manifestUrl="https://ton-connect.github.io/demo-dapp-with-react-ui/tonconnect-manifest.json"> */}
        <Example />
      </TonConnectUIProvider>
    </>
  );
}
