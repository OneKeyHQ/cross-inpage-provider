import React from 'react';
import dynamic from 'next/dynamic';
import PageLayout from '../../components/PageLayout';

const IFrameHostExample = dynamic(() => import('../../components/chains/iframe/IFrameHostExample'), {
  ssr: false,
});

export default function () {
  return (
    <PageLayout title={'Host 内置 IFrame'}>
      <IFrameHostExample />
    </PageLayout>
  );
}
