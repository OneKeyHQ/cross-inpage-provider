import React from 'react';
import dynamic from 'next/dynamic';
import PageLayout from '../../components/PageLayout';

// injected provider works only if nextjs ssr disabled
const StellarExample = dynamic(() => import('../../components/chains/stellar/example'), { ssr: false });

export default function () {
  return (
    <PageLayout title={'Stellar Dapp Example'}>
      <StellarExample />
    </PageLayout>
  );
}
