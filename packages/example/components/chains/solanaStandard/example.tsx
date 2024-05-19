/* eslint-disable no-unsafe-optional-chaining */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
require('@solana/wallet-adapter-react-ui/styles.css');
import { dapps } from './dapps.config';
import { useEffect, useMemo, useRef, useState } from 'react';
import { hexToBytes } from '@noble/hashes/utils';
import { get } from 'lodash';
import { IProviderApi, IProviderInfo } from './types';
import { ApiPayload, ApiGroup } from '@/components/ApisContainer';
import { useWallet } from '@/components/connect/WalletContext';
import type { IKnownWallet } from '@/components/connect/types';
import DappList from '@/components/DAppList';
import params from './params';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { UnsafeBurnerWalletAdapter } from '@solana/wallet-adapter-wallets';
import {
  WalletModalProvider,
  WalletDisconnectButton,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';
import { useConnection, useWallet as useSolWallet } from '@solana/wallet-adapter-react';
import InfoLayout from '@/components/InfoLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { clusterApiUrl } from '@solana/web3.js';

function Example() {
  const [network, setNetwork] = useState<string>('MainNet');

  const { setProvider } = useWallet();

  const { connection } = useConnection();
  const { connected, publicKey,signMessage } = useSolWallet();

  useEffect(() => {
    if (connected) {
      setProvider(true);
    } else {
      setProvider(false);
    }
  }, [connected, setProvider]);

  return (
    <>
      <WalletMultiButton />

      <InfoLayout title="Base Info">
        {publicKey && <p>PublicKey: {publicKey.toBase58()}</p>}{' '}
      </InfoLayout>

      <ApiGroup title="Basics">
        <ApiPayload
          title="signMessage"
          description="签名消息"
          onExecute={async (request: string) => {
            const res = await signMessage(hexToBytes(request));
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>

      <DappList dapps={dapps} />
    </>
  );
}

export default function App() {
  const network = WalletAdapterNetwork.Mainnet;

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(
    () => [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [network],
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Example />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
