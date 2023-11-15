/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import dynamic from 'next/dynamic';
import PageLayout from '../../components/PageLayout';

// injected provider works only if nextjs ssr disabled
const SuiExample = dynamic(() => import('../../components/suiStandard/SuiExample'), { ssr: false });

export default function () {
  return (
    <PageLayout title={'Sui Standard Dapp Example'}>
      <SuiExample />
    </PageLayout>
  );
}
