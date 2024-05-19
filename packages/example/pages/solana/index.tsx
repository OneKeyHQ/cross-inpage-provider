import React from 'react';
import dynamic from 'next/dynamic';
import PageLayout from '../../components/PageLayout';

const SolanaExample = dynamic(() => import('../../components/chains/solana/example'), {
  ssr: false,
});

export default function () {
  return (
    <PageLayout title={'Solana Dapp Example'}>
      <SolanaExample />
    </PageLayout>
  );
}
