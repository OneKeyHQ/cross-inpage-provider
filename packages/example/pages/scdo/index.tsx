import React from 'react';
import dynamic from 'next/dynamic';
import PageLayout from '../../components/PageLayout';

// injected provider works only if nextjs ssr disabled
const ScdoExample = dynamic(() => import('../../components/chains/scdo/example'), { ssr: false });

export default function () {
  return (
    <PageLayout title={'Scdo Dapp Example'}>
      <ScdoExample />
    </PageLayout>
  );
}
