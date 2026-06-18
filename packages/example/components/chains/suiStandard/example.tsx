/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable no-unsafe-optional-chaining */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { dapps } from './dapps.config';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { hexToBytes, bytesToHex } from '@noble/hashes/utils';
import { useWallet } from '../../../components/connect/WalletContext';
import DappList from '../../../components/DAppList';
import params from './params';
// @mysten/sui 2.x: the JSON-RPC client + helpers moved to /jsonRpc
// (SuiClient -> SuiJsonRpcClient, getFullnodeUrl -> getJsonRpcFullnodeUrl)
import {
  getJsonRpcFullnodeUrl as getFullnodeUrl,
  SuiJsonRpcClient as SuiClient,
} from '@mysten/sui/jsonRpc';
import { SUI_TYPE_ARG, isValidSuiAddress, normalizeSuiAddress } from '@mysten/sui/utils';
import type { CoinStruct } from '@mysten/sui/jsonRpc';
import { bcs } from '@mysten/sui/bcs';

import {
  ConnectButton,
  useCurrentAccount,
  useSignTransaction,
  useSignAndExecuteTransaction,
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
import { Transaction } from '@mysten/sui/transactions';
import { verifyPersonalMessageSignature, verifyTransactionSignature } from '@mysten/sui/verify';
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
        return `${normalizeSuiAddress(normalAddress).toLowerCase()}::${module}::${name}`;
      } catch {
        // pass
      }
    }
  }
  return coinType;
}

const UNSAFE_MULTI_RECIPIENT_DEMO_ADDRESSES = new Set([
  '0x0000000000000000000000000000000000000000000000000000000000000000',
  '0x1111111111111111111111111111111111111111111111111111111111111111',
  '0x2222222222222222222222222222222222222222222222222222222222222222',
]);

function normalizeSafeDemoRecipients(recipients: string[]) {
  return recipients.map((recipient, index) => {
    const trimmedRecipient = recipient.trim();
    if (!isValidSuiAddress(trimmedRecipient)) {
      throw new Error(`Recipient ${index + 1} must be a full SUI address`);
    }
    const normalizedRecipient = normalizeSuiAddress(trimmedRecipient);
    if (UNSAFE_MULTI_RECIPIENT_DEMO_ADDRESSES.has(normalizedRecipient)) {
      throw new Error(`Recipient ${index + 1} is not safe for this demo`);
    }
    return normalizedRecipient;
  });
}

function parseSignedSuiTransactionResult(result: string) {
  const {
    bytes,
    transactionBlockBytes,
    signature,
  }: {
    bytes?: string;
    transactionBlockBytes?: string;
    signature?: string;
  } = JSON.parse(result);
  const transactionBlock = transactionBlockBytes ?? bytes;
  if (!transactionBlock) {
    throw new Error('Missing signed transaction bytes');
  }
  if (!signature) {
    throw new Error('Missing signature');
  }
  return { transactionBlock, signature };
}

function AssetInfoView({
  viewRef,
  client,
}: {
  viewRef: ApiFormRef | undefined;
  client: SuiClient;
}) {
  const { store } = useFormContext();
  const [field] = useAtom(store.fieldAtom<string>('asset'));

  useEffect(() => {
    if (viewRef) {
      void (async () => {
        try {
          const coinInfo = await client.getCoinMetadata({ coinType: field.value });
          viewRef?.setValue(
            'assetInfo',
          `name: ${coinInfo?.name}, symbol: ${coinInfo?.symbol}, decimals: ${coinInfo?.decimals}`,
          );
          viewRef?.setValue('assetDecimals', coinInfo?.decimals);
        } catch (error) {
          console.error(error);
        }
      })();
    }
  }, [client, field.value, viewRef]);

  return <></>;
}

function TransferForm() {
  const client = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

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
  };

  useEffect(() => {
    if (currentAccount && currentAccount?.address) {
      apiFromRef.current?.setValue('to', currentAccount.address);
      void getCoins().then((coinTypes) => {
        const options = Array.from(coinTypes.keys()).map((key) => {
          return {
            label: key,
            value: key,
            extra: coinTypes.get(key),
          };
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

    const transfer = new Transaction();

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
      (coin) => normalizeSuiCoinType(coin.coinType) === normalizeSuiCoinType(coinType),
    );

    if (asset?.value === SUI_TYPE_ARG) {
      const coin = transfer.splitCoins(transfer.gas, [amountBNString]);
      transfer.transferObjects([coin], to);
    } else {
      const primaryCoinInput = transfer.object(primaryCoin.coinObjectId);
      if (mergeCoins.length) {
        transfer.mergeCoins(
          primaryCoinInput,
          mergeCoins.map((coin) => transfer.object(coin.coinObjectId)),
        );
      }
      const coin = transfer.splitCoins(primaryCoinInput, [amountBNString]);
      transfer.transferObjects([coin], to);
      transfer.setSender(from);
    }

    const res: unknown = await signAndExecuteTransaction({
      transaction: transfer,
      account: currentAccount,
    });
    apiFromRef.current?.setValue('result', JSON.stringify(res));
  };

  return (
    <ApiForm title="测试 Native & Token 转账" description="测试转账" ref={apiFromRef}>
      <ApiForm.Combobox
        id="asset"
        label="选择资产"
        placeholder="请选择资产"
        required
        ref={assetsComboboxRef}
      />
      <ApiForm.Text id="assetInfo" type="info" />
      <ApiForm.Text id="assetDecimals" type="info" hidden />
      <AssetInfoView viewRef={apiFromRef.current} client={client} />
      <ApiForm.Field id="to" label="to" placeholder="请输入转账地址" />
      <ApiForm.Field id="amount" label="转账金额" defaultValue="0.0001" />
      <ApiForm.Button
        id="transfer"
        label="transfer"
        onClick={handleTransfer}
        availableDependencyFields={[{ fieldIds: ['asset', 'to', 'amount'] }]}
      />
      <ApiForm.AutoHeightTextArea id="result" />
    </ApiForm>
  );
}

// 复用 TransferForm 的资产加载逻辑：按 coinType 聚合当前账户的币并填充下拉框
function useAssetCombobox(
  apiFromRef: React.RefObject<ApiFormRef>,
  assetsComboboxRef: React.RefObject<ApiComboboxRef<CoinStruct[]>>,
) {
  const client = useSuiClient();
  const currentAccount = useCurrentAccount();

  const getCoins = async () => {
    const coins = await client.getAllCoins({ owner: currentAccount?.address });

    return coins.data.reduce((acc, coin) => {
      const coinType = coin.coinType;
      if (!acc.has(coinType)) {
        acc.set(coinType, []);
      }
      acc.get(coinType)?.push(coin);
      return acc;
    }, new Map<string, CoinStruct[]>());
  };

  useEffect(() => {
    if (currentAccount && currentAccount?.address) {
      apiFromRef.current?.setValue('to', currentAccount.address);
      void getCoins().then((coinTypes) => {
        const options = Array.from(coinTypes.keys()).map((key) => {
          return {
            label: key,
            value: key,
            extra: coinTypes.get(key),
          };
        });
        assetsComboboxRef.current?.setOptions(options);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAccount]);
}

function SendFundsForm() {
  const client = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const apiFromRef = useRef<ApiFormRef>(null);
  const assetsComboboxRef = useRef<ApiComboboxRef<CoinStruct[]>>(null);

  useAssetCombobox(apiFromRef, assetsComboboxRef);

  const handleSend = async () => {
    const from = currentAccount?.address;
    const asset = assetsComboboxRef.current?.getCurrentOption();
    const to = apiFromRef.current?.getValue('to');
    const amount = apiFromRef.current?.getValue('amount');
    const decimals = apiFromRef.current?.getValue('assetDecimals');

    const coinType = asset?.value;
    const amountBNString = new BigNumber(amount).shiftedBy(decimals).toString();

    const tx = new Transaction();
    tx.setSender(from);
    tx.moveCall({
      target: '0x2::coin::send_funds',
      typeArguments: [coinType],
      arguments: [
        // coinWithBalance: sources from owned coins / address balance
        tx.coin({ type: coinType, balance: BigInt(amountBNString) }),
        tx.pure.address(to),
      ],
    });

    const res: unknown = await signAndExecuteTransaction({
      transaction: tx,
      account: currentAccount,
    });
    apiFromRef.current?.setValue('result', JSON.stringify(res));
  };

  return (
    <ApiForm
      title="send_funds"
      description="存入余额地址：0x2::coin::send_funds 把币转入收款方的 address balance（任何人都可存入，自动合并）"
      ref={apiFromRef}
    >
      <ApiForm.Combobox
        id="asset"
        label="选择资产"
        placeholder="请选择资产"
        required
        ref={assetsComboboxRef}
      />
      <ApiForm.Text id="assetInfo" type="info" />
      <ApiForm.Text id="assetDecimals" type="info" hidden />
      <AssetInfoView viewRef={apiFromRef.current} client={client} />
      <ApiForm.Field id="to" label="to" placeholder="请输入收款地址" />
      <ApiForm.Field id="amount" label="存入金额" defaultValue="0.0001" />
      <ApiForm.Button
        id="send"
        label="send_funds"
        onClick={handleSend}
        availableDependencyFields={[{ fieldIds: ['asset', 'to', 'amount'] }]}
      />
      <ApiForm.AutoHeightTextArea id="result" />
    </ApiForm>
  );
}

function RedeemFundsForm() {
  const client = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const apiFromRef = useRef<ApiFormRef>(null);
  const assetsComboboxRef = useRef<ApiComboboxRef<CoinStruct[]>>(null);

  useAssetCombobox(apiFromRef, assetsComboboxRef);

  const handleRedeem = async () => {
    const from = currentAccount?.address;
    const asset = assetsComboboxRef.current?.getCurrentOption();
    const to = apiFromRef.current?.getValue('to');
    const amount = apiFromRef.current?.getValue('amount');
    const decimals = apiFromRef.current?.getValue('assetDecimals');

    const coinType = asset?.value;
    const amountBNString = new BigNumber(amount).shiftedBy(decimals).toString();

    const tx = new Transaction();
    tx.setSender(from);
    const [withdrawn] = tx.moveCall({
      target: '0x2::coin::redeem_funds',
      typeArguments: [coinType],
      arguments: [
        tx.withdrawal({
          amount: BigInt(amountBNString).toString(),
          type: coinType,
        }),
      ],
    });
    tx.transferObjects([withdrawn], to);

    const res: unknown = await signAndExecuteTransaction({
      transaction: tx,
      account: currentAccount,
    });
    apiFromRef.current?.setValue('result', JSON.stringify(res));
  };

  return (
    <ApiForm
      title="redeem_funds"
      description="花余额地址的钱：tx.withdrawal + 0x2::coin::redeem_funds 从自己的 address balance 取出并转给收款方（只有 owner 可取出）"
      ref={apiFromRef}
    >
      <ApiForm.Combobox
        id="asset"
        label="选择资产"
        placeholder="请选择资产"
        required
        ref={assetsComboboxRef}
      />
      <ApiForm.Text id="assetInfo" type="info" />
      <ApiForm.Text id="assetDecimals" type="info" hidden />
      <AssetInfoView viewRef={apiFromRef.current} client={client} />
      <ApiForm.Field id="to" label="to" placeholder="请输入收款地址" />
      <ApiForm.Field id="amount" label="取出金额" defaultValue="0.0001" />
      <ApiForm.Button
        id="redeem"
        label="redeem_funds"
        onClick={handleRedeem}
        availableDependencyFields={[{ fieldIds: ['asset', 'to', 'amount'] }]}
      />
      <ApiForm.AutoHeightTextArea id="result" />
    </ApiForm>
  );
}

function Example() {
  const client = useSuiClient();
  const { setProvider } = useWallet();

  const accounts = useAccounts();
  const wallet = useConnectWallet();

  const currentAccount = useCurrentAccount();
  const { currentWallet, connectionStatus, isConnected } = useCurrentWallet();

  const { mutateAsync: connect } = useConnectWallet();
  const { mutateAsync: signTransaction } = useSignTransaction();
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
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

  const signMultiRecipientTransactionPresupposeParams = useMemo(() => {
    return params.signMultiRecipientTransaction(currentAccount?.address ?? '');
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

            const publicKey = await verifyPersonalMessageSignature(
              Buffer.from(bytes, 'base64'),
              signature,
            );

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

            const transfer = new Transaction();
            const [coin] = transfer.splitCoins(transfer.gas, [amount]);
            transfer.transferObjects([coin], to);

            const tx = await sponsorTransaction(
              client,
              from,
              await transfer.build({
                client,
                onlyTransactionKind: true,
              }),
            );

            const res: unknown = await signTransaction({
              transaction: tx,
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
            const publicKey = await verifyTransactionSignature(
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

            const transfer = new Transaction();
            transfer.setSender(from);
            const [coin] = transfer.splitCoins(transfer.gas, [amount]);
            transfer.transferObjects([coin], to);

            const tx = await sponsorTransaction(
              client,
              from,
              await transfer.build({
                client,
                onlyTransactionKind: true,
              }),
            );

            const res: unknown = await signAndExecuteTransaction({
              transaction: tx,
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

            const transfer = new Transaction();
            const [coin] = transfer.splitCoins(transfer.gas, [amount]);
            transfer.transferObjects([coin], to);

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

            const res: unknown = await signTransaction({
              transaction: tx,
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
            const publicKey = await verifyTransactionSignature(
              Buffer.from(transactionBlockBytes, 'base64'),
              signature,
            );

            return (currentAccount.address === publicKey.toSuiAddress()).toString();
          }}
        />
        <ApiPayload
          title="signTransaction (多签复刻)"
          description="用原始 DragonBall 合约调用 tx，刷新 mainnet 上的 object 版本后重新序列化并签名。sender ≠ 当前账户。"
          presupposeParams={[
            {
              id: 'reproduceRealTx',
              name: '多签复刻（mainnet）',
              value:
                'AAADAQDsuo2nhSxc7cB45ZFJBzzCBEnlNaJIo/ZftmBUm8p5EczBITEAAAAAIPNzl4FMi4POCfRC2IZTPbmtPBOLjSCTK6Rs1nqVmq1XAQHxn+Bjcch7yq6i0qjCLWgjneB9fee+SMysjHY2DDVbWrfUhDAAAAAAAQAgilcTJiZDsNW/7CjGknxUyeKreRBgmZ/tHCuOlqNGxwABACWEjIkS/MUDG4lmyHcG4zXqBv9ksxF1CLVO1b3pUoolCmdvdmVybmFuY2UUZ3JhbnRfcGFyYW1fbW9kaWZpZXIAAwEAAAEBAAECAOXpW8OoseK4/d0AMRJLd4+N3kC7cxgI+knWOIx5pKB9AbhxevR2YeOf9RKAmhVYFyi1JZUR7hZaMqNzKN+hvZ12KunmKgAAAAAgig+Wha8y0ruDOorfk28LOAavQpddXKWDBA+qkr7XYmHl6VvDqLHiuP3dADESS3ePjd5Au3MYCPpJ1jiMeaSgfSsCAAAAAAAAxKEkAAAAAAAA',
            },
          ]}
          onExecute={async (request: string) => {
            const mainnet = new SuiClient({
              url: getFullnodeUrl('mainnet'),
              network: 'mainnet',
            });
            const origBytes = Buffer.from(request, 'base64');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const parsed: any = bcs.TransactionData.parse(origBytes);
            const v1 = parsed.V1;

            const refreshRef = async (id: string) => {
              const r = await mainnet.getObject({ id, options: {} });
              if (!r.data) throw new Error(`object ${id} 已不存在`);
              return {
                objectId: r.data.objectId,
                version: r.data.version,
                digest: r.data.digest,
              };
            };

            for (const input of v1.kind.ProgrammableTransaction.inputs) {
              const owned = input?.Object?.ImmOrOwnedObject;
              if (owned) input.Object.ImmOrOwnedObject = await refreshRef(owned.objectId);
            }
            v1.gasData.payment = await Promise.all(
              v1.gasData.payment.map((gp: { objectId: string }) => refreshRef(gp.objectId)),
            );
            v1.gasData.price = String(await mainnet.getReferenceGasPrice());
            v1.gasData.budget = '10000000';

            const newBytes = bcs.TransactionData.serialize(parsed).toBytes();
            const res: unknown = await signTransaction({
              transaction: Transaction.from(newBytes),
              account: currentAccount,
              chain: 'sui:mainnet',
            });
            return JSON.stringify(res);
          }}
          onValidate={async (_request: string, result: string) => {
            const { bytes, signature } = JSON.parse(result) as {
              bytes: string;
              signature: string;
            };
            const publicKey = await verifyTransactionSignature(
              Buffer.from(bytes, 'base64'),
              signature,
            );
            return (currentAccount.address === publicKey.toSuiAddress()).toString();
          }}
        />

        <ApiPayload
          title="signTransactionBlock (Multi Recipient)"
          description="Builds one SUI PTB with multiple TransferObjects commands. Defaults to self-transfer recipients for safety; edit recipients to your own addresses when testing different To values."
          presupposeParams={signMultiRecipientTransactionPresupposeParams}
          onExecute={async (request: string) => {
            const {
              from,
              recipients,
              amount,
            }: {
              from: string;
              recipients: string[];
              amount: number;
            } = JSON.parse(request);

            if (!from || !isValidSuiAddress(from)) {
              throw new Error('Connect a SUI account before signing');
            }
            if (!Number.isSafeInteger(amount) || amount <= 0) {
              throw new Error('Amount must be a positive integer in MIST');
            }
            if (!Array.isArray(recipients) || recipients.length === 0) {
              throw new Error('At least one recipient is required');
            }
            const safeRecipients = normalizeSafeDemoRecipients(recipients);

            const transfer = new Transaction();
            const coins = transfer.splitCoins(
              transfer.gas,
              safeRecipients.map(() => amount),
            );
            safeRecipients.forEach((recipient, index) => {
              const coin = coins[index];
              if (!coin) {
                throw new Error(`Missing split coin for recipient ${index}`);
              }
              transfer.transferObjects([coin], recipient);
            });

            const tx = await sponsorTransaction(
              client,
              from,
              await transfer.build({
                client,
                onlyTransactionKind: true,
              }),
            );

            const res: unknown = await signTransaction({
              transaction: tx,
              account: currentAccount,
            });
            return JSON.stringify(res);
          }}
          onValidate={async (_request: string, result: string) => {
            const { transactionBlock, signature } = parseSignedSuiTransactionResult(result);
            const publicKey = await verifyTransactionSignature(
              Buffer.from(transactionBlock, 'base64'),
              signature,
            );

            return (currentAccount.address === publicKey.toSuiAddress()).toString();
          }}
          onBroadcast={async (_request: string, result: string) => {
            const { transactionBlock, signature } = parseSignedSuiTransactionResult(result);
            const res = await client.executeTransactionBlock({
              transactionBlock,
              signature,
              options: {
                showEffects: true,
                showEvents: true,
              },
            });
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="signTransactionBlock (USDC)"
          description="USDC代币转账签名"
          presupposeParams={signTokenTransactionParams}
          onExecute={async (request: string) => {
            const { from, to, amount, token } = JSON.parse(request) as {
              from: string;
              to: string;
              amount: number;
              token: string;
            };

            const transfer = new Transaction();
            transfer.setSender(from);

            const { data: coins } = await client.getCoins({
              owner: from,
              coinType: token,
            });

            if (!coins.length) {
              throw new Error('No BUSD coins found');
            }

            const [coin] = transfer.splitCoins(transfer.object(coins[0].coinObjectId), [amount]);
            transfer.transferObjects([coin], to);

            const tx = await sponsorTransaction(
              client,
              from,
              await transfer.build({
                client,
                onlyTransactionKind: true,
              }),
            );

            const res = await signTransaction({
              transaction: tx,
              account: currentAccount,
            });
            return JSON.stringify(res);
          }}
          onValidate={async (request: string, result: string) => {
            const { transactionBlockBytes, signature } = JSON.parse(result) as {
              transactionBlockBytes: string;
              signature: string;
            };
            const publicKey = await verifyTransactionSignature(
              Buffer.from(transactionBlockBytes, 'base64'),
              signature,
            );

            return (
              bytesToHex(new Uint8Array(currentAccount.publicKey)) ===
              bytesToHex(publicKey.toRawBytes())
            ).toString();
          }}
        />

        <ApiPayload
          title="signAndExecuteTransactionBlock (USDC)"
          description="USDC代币转账签名并执行"
          presupposeParams={signTokenTransactionParams}
          onExecute={async (request: string) => {
            const { from, to, amount, token } = JSON.parse(request) as {
              from: string;
              to: string;
              amount: number;
              token: string;
            };

            const transfer = new Transaction();
            transfer.setSender(from);

            const { data: coins } = await client.getCoins({
              owner: from,
              coinType: token,
            });

            if (!coins.length) {
              throw new Error('No BUSD coins found');
            }

            const [coin] = transfer.splitCoins(transfer.object(coins[0].coinObjectId), [amount]);
            transfer.transferObjects([coin], to);

            const tx = await sponsorTransaction(
              client,
              from,
              await transfer.build({
                client,
                onlyTransactionKind: true,
              }),
            );

            const res = await signAndExecuteTransaction({
              transaction: tx,
              account: currentAccount,
            });

            return JSON.stringify(res);
          }}
        />
      </ApiGroup>

      <ApiGroup title="Address Balance (accumulator)">
        <SendFundsForm />
        <RedeemFundsForm />
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
  testnet: { url: getFullnodeUrl('testnet'), network: 'testnet' },
  mainnet: { url: getFullnodeUrl('mainnet'), network: 'mainnet' },
});

export default function App() {
  const [activeNetwork, setActiveNetwork] = useState<'mainnet' | 'testnet'>(
    'mainnet',
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider
        networks={networkConfig}
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
