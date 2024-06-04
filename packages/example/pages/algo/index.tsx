import React from 'react';
import dynamic from 'next/dynamic';
import PageLayout from '../../components/PageLayout';

// injected provider works only if nextjs ssr disabled
const AlgoExample = dynamic(() => import('../../components/chains/algo/example'), {
  ssr: false,
});

export default function () {
  return (
    <PageLayout title={'Algo DApp Example'}>
      <AlgoExample />
    </PageLayout>
  );
}
