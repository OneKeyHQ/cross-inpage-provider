import React from 'react';
import dynamic from 'next/dynamic';
import PageLayout from '../../components/PageLayout';

// injected provider works only if nextjs ssr disabled
const CosmosExample = dynamic(() => import('../../components/chains/cosmosBabylon/example'), { ssr: false });

export default function () {
  return (
    <PageLayout title={'Cosmos Babylon DApp Example'}>
      <CosmosExample />
    </PageLayout>
  );
}
