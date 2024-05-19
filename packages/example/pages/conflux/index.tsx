import React from 'react';
import dynamic from 'next/dynamic';
import PageLayout from '../../components/PageLayout';

const ConfluxExample = dynamic(() => import('../../components/chains/conflux/example'), {
  ssr: false,
});

export default function () {
  return (
    <PageLayout title={'Conflux DApp Example'}>
      <ConfluxExample />
    </PageLayout>
  );
}
