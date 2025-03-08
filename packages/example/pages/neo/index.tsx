import React from 'react';
import dynamic from 'next/dynamic';
import { WalletProvider } from '../../components/connect/WalletContext';

const NeoExample = dynamic(() => import('../../components/chains/neo/example'), {
  ssr: false,
});

export default function Neo() {
  return (
    <WalletProvider>
      <NeoExample />
    </WalletProvider>
  );
}
