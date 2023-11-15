import React from 'react';
import dynamic from 'next/dynamic';
import PageLayout from '../../components/PageLayout';

const IFrameHostExample = dynamic(() => import('../../components/iframe/IFrameHostExample'), {
  ssr: false,
});

export default function () {
  return (
    <PageLayout title={'HOST'}>
      <IFrameHostExample />
    </PageLayout>
  );
}
