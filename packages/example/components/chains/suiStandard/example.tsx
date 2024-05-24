/* eslint-disable no-unsafe-optional-chaining */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { dapps } from './dapps.config';
import { useEffect, useState } from 'react';
import { hexToBytes } from '@noble/hashes/utils';
import { ApiPayload, ApiGroup } from '../../../components/ApisContainer';
import { useWallet } from '../../../components/connect/WalletContext';
import DappList from '../../../components/DAppList';
import params from './params';
import { ConnectButton, WalletKitProvider, useWalletKit } from '@mysten/wallet-kit';
import InfoLayout from '../../../components/InfoLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';

import { TransactionBlock } from '@mysten/sui.js/transactions';
import {
  verifySignature,
  verifyPersonalMessage,
  verifyTransactionBlock,
} from '@mysten/sui.js/verify';

function Example() {
  const [network, setNetwork] = useState<string>('MainNet');

  const { setProvider } = useWallet();
  const {
    isConnected,
    accounts,
    disconnect,
    status,
    currentAccount,
    signTransactionBlock,
    signAndExecuteTransactionBlock,
    signMessage,
    signPersonalMessage,
  } = useWalletKit();

  useEffect(() => {
    if (isConnected && currentAccount) {
      setProvider(true);
    } else {
      setProvider(false);
    }
  }, [currentAccount, isConnected, setProvider]);

  return (
    <>
      <InfoLayout title="Base Info">
        <Select
          defaultValue={network}
          onValueChange={(id) => {
            setNetwork(id);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue className="text-base font-medium" placeholder="选择参数" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem key="mainnet" value="MainNet" className="text-base font-medium">
              MainNet
            </SelectItem>
            <SelectItem key="testnet" value="TestNet" className="text-base font-medium">
              TestNet
            </SelectItem>
          </SelectContent>
        </Select>
        {currentAccount && <p>Account:{currentAccount.address}</p>}{' '}
        {currentAccount && <p>PubKey:{currentAccount.publicKey}</p>}{' '}
        {currentAccount && <p>ChainId:{currentAccount.chains}</p>}
        {status && <p>Status :{status}</p>}
      </InfoLayout>

      <ApiGroup title="SignMessage">
        <ApiPayload
          title="SignMessage"
          description="签名消息, 不安全已经弃用, 硬件无法使用"
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
              messageBytes,
              signature,
            }: {
              messageBytes: string;
              signature: string;
            } = JSON.parse(result);

            const publicKey = await verifySignature(hexToBytes(request), signature);

            return (currentAccount.address === publicKey.toSuiAddress()).toString();
          }}
        />

        <ApiPayload
          title="SignPersonalMessage"
          description="签名消息"
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

            const publicKey = await verifyPersonalMessage(hexToBytes(request), signature);

            return (currentAccount.address === publicKey.toSuiAddress()).toString();
          }}
        />
      </ApiGroup>
      <ApiGroup title="Transaction">
        <ApiPayload
          title="SignTransaction"
          description="签名交易"
          presupposeParams={params.signTransaction(currentAccount?.address ?? '')}
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
            const res: unknown = await signTransactionBlock({
              transactionBlock: transfer,
              chain: network.toLowerCase() === 'sui:testnet' ? 'sui:testnet' : 'sui:mainnet',
              account: currentAccount,
            });
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="SignAndExecuteTransactionBlock"
          description="签名并执行交易"
          presupposeParams={params.signTransaction(currentAccount?.address ?? '')}
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
            const res: unknown = await signAndExecuteTransactionBlock({
              transactionBlock: transfer,
              chain: network.toLowerCase() === 'sui:testnet' ? 'sui:testnet' : 'sui:mainnet',
              account: currentAccount,
            });
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
    <WalletKitProvider features={['sui:signTransactionBlock']} enableUnsafeBurner>
      <ConnectButton />
      <Example />
    </WalletKitProvider>
  );
}
