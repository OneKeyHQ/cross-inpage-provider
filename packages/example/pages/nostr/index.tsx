import React from 'react';
import dynamic from 'next/dynamic';
import PageLayout from '../../components/PageLayout';

// injected provider works only if nextjs ssr disabled
const EVMExample = dynamic(() => import('../../components/chains/nostr/example'), {
  ssr: false,
});

export default function () {
  return (
    <PageLayout title={'Nostr DApp Example'}>
      <EVMExample />
    </PageLayout>
  );
}
