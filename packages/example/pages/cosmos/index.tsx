import React from 'react';
import dynamic from 'next/dynamic';
import PageLayout from '../../components/PageLayout';

// injected provider works only if nextjs ssr disabled
const CosmosExample = dynamic(() => import('../../components/cosmos/CosmosExample'), { ssr: false });

export default function () {
  return (
    <PageLayout title={'Cosmos DApp Example'}>
      <CosmosExample />
    </PageLayout>
  );
}
