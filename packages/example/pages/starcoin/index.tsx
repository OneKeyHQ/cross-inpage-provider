import React from 'react';
import dynamic from 'next/dynamic';
import PageLayout from '../../components/PageLayout';

// injected provider works only if nextjs ssr disabled
const STCExample = dynamic(() => import('../../components/chains/starcoin/example'), { ssr: false });

export default function () {
  return (
    <PageLayout title={'STC Dapp Example'}>
      <STCExample />
    </PageLayout>
  );
}
