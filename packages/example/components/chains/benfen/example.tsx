/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable no-unsafe-optional-chaining */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { dapps } from './dapps.config';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ConnectButton from '../../../components/connect/ConnectButton';
import { hexToBytes, bytesToHex } from '@noble/hashes/utils';
import { useWallet } from '../../../components/connect/WalletContext';
import DappList from '../../../components/DAppList';
import { BENFEN_CLOCK_OBJECT_ID, BFC_DECIMALS } from '@benfen/bfc.js/utils';
import params from './params';
import { CoinStruct, getFullnodeUrl } from '@benfen/bfc.js/client';
import {
  useCurrentAccount,
  useSignTransactionBlock,
  useSignAndExecuteTransactionBlock,
  useSignPersonalMessage,
  useBenfenClient,
  useWallets,
  BenfenClientProvider,
  useDisconnectWallet,
  useConnectWallet,
  useCurrentWallet,
  WalletProvider,
  createNetworkConfig,
} from '@benfen/bfc.js/dapp-kit';
import InfoLayout from '../../../components/InfoLayout';
import { TransactionBlock } from '@benfen/bfc.js/transactions';
import {
  verifySignature,
  verifyPersonalMessage,
  verifyTransactionBlock,
} from '@benfen/bfc.js/verify';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSignMessage } from './useSignMessage';
import { ApiGroup, ApiPayload } from '../../ApiActuator';
import { computeTxBudget, sponsorTransaction, TOKEN_INFO } from './utils';
import { IKnownWallet } from '../../connect/types';
import { WalletWithRequiredFeatures } from '@benfen/bfc.js/dist/cjs/wallet-standard';
import BigNumber from 'bignumber.js';
import { ApiForm } from '../../ApiForm';
import { log } from 'console';



function Example() {
  const client = useBenfenClient();
  const { setProvider } = useWallet();
  const [customToAddress, setCustomToAddress] = useState<string>('');

  const currentAccount = useCurrentAccount();
  const { isConnected } = useCurrentWallet();

  const { mutateAsync: signTransactionBlock } = useSignTransactionBlock();
  const { mutateAsync: signAndExecuteTransactionBlock } = useSignAndExecuteTransactionBlock({
    executeFromWallet: true,
  });
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
  const { mutateAsync: signMessage } = useSignMessage();

  console.log('currentAccount', currentAccount);

  useEffect(() => {
    if (isConnected && currentAccount) {
      setProvider(true);
    } else {
      setProvider(false);
    }
  }, [isConnected, currentAccount, setProvider]);

  const signTransactionPresupposeParams = useMemo(() => {
    return params.signTransaction(currentAccount?.address ?? '');
  }, [currentAccount?.address]);

  const signTokenTransactionParams = useMemo(() => {
    return params.signTokenTransaction(currentAccount?.address ?? '');
  }, [currentAccount?.address]);

  return (
    <>
      <ApiGroup title="SignMessage">
        {/* <ApiPayload
          title="signMessage"
          description="签名消息, signMessage 不安全已经弃用, 目前（OneKey、Suiet、Sui Wallet、Martian） signMessage 实际实现已经变成了 signPersonalMessage"
          presupposeParams={params.signMessage}
          onExecute={async (request: string) => {
            const res = await signMessage({
              message: hexToBytes(request),
              account: currentAccount,
            });
            return JSON.stringify(res);
          }}
          onValidate={async (request: string, result: string) => {
            const {
              bytes,
              signature,
            }: {
              bytes: string;
              signature: string;
            } = JSON.parse(result);

            // const publicKey = await verifySignature(hexToBytes(request), signature);
            const publicKey = await verifyPersonalMessage(Buffer.from(bytes, 'base64'), signature);

            return (
              bytesToHex(currentAccount.publicKey) === bytesToHex(publicKey.toRawBytes())
            ).toString();
          }}
        /> */}

        <ApiPayload
          title="signPersonalMessage"
          description="签名消息（SDK 验证依赖网络可能失败，可以刷新网页重试 或 稍后重试，问题上下文 https://github.com/MystenLabs/sui/issues/17912#issuecomment-2166621747）"
          presupposeParams={params.signPersonalMessage}
          onExecute={async (request: string) => {
            const res = await signPersonalMessage({
              message: hexToBytes(request),
              account: currentAccount,
            });
            return JSON.stringify(res);
          }}
          onValidate={async (request: string, result: string) => {
            const {
              bytes,
              signature,
            }: {
              bytes: string;
              signature: string;
            } = JSON.parse(result);

            const publicKey = await verifyPersonalMessage(Buffer.from(bytes, 'base64'), signature);

            return (
              bytesToHex(new Uint8Array(currentAccount?.publicKey)) ===
              bytesToHex(publicKey.toRawBytes())
            ).toString();
          }}
        />
      </ApiGroup>
      <ApiGroup title="Transaction">
        <ApiPayload
          title="signTransactionBlock"
          description="签名交易"
          presupposeParams={signTransactionPresupposeParams}
          onExecute={async (request: string) => {
            const {
              from,
              to,
              amount,
            }: {
              from: string;
              to: string;
              amount: number;
            } = JSON.parse(request);

            const transfer = new TransactionBlock();
            const [coin] = transfer.splitCoins(transfer.gas, [transfer.pure(amount)]);
            transfer.transferObjects([coin], transfer.pure(to));

            const tx = await sponsorTransaction(
              client,
              from,
              await transfer.build({
                client,
                onlyTransactionKind: true,
              }),
            );

            const res: unknown = await signTransactionBlock({
              transactionBlock: tx,
              account: currentAccount,
            });
            return JSON.stringify(res);
          }}
          onValidate={async (request: string, result: string) => {
            const {
              transactionBlockBytes,
              signature,
            }: {
              transactionBlockBytes: string;
              signature: string;
            } = JSON.parse(result);
            const publicKey = await verifyTransactionBlock(
              Buffer.from(transactionBlockBytes, 'base64'),
              signature,
            );

            return (
              bytesToHex(new Uint8Array(currentAccount?.publicKey)) ===
              bytesToHex(publicKey.toRawBytes())
            ).toString();
          }}
        />

        <ApiPayload
          title="signAndExecuteTransactionBlock"
          description="签名并执行交易"
          presupposeParams={signTransactionPresupposeParams}
          onExecute={async (request: string) => {
            const {
              from,
              to,
              amount,
            }: {
              from: string;
              to: string;
              amount: number;
            } = JSON.parse(request);

            const transfer = new TransactionBlock();
            transfer.setSender(from);
            const [coin] = transfer.splitCoins(transfer.gas, [transfer.pure(amount)]);
            transfer.transferObjects([coin], transfer.pure(customToAddress || to));

            const tx = await sponsorTransaction(
              client,
              from,
              await transfer.build({
                client,
                onlyTransactionKind: true,
              }),
            );

            const res: unknown = await signAndExecuteTransactionBlock({
              transactionBlock: tx,
              account: currentAccount,
            });
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="signTransactionBlock"
          description="签名交易 (特殊情况，带 clock、system 参数)"
          presupposeParams={signTransactionPresupposeParams}
          onExecute={async (request: string) => {
            const {
              from,
              to,
              amount,
            }: {
              from: string;
              to: string;
              amount: number;
            } = JSON.parse(request);

            const transfer = new TransactionBlock();
            const [coin] = transfer.splitCoins(transfer.gas, [transfer.pure(amount)]);
            transfer.transferObjects([coin], transfer.pure(to));

            const tx = await sponsorTransaction(
              client,
              from,
              await transfer.build({
                client,
                onlyTransactionKind: true,
              }),
            );

            // @ts-expect-error
            tx.system = () => '0x5';
            // @ts-expect-error
            tx.clock = () => '0x6';
            // @ts-expect-error
            tx.random = () => '0x8';
            // @ts-expect-error
            tx.denyList = () => '0x403';

            const res: unknown = await signTransactionBlock({
              transactionBlock: tx,
              account: currentAccount,
            });
            return JSON.stringify(res);
          }}
          onValidate={async (request: string, result: string) => {
            const {
              transactionBlockBytes,
              signature,
            }: {
              transactionBlockBytes: string;
              signature: string;
            } = JSON.parse(result);
            const publicKey = await verifyTransactionBlock(
              Buffer.from(transactionBlockBytes, 'base64'),
              signature,
            );

            return (
              bytesToHex(new Uint8Array(currentAccount?.publicKey)) ===
              bytesToHex(publicKey.toRawBytes())
            ).toString();
          }}
        />

        <ApiPayload
          title="signTransactionBlock (BUSD)"
          description="BUSD代币转账签名"
          presupposeParams={signTokenTransactionParams}
          onExecute={async (request: string) => {
            const { from, to, amount, token } = JSON.parse(request) as {
              from: string;
              to: string;
              amount: number;
              token: string;
            };

            const transfer = new TransactionBlock();
            transfer.setSender(from);

            const { data: coins } = await client.getCoins({
              owner: from,
              coinType: token,
            });

            if (!coins.length) {
              throw new Error('No BUSD coins found');
            }

            const [coin] = transfer.splitCoins(transfer.object(coins[0].coinObjectId), [
              transfer.pure(amount),
            ]);
            transfer.transferObjects([coin], transfer.pure(to));

            const tx = await sponsorTransaction(
              client,
              from,
              await transfer.build({
                client,
                onlyTransactionKind: true,
              }),
            );

            const res = await signTransactionBlock({
              transactionBlock: tx,
              account: currentAccount,
            });
            return JSON.stringify(res);
          }}
          onValidate={async (request: string, result: string) => {
            const { transactionBlockBytes, signature } = JSON.parse(result) as {
              transactionBlockBytes: string;
              signature: string;
            };
            const publicKey = await verifyTransactionBlock(
              Buffer.from(transactionBlockBytes, 'base64'),
              signature,
            );

            return (
              bytesToHex(new Uint8Array(currentAccount?.publicKey)) ===
              bytesToHex(publicKey.toRawBytes())
            ).toString();
          }}
        />

        <ApiPayload
          title="signAndExecuteTransactionBlock (BUSD)"
          description="BUSD代币转账签名并执行"
          presupposeParams={signTokenTransactionParams}
          onExecute={async (request: string) => {
            const { from, to, amount, token,busdGas } = JSON.parse(request) as {
              from: string;
              to: string;
              amount: number;
              token: string;
              busdGas: boolean;
            };

            const tx = new TransactionBlock();
            const bigintAmount = BigInt(new BigNumber(amount).toFixed(0));
            const { data: bfcCoins } = await client.getCoins({
              owner: from,
              coinType: TOKEN_INFO.BFC.address,
            });

            let gasCoins = bfcCoins;
            let coin: ReturnType<(typeof tx)['splitCoins']>;
            if (busdGas) {
              const { data: busdCoins } = await client.getCoins({
                owner: from,
                coinType: TOKEN_INFO.BUSD.address,
              });
              gasCoins = busdCoins;
              const [primaryCoins, ...otherCoins] = bfcCoins;
              if (otherCoins.length > 0) {
                tx.mergeCoins(
                  tx.object(primaryCoins.coinObjectId),
                  otherCoins.map((i) => tx.object(i.coinObjectId)),
                );
              }
              coin = tx.splitCoins(tx.object(primaryCoins.coinObjectId), [tx.pure(bigintAmount)]);
            } else {
              // 使用 BFC 作为 gas，判断转账的代币类型
              if (token === TOKEN_INFO.BFC.address) {
                // 转账 BFC 代币，可以使用 tx.gas
                coin = tx.splitCoins(tx.gas, [tx.pure(bigintAmount)]);
              } else {
                // 转账其他代币，需要获取对应的代币
                const { data: tokenCoins } = await client.getCoins({
                  owner: from,
                  coinType: token,
                });
                const [primaryCoin, ...otherCoins] = tokenCoins;
                if (otherCoins.length > 0) {
                  tx.mergeCoins(
                    tx.object(primaryCoin.coinObjectId),
                    otherCoins.map((i) => tx.object(i.coinObjectId)),
                  );
                }
                coin = tx.splitCoins(tx.object(primaryCoin.coinObjectId), [tx.pure(bigintAmount)]);
              }
            }

            tx.setGasPayment(
              gasCoins.map((i) => ({ objectId: i.coinObjectId, version: i.version, digest: i.digest })),
            );
            tx.transferObjects([coin], tx.pure(to));
            tx.setSenderIfNotSet(from);

            await computeTxBudget(
              tx,
              gasCoins.reduce((pre, cur) => BigInt(cur.balance) + pre, BigInt(0)),
              busdGas ? TOKEN_INFO.BUSD : TOKEN_INFO.BFC,
              client,
            );

            const res = await signAndExecuteTransactionBlock({
              transactionBlock: tx,
            });

            return JSON.stringify(res);
          }}
        />

        <ApiForm title="Benfen Swap" description="Benfen Swap 相关操作">
          <ApiForm.Text id="swapButtonTitle" value="测试 BFC 转 BUSD" size="lg" />

          <ApiForm.Field type="number" id="swapBfcAmount" label="BFC 数量" required defaultValue='0.01'/>
          <ApiForm.Checkbox id="useBusdGasSwapBfc" label="使用 BUSD 作为 gas" />

          <ApiForm.Button
            id="swapButton"
            label="BFC 转 BUSD"
            onClick={async (formRef) => {
              const amount = formRef?.getValue<string>('swapBfcAmount') ?? '0';
              const busdGas = formRef?.getValue<boolean>('useBusdGasSwapBfc');

              const tx = new TransactionBlock();
              tx.setSenderIfNotSet(currentAccount?.address??'');

              const bigintAmount = BigInt(new BigNumber(amount).shiftedBy(BFC_DECIMALS).toFixed(0));
              const from = currentAccount?.address??'';

              const { data: bfcCoins } = await client.getCoins({
                owner: from,
                coinType: TOKEN_INFO.BFC.address,
              });

              let gasCoins = bfcCoins;
              let coin: ReturnType<(typeof tx)['splitCoins']>;
              if (busdGas) {
                const { data: busdCoins } = await client.getCoins({
                  owner: from,
                  coinType: TOKEN_INFO.BUSD.address,
                });
                gasCoins = busdCoins;
                const [primaryCoins, ...otherCoins] = bfcCoins;
                if (otherCoins.length > 0) {
                  tx.mergeCoins(
                    tx.object(primaryCoins.coinObjectId),
                    otherCoins.map((i) => tx.object(i.coinObjectId)),
                  );
                }
                coin = tx.splitCoins(tx.object(primaryCoins.coinObjectId), [tx.pure(bigintAmount)]);
              } else {
                coin = tx.splitCoins(tx.gas, [tx.pure(bigintAmount)]);
              }

              tx.setGasPayment(
                gasCoins.map((i) => ({ objectId: i.coinObjectId, version: i.version, digest: i.digest })),
              );
              tx.moveCall({
                target: '0xc8::bfc_system::swap_bfc_to_stablecoin',
                typeArguments: [TOKEN_INFO.BUSD.address],
                arguments: [
                  tx.object('0xc9'),
                  coin,
                  tx.object(BENFEN_CLOCK_OBJECT_ID),
                  tx.pure(bigintAmount),
                  tx.pure('0'),
                  // 30 minutes
                  tx.pure(Date.now() + 30 * 60 * 1000),
                ],
              });
              tx.setSenderIfNotSet(from);

              await computeTxBudget(
                tx,
                gasCoins.reduce((pre, cur) => BigInt(cur.balance) + pre, BigInt(0)),
                busdGas ? TOKEN_INFO.BUSD : TOKEN_INFO.BFC,
                client,
                bigintAmount
              );

              const res = await signAndExecuteTransactionBlock({
                transactionBlock: tx,
              });

              formRef?.setValue('swapResponse', JSON.stringify(res, null, 2));
            }}
            validation={{
              fields: ['swapBfcAmount'],
              validator: (values) => {
                if (!values.swapBfcAmount) {
                  return '请输入 BFC 数量';
                }
              },
            }}
          />
          <ApiForm.Field type="text" id="swapResponse" label="响应"  />

          <ApiForm.Separator/>

          <ApiForm.Field type="number" id="swapBusdAmount" label="BUSD 数量" required defaultValue='0.01' />
          <ApiForm.Checkbox id="useBusdGasSwapBusd" label="使用 BUSD 作为 gas" />

          <ApiForm.Button
            id="swapBusdButton"
            label="BUSD 转 BFC"
            onClick={async (formRef) => {
              const amount = formRef?.getValue<string>('swapBusdAmount') ?? '0';
              const busdGas = formRef?.getValue<boolean>('useBusdGasSwapBusd');
              const tx = new TransactionBlock();
              const from = currentAccount?.address??'';

              console.log('=====>>>>> busdGas', busdGas);

              const bigintAmount = BigInt(new BigNumber(amount).shiftedBy(BFC_DECIMALS).toFixed(0));

              const { data: busdCoins } = await client.getCoins({
                owner: from,
                coinType: TOKEN_INFO.BUSD.address,
              });

              let gasCoins = busdCoins;
              let coin: ReturnType<(typeof tx)['splitCoins']>;
              if(busdGas) {
                // 先从合并后的 coin 分割出用于交换的部分
                coin = tx.splitCoins(tx.gas ,[tx.pure(bigintAmount)]);
              } else {
                const [primaryCoin, ...otherCoins] = busdCoins;
                if (otherCoins.length > 0) {
                  tx.mergeCoins(
                    tx.object(primaryCoin.coinObjectId),
                    otherCoins.map((i) => tx.object(i.coinObjectId))
                  );
                }
                // eslint-disable-next-line prefer-const
                coin = tx.splitCoins(tx.object(primaryCoin.coinObjectId), [tx.pure(bigintAmount)]);
                const { data: bfcCoins } = await client.getCoins({
                  owner: from,
                  coinType: TOKEN_INFO.BFC.address,
                });
                gasCoins = bfcCoins;
              }

              tx.setGasPayment(
                gasCoins.map((i) => ({ objectId: i.coinObjectId, version: i.version, digest: i.digest })),
              );
              tx.setSenderIfNotSet(from);
              tx.moveCall({
                target: '0xc8::bfc_system::swap_stablecoin_to_bfc',
                typeArguments: [TOKEN_INFO.BUSD.address],
                arguments: [
                  tx.object('0xc9'),
                  coin,
                  tx.object(BENFEN_CLOCK_OBJECT_ID),
                  tx.pure(bigintAmount),
                  tx.pure('0'),
                  // 30 minutes
                  tx.pure(Date.now() + 30 * 60 * 1000),
                ],
              });

              await computeTxBudget(
                tx,
                gasCoins.reduce((pre, cur) => BigInt(cur.balance) + pre, BigInt(0)),
                busdGas ? TOKEN_INFO.BUSD : TOKEN_INFO.BFC,
                client,
                bigintAmount
              );

              const res = await signAndExecuteTransactionBlock({
                transactionBlock: tx,
              });

              formRef?.setValue('response', JSON.stringify(res, null, 2));
            }}
            validation={{
              fields: ['swapBusdAmount'],
              validator: (values) => {
                if (!values.swapBusdAmount) {
                  return '请输入 BFC 数量';
                }
              },
            }}
          />
          <ApiForm.Field type="text" id="response" label="响应"  />
        </ApiForm>

      </ApiGroup>

      <DappList dapps={dapps} />
    </>
  );
}

const queryClient = new QueryClient();

const { networkConfig } = createNetworkConfig({
  testnet: { url: getFullnodeUrl('testnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
});

function BenfenConnectButton() {
  const wallets = useWallets();
  const currentAccount = useCurrentAccount();
  const { currentWallet, connectionStatus, isConnected } = useCurrentWallet();

  const { mutateAsync: connect } = useConnectWallet();
  const { mutateAsync: disconnect } = useDisconnectWallet();

  const walletsRef = useRef<WalletWithRequiredFeatures[]>([]);
  walletsRef.current = wallets;
  console.log('Benfen Standard Wallets:', walletsRef.current);
  const onConnectWallet = useCallback(
    async (selectedWallet: IKnownWallet): Promise<{ provider: undefined }> => {
      const wallet = walletsRef.current.find((w) => w.name === selectedWallet.id);
      if (!wallet) {
        return Promise.reject('Wallet not found');
      }

      void connect({ wallet, accountAddress: currentAccount?.address });

      return {
        provider: undefined,
      };
    },
    [connect, currentAccount?.address],
  );

  return (
    <>
      <ConnectButton<any>
        fetchWallets={() => {
          return Promise.resolve(
            walletsRef.current.map((wallet) => {
              return {
                id: wallet.name,
                name: wallet.name,
              };
            }),
          );
        }}
        onConnect={onConnectWallet}
        onDisconnect={() => void disconnect()}
      />

      <InfoLayout title="Base Info">
        {currentAccount && <p>Account:{currentAccount?.address ?? ''}</p>}
        {currentAccount && <p>PubKey:{currentAccount?.publicKey ?? ''}</p>}
        {currentAccount && <p>ChainId:{currentAccount?.chains ?? ''}</p>}
        {currentWallet && <p>Wallet Name:{currentWallet?.name ?? ''}</p>}
        {currentWallet && <p>Wallet api version:{currentWallet?.version ?? ''}</p>}
        {currentWallet && (
          <p>Wallet Support Chains :{JSON.stringify(currentWallet?.chains ?? '')}</p>
        )}
        {currentWallet && (
          <p>
            Wallet Icon: <img src={currentWallet?.icon} />
          </p>
        )}
        {connectionStatus && <p>Status :{connectionStatus}</p>}
        {currentWallet && (
          <p>Wallet Support Features: {JSON.stringify(currentWallet?.features ?? '', null, 2)}</p>
        )}
      </InfoLayout>
    </>
  );
}

export default function App() {
  const [activeNetwork, setActiveNetwork] = useState<'mainnet' | 'testnet'>('mainnet');

  return (
    <QueryClientProvider client={queryClient}>
      <BenfenClientProvider
        networks={networkConfig}
        network={activeNetwork}
        onNetworkChange={(network) => {
          setActiveNetwork(network);
        }}
      >
        <WalletProvider autoConnect>
          <BenfenConnectButton />
          <Example />
        </WalletProvider>
      </BenfenClientProvider>
    </QueryClientProvider>
  );
}
