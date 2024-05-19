import React from 'react';
import dynamic from 'next/dynamic';
import PageLayout from '../../components/PageLayout';

// injected provider works only if nextjs ssr disabled
const NearExample = dynamic(() => import('../../components/chains/near/NearExample'), { ssr: false });

export default function () {
  return (
    <PageLayout title={'Near Dapp Example'}>
      <NearExample />
    </PageLayout>
  );
}
