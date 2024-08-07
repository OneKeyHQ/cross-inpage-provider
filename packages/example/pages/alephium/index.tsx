/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import dynamic from 'next/dynamic';
import PageLayout from '../../components/PageLayout';

// injected provider works only if nextjs ssr disabled
const AlephiumExample = dynamic(() => import('../../components/chains/alephium/example'), { ssr: false });

export default function () {
  return (
    <PageLayout title={'Alephium Dapp Example'}>
      <AlephiumExample />
    </PageLayout>
  );
}
