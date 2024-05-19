/* eslint-disable no-unsafe-optional-chaining */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { dapps } from './dapps.config';
import { useEffect, useRef, useState } from 'react';
import { hexToBytes } from '@noble/hashes/utils';
import { get } from 'lodash';
import { IProviderApi, IProviderInfo } from './types';
import { ApiPayload, ApiGroup } from '@/components/ApisContainer';
import { useWallet } from '@/components/connect/WalletContext';
import type { IKnownWallet } from '@/components/connect/types';
import DappList from '@/components/DAppList';
import params from './params';
import { ConnectButton, WalletKitProvider, useWalletKit } from '@mysten/wallet-kit';
import InfoLayout from '@/components/InfoLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function Example() {
  const [network, setNetwork] = useState<string>('MainNet');

  const { setProvider } = useWallet();
  const {
    isConnected,
    accounts,
    disconnect,
    currentAccount,
    signTransactionBlock,
    signAndExecuteTransactionBlock,
    signMessage,
    signPersonalMessage,
  } = useWalletKit();

  useEffect(() => {
    if (isConnected) {
      setProvider(true);
    } else {
      setProvider(false);
    }
  }, [isConnected, setProvider]);

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
      </InfoLayout>

      <ApiGroup title="Basics">
        <ApiPayload
          title="signPersonalMessage"
          description="签名消息"
          onExecute={async (request: string) => {
            const res = await signPersonalMessage({
              message: hexToBytes(request),
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
