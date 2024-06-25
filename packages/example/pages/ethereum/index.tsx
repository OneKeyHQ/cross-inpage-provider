import React from 'react';
import dynamic from 'next/dynamic';
import PageLayout from '../../components/PageLayout';

// injected provider works only if nextjs ssr disabled
const EVMExample = dynamic(() => import('../../components/chains/ethereum/example'), {
  ssr: false,
});

export default function () {
  return (
    <PageLayout title={'EVM DApp Example'}>
      <EVMExample />
    </PageLayout>
  );
}
