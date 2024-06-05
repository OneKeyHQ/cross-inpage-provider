import React from 'react';
import dynamic from 'next/dynamic';
import PageLayout from '../../components/PageLayout';

const TronExample = dynamic(() => import('../../components/chains/tron/example'), {
  ssr: false,
});

export default function () {
  return (
    <PageLayout title={'Tron Dapp Example'}>
      <TronExample />
    </PageLayout>
  );
}
