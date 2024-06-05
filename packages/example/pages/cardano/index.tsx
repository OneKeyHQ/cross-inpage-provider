import React from 'react';
import dynamic from 'next/dynamic';
import PageLayout from '../../components/PageLayout';

// injected provider works only if nextjs ssr disabled
const CardanoExample = dynamic(() => import('../../components/chains/cardano/example'), {
  ssr: false,
});

export default function () {
  return (
    <PageLayout title={'Cardano DApp Example'}>
      <CardanoExample />
    </PageLayout>
  );
}
