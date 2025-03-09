import React from 'react';
import dynamic from 'next/dynamic';
import PageLayout from '../../components/PageLayout';

const NeoExample = dynamic(() => import('../../components/chains/neo/example'), {
  ssr: false,
});

export default function Neo() {
  return (
    <PageLayout title={'NEO DApp Example'}>
      <NeoExample />
    </PageLayout>
  );
}
