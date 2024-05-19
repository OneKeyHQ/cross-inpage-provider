import React from 'react';
import dynamic from 'next/dynamic';
import PageLayout from '../../components/PageLayout';

// injected provider works only if nextjs ssr disabled
const AptosExample = dynamic(() => import('../../components/chains/aptosWalletConnect/AptosExample'), {
  ssr: false,
});

export default function () {
  return (
    <PageLayout title={'Aptos Wallet Connect DApp Example'}>
      <AptosExample />
    </PageLayout>
  );
}
