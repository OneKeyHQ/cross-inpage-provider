import React from 'react';
import dynamic from 'next/dynamic';
import PageLayout from '../../components/PageLayout';

// injected provider works only if nextjs ssr disabled
const AptosExample = dynamic(() => import('../../components/chains/aptos/example'), { ssr: false });

export default function () {
  return (
    <PageLayout title={'Aptos DApp Example'}>
      <AptosExample />
    </PageLayout>
  );
}
