import React from 'react';
import dynamic from 'next/dynamic';
import PageLayout from '../../components/PageLayout';

// injected provider works only if nextjs ssr disabled
const PolkadotExample = dynamic(() => import('../../components/chains/polkadot/example'), { ssr: false });

export default function () {
  return (
    <PageLayout title={'Polkadot Dapp Example'}>
      <PolkadotExample />
    </PageLayout>
  );
}
