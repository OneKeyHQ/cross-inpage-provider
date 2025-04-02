/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
import { dapps } from './dapps.config';
import { ApiPayload, ApiGroup } from '../../ApiActuator';
import DappList from '../../DAppList';
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
import { useToast } from '../../ui/use-toast';
import { useState, useEffect } from 'react';
const TON_SCAM_DAPP_ENABLE_KEY = 'ton_scam_dapp_enable';

type IPresupposeParam = {
  id: string;
  name: string;
  value: string;
  description?: string;
};

export function Example() {
  const userFriendlyAddress = useTonAddress();
  const rawAddress = useTonAddress(false);
  const wallet = useTonWallet();
  const [tonConnectUI, setOptions] = useTonConnectUI();
  const { toast } = useToast();
  const [tokenParams, setTokenParams] = useState<IPresupposeParam[]>([]);

  useEffect(() => {
    async function fetchTokenParams() {
      if (userFriendlyAddress) {
        const result = await params.sendTokenTransaction(userFriendlyAddress);
        setTokenParams(result);
      }
    }
    void fetchTokenParams();
  }, [userFriendlyAddress]);

  const scamEnable = localStorage.getItem(TON_SCAM_DAPP_ENABLE_KEY);

  return (
    <>
      <TonConnectButton />

      <InfoLayout title="Base Info">
        <div>
          <p>伪装欺诈模式</p>
          <Switch
            checked={!!scamEnable}
            onCheckedChange={async (checked) => {
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
            }}
          />
        </div>
        {userFriendlyAddress && <p>userFriendlyAddress: {userFriendlyAddress}</p>}
        {rawAddress && <p>rawAddress: {rawAddress}</p>}
        {wallet?.account && <p>Wallet Account PublicKey: {wallet?.account.publicKey}</p>}
        {wallet?.account && <p>Wallet Account Chain: {wallet?.account.chain}</p>}
        {wallet?.account && (
          <p>Wallet Account WalletStateInit: {wallet?.account.walletStateInit}</p>
        )}

        {wallet?.device?.appName && <p>Wallet AppName: {wallet?.device?.appName}</p>}
        {wallet?.device?.appVersion && <p>Wallet appVersion: {wallet?.device?.appVersion}</p>}
        {wallet?.device?.platform && <p>Wallet platform: {wallet?.device?.platform}</p>}
        {wallet?.device?.features && (
          <p>Wallet features: {JSON.stringify(wallet?.device?.features)}</p>
        )}
      </InfoLayout>

      <ApiGroup title="Sign Proof 按步骤作">
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

            // 置 loading 状态
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
            return Promise.resolve('success');
          }}
          onValidate={async (request: string, response: string) => {
            if (wallet.connectItems?.tonProof && 'proof' in wallet.connectItems.tonProof) {
              try {
                const result = await TonProofDemoApi.checkProof(
                  wallet.connectItems.tonProof.proof,
                  wallet.account,
                );

                if (!result) {
                  toast({
                    variant: 'destructive',
                    title: 'Proof 签名验证失败',
                  });
                }
                if (result && scamEnable) {
                  toast({
                    title: '当前处于伪装欺诈模式，不应该成功连接账户',
                    variant: 'destructive',
                  });
                }

                return JSON.stringify({
                  success: result,
                  proof: wallet.connectItems.tonProof.proof,
                });
              } catch (e: any) {
                return JSON.stringify({
                  success: false,
                  errorMessage: e?.message,
                  proof: null,
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
          description="错误例子测试，这个用例所有请求都应该报错"
          allowCallWithoutProvider={!!userFriendlyAddress}
          presupposeParams={params.sendTransactionWithError(userFriendlyAddress || '')}
          onExecute={async (request: string) => {
            const res = await tonConnectUI?.sendTransaction(JSON.parse(request));
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>

      <ApiGroup title="Send Transaction">
        <ApiPayload
          title="Send Jetton"
          description="代币转账"
          allowCallWithoutProvider={!!userFriendlyAddress}
          presupposeParams={tokenParams}
          onExecute={async (request: string) => {
            const res = await tonConnectUI?.sendTransaction(JSON.parse(request));
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>

      <ApiGroup title="Exotic Cell Transactions">
        <ApiPayload
          title="Merkle Proof Transaction"
          allowCallWithoutProvider={!!userFriendlyAddress}
          presupposeParams={[
            {
              id: 'merkleProof',
              name: 'Merkle Proof Transaction',
              value: JSON.stringify({
                validUntil: Date.now() + 900000,
                messages: [
                  {
                    address: userFriendlyAddress || '',
                    amount: '100000', // 0.0001 TON
                    payload: {
                      type: 'merkle-proof',
                      hash: 'te6ccgEBAQEAJgAASEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==',
                      depth: 32,
                      merkleProof:
                        'te6ccgEBAQEAJgAASEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==',
                    },
                  },
                ],
              }),
            },
            {
              id: 'overstringCell',
              name: 'Overstring Cell Transaction',
              value: JSON.stringify({
                validUntil: Date.now() + 900000,
                messages: [
                  {
                    address: userFriendlyAddress || '',
                    amount: '100000', // 0.0001 TON
                    payload: {
                      type: 'overstring',
                      data: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
                    },
                  },
                ],
              }),
            },
          ]}
          onExecute={async (request: string) => {
            try {
              const res = await tonConnectUI?.sendTransaction(JSON.parse(request));
              if (!res) {
                return JSON.stringify({ success: true, message: 'Transaction sent successfully' });
              }
              return JSON.stringify(res);
            } catch (error: any) {
              // 如果错误中包含特定字符串，说明交易可能已经成功
              if (error?.message?.includes('[object Object]')) {
                return JSON.stringify({ success: true, message: 'Transaction likely succeeded' });
              }
              return JSON.stringify({ error: error.message });
            }
          }}
        />

        <ApiPayload
          title="Merkle Update Transaction"
          allowCallWithoutProvider={!!userFriendlyAddress}
          presupposeParams={[
            {
              id: 'merkleUpdate',
              name: 'Merkle Update Transaction',
              value: JSON.stringify({
                validUntil: Date.now() + 900000,
                messages: [
                  {
                    address: userFriendlyAddress || '',
                    amount: '100000', // 0.0001 TON
                    payload: {
                      type: 'merkle-update',
                      oldHash: 'te6ccgEBAQEAJgAASEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==',
                      newHash: 'te6ccgEBAQEAJgAASEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==',
                      depth: 32,
                    },
                  },
                ],
              }),
            },
            {
              id: 'dictionaryCell',
              name: 'Dictionary Cell Transaction',
              value: JSON.stringify({
                validUntil: Date.now() + 900000,
                messages: [
                  {
                    address: userFriendlyAddress || '',
                    amount: '100000', // 0.0001 TON
                    payload: {
                      type: 'dictionary',
                      keySize: 256,
                      data: {
                        '0': 'te6ccgEBAQEAJgAASEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==',
                        '1': 'te6ccgEBAQEAJgAASEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==',
                      },
                    },
                  },
                ],
              }),
            },
          ]}
          onExecute={async (request: string) => {
            try {
              const res = await tonConnectUI?.sendTransaction(JSON.parse(request));
              return JSON.stringify(res);
            } catch (error: any) {
              return JSON.stringify({ error: error.message });
            }
          }}
        />
      </ApiGroup>
      <DappList dapps={dapps} />
    </>
  );
}

export default function App() {
  const enable = localStorage.getItem(TON_SCAM_DAPP_ENABLE_KEY);

  const manifestUrl = enable
    ? 'https://dapp-example.onekeytest.com/scam-tonconnect-manifest.json'
    : 'https://dapp-example.onekeytest.com/tonconnect-manifest.json';

  return (
    <>
      <TonConnectUIProvider
        manifestUrl={manifestUrl}
        walletsListConfiguration={{
          includeWallets: [
            {
              appName: 'onekey',
              name: 'OneKey',
              imageUrl: 'https://common.onekey-asset.com/logo/onekey-x288.png',
              aboutUrl: 'https://onekey.so',
              jsBridgeKey: 'onekeyTonWallet',
              platforms: ['chrome'],
            },
          ],
        }}
      >
        {/* <TonConnectUIProvider manifestUrl="https://ton-connect.github.io/demo-dapp-with-react-ui/tonconnect-manifest.json"> */}
        <Example />
      </TonConnectUIProvider>
    </>
  );
}
