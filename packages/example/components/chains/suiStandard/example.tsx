/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable no-unsafe-optional-chaining */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { dapps } from './dapps.config';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { hexToBytes,bytesToHex } from '@noble/hashes/utils';
import { useWallet } from '../../../components/connect/WalletContext';
import DappList from '../../../components/DAppList';
import params from './params';
import { getFullnodeUrl } from '@mysten/sui.js/client';
import { SUI_TYPE_ARG, normalizeSuiAddress } from '@mysten/sui.js/utils';
import type { CoinStruct, SuiClient } from '@mysten/sui.js/client';

import {
  ConnectButton,
  useCurrentAccount,
  useSignTransactionBlock,
  useSignAndExecuteTransactionBlock,
  useSignPersonalMessage,
  useSuiClient,
  useWallets,
  useDisconnectWallet,
  useConnectWallet,
  useCurrentWallet,
  useAccounts,
  WalletProvider,
  SuiClientProvider,
  createNetworkConfig,
} from '@mysten/dapp-kit';
import InfoLayout from '../../../components/InfoLayout';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import {
  verifyPersonalMessage,
  verifyTransactionBlock,
} from '@mysten/sui.js/verify';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@mysten/dapp-kit/dist/index.css';
import { useSignMessage } from './useSignMessage';
import { ApiGroup, ApiPayload } from '../../ApiActuator';
import { sponsorTransaction } from './utils';
import { ApiComboboxRef, ApiForm, ApiFormRef } from '../../ApiForm';
import BigNumber from 'bignumber.js';
import { useAtom } from 'jotai';
import { useFormContext } from '../../ApiForm/hooks/useFormContext';

export function normalizeSuiCoinType(coinType: string): string {
  if (coinType !== SUI_TYPE_ARG) {
    const [normalAddress, module, name] = coinType.split('::');
    if (module && name) {
      try {
        return `${normalizeSuiAddress(
          normalAddress,
        ).toLowerCase()}::${module}::${name}`;
      } catch {
        // pass
      }
    }
  }
  return coinType;
}

function AssetInfoView({ viewRef, client }: { viewRef: ApiFormRef | undefined, client: SuiClient }) {

  const { store } = useFormContext();
  const [field] = useAtom(store.fieldAtom<string>('asset'));

  useEffect(() => {
    if (viewRef) {
      void (async () => {
        const coinInfo = await client.getCoinMetadata({ coinType: field.value });
        viewRef?.setValue('assetInfo', `name: ${coinInfo?.name}, symbol: ${coinInfo?.symbol}, decimals: ${coinInfo?.decimals}`);
        viewRef?.setValue('assetDecimals', coinInfo?.decimals);
      })();
    }
  }, [client, field.value, viewRef]);

  return <></>
}

function TransferForm() {
  const client = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecuteTransactionBlock } = useSignAndExecuteTransactionBlock();

  const apiFromRef = useRef<ApiFormRef>(null);
  const assetsComboboxRef = useRef<ApiComboboxRef<CoinStruct[]>>(null);

  const getCoins = async () => {
    const coins = await client.getAllCoins({ owner: currentAccount?.address });

    const coinTypes = coins.data.reduce((acc, coin) => {
      const coinType = coin.coinType;

      if (!acc.has(coinType)) {
        acc.set(coinType, []);
      }

      acc.get(coinType)?.push(coin);

      return acc;
    }, new Map<string, CoinStruct[]>());

    return coinTypes;
  }

  useEffect(() => {
    if (currentAccount && currentAccount?.address) {
      apiFromRef.current?.setValue('to', currentAccount.address);
      void getCoins().then((coinTypes) => {
        const options = Array.from(coinTypes.keys()).map((key) => {
          return {
            label: key,
            value: key,
            extra: coinTypes.get(key),
          }
        });
        assetsComboboxRef.current?.setOptions(options);
      });
    }
  }, [currentAccount]);

  const handleTransfer = async () => {
    const from = currentAccount?.address;
    const asset = assetsComboboxRef.current?.getCurrentOption();
    const to = apiFromRef.current?.getValue('to');
    const amount = apiFromRef.current?.getValue('amount');
    const decimals = apiFromRef.current?.getValue('assetDecimals');

    const coinType = asset?.value;

    const coins = (await client.getCoins({ owner: from, coinType, limit: 100 })).data;

    const transfer = new TransactionBlock();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const amountBN = new BigNumber(amount).shiftedBy(decimals);
    const amountBNString = amountBN.toString();
    console.log('amountBNString', amountBNString);

    const totalBalance = coins.reduce((acc, coin) => {
      return acc.plus(new BigNumber(coin.balance));
    }, new BigNumber(0));

    if (totalBalance.lt(amountBN)) {
      apiFromRef.current?.setValue('result', '余额不足');
      throw new Error('Insufficient balance');
    }

    const [primaryCoin, ...mergeCoins] = coins?.filter(
      (coin) =>
        normalizeSuiCoinType(coin.coinType) === normalizeSuiCoinType(coinType),
    );

    if (asset?.value === SUI_TYPE_ARG) {
      const coin = transfer.splitCoins(transfer.gas, [transfer.pure(amountBNString)]);
      transfer.transferObjects([coin], transfer.pure(to));
    } else {
      const primaryCoinInput = transfer.object(primaryCoin.coinObjectId);
      if (mergeCoins.length) {
        transfer.mergeCoins(
          primaryCoinInput,
          mergeCoins.map((coin) => transfer.object(coin.coinObjectId)),
        );
      }
      const coin = transfer.splitCoins(primaryCoinInput, [transfer.pure(amountBNString)]);
      transfer.transferObjects([coin], transfer.pure(to));
      transfer.setSender(from);
    }

    const res: unknown = await signAndExecuteTransactionBlock({
      transactionBlock: transfer,
      account: currentAccount,
    });
    apiFromRef.current?.setValue('result', JSON.stringify(res));
  }

  return <ApiForm title="测试 Native & Token 转账" description='测试转账' ref={apiFromRef}>
    <ApiForm.Combobox id='asset' label='选择资产' placeholder='请选择资产' required ref={assetsComboboxRef} />
    <ApiForm.Text id='assetInfo' type='info' />
    <ApiForm.Text id='assetDecimals' type='info' hidden />
    <AssetInfoView viewRef={apiFromRef.current} client={client} />
    <ApiForm.Field id='to' label='to' placeholder='请输入转账地址' />
    <ApiForm.Field id='amount' label='转账金额' defaultValue='0.0001' />
    <ApiForm.Button id='transfer' label='transfer' onClick={handleTransfer} availableDependencyFields={[{ fieldIds: ['asset', 'to', 'amount'] }]} />
    <ApiForm.AutoHeightTextArea id='result' />
  </ApiForm>
}

function Example() {
  const client = useSuiClient();
  const { setProvider } = useWallet();

  const accounts = useAccounts();
  const wallet = useConnectWallet();

  const currentAccount = useCurrentAccount();
  const { currentWallet, connectionStatus, isConnected } = useCurrentWallet();

  const { mutateAsync: connect } = useConnectWallet();
  const { mutateAsync: signTransactionBlock } = useSignTransactionBlock();
  const { mutateAsync: signAndExecuteTransactionBlock } = useSignAndExecuteTransactionBlock();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
  const { mutateAsync: signMessage } = useSignMessage();
  const { mutateAsync: disconnect } = useDisconnectWallet();

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
      </InfoLayout>

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

            return (currentAccount.address === publicKey.toSuiAddress()).toString();
          }}
        /> */}

        <ApiPayload
          title="signPersonalMessage"
          description="签名消息（SDK 验证依赖网络可能会失败，可以刷新网页重试 或 稍后重试，问题上下文 https://github.com/MystenLabs/sui/issues/17912#issuecomment-2166621747）"
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

            return (currentAccount.address === publicKey.toSuiAddress()).toString();
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

            return (currentAccount.address === publicKey.toSuiAddress()).toString();
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
            transfer.transferObjects([coin], transfer.pure(to));

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

            return (currentAccount.address === publicKey.toSuiAddress()).toString();
          }}
        />
         <ApiPayload
          title="signTransactionBlock (USDC)"
          description="USDC代币转账签名"
          presupposeParams={signTokenTransactionParams}
          onExecute={async (request: string) => {
            const { from, to, amount ,token} = JSON.parse(request) as { from: string, to: string, amount: number, token: string };

            const transfer = new TransactionBlock();
            transfer.setSender(from);

            const { data: coins } = await client.getCoins({
              owner: from,
              coinType: token,
            });

            if (!coins.length) {
              throw new Error('No BUSD coins found');
            }

            const [coin] = transfer.splitCoins(
              transfer.object(coins[0].coinObjectId),
              [transfer.pure(amount)]
            );
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
            const { transactionBlockBytes, signature } = JSON.parse(result) as { transactionBlockBytes: string, signature: string };
            const publicKey = await verifyTransactionBlock(
              Buffer.from(transactionBlockBytes, 'base64'),
              signature,
            );

            return (
              bytesToHex(new Uint8Array(currentAccount.publicKey)) === bytesToHex(publicKey.toRawBytes())
            ).toString();
          }}
        />

        <ApiPayload
          title="signAndExecuteTransactionBlock (USDC)"
          description="USDC代币转账签名并执行"
          presupposeParams={signTokenTransactionParams}
          onExecute={async (request: string) => {
            const { from, to, amount, token } = JSON.parse(request) as { from: string, to: string, amount: number, token: string };

            const transfer = new TransactionBlock();
            transfer.setSender(from);

            const { data: coins } = await client.getCoins({
              owner: from,
              coinType: token,
            });

            if (!coins.length) {
              throw new Error('No BUSD coins found');
            }

            const [coin] = transfer.splitCoins(
              transfer.object(coins[0].coinObjectId),
              [transfer.pure(BigInt(amount))]
            );
            transfer.transferObjects([coin], transfer.pure(to));

            const tx = await sponsorTransaction(
              client,
              from,
              await transfer.build({
                client,
                onlyTransactionKind: true,
              }),
            );

            const res = await signAndExecuteTransactionBlock({
              transactionBlock: tx,
              account: currentAccount,
            });

            return JSON.stringify(res);
          }}
        />
      </ApiGroup>

      <ApiGroup title="业务测试">
        <TransferForm />
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

export default function App() {
  const [activeNetwork, setActiveNetwork] = useState('mainnet');

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider
        networks={networkConfig}
        // @ts-expect-error
        network={activeNetwork}
        onNetworkChange={(network) => {
          setActiveNetwork(network);
        }}
      >
        <WalletProvider enableUnsafeBurner autoConnect>
          <ConnectButton />
          <Example />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
