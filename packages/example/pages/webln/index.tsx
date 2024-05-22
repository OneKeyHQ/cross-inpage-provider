import React from 'react';
import dynamic from 'next/dynamic';
import PageLayout from '../../components/PageLayout';

// injected provider works only if nextjs ssr disabled
const EVMExample = dynamic(() => import('../../components/chains/webln/example'), {
  ssr: false,
});

export default function () {
  return (
    <PageLayout title={'WebLN Lightning Network DApp Example'}>
      <EVMExample />
    </PageLayout>
  );
}
