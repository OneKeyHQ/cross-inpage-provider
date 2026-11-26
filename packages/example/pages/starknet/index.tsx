import React from 'react';
import dynamic from 'next/dynamic';
import PageLayout from '../../components/PageLayout';

// injected provider works only if nextjs ssr disabled
const StarknetExample = dynamic(() => import('../../components/chains/starknet/example'), {
  ssr: false,
});

export default function () {
  return (
    <PageLayout title={'Starknet Dapp Example'}>
      <StarknetExample />
    </PageLayout>
  );
}
