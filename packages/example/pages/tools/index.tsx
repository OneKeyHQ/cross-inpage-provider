import React from 'react';
import dynamic from 'next/dynamic';
import PageLayout from '../../components/PageLayout';

const Example = dynamic(() => import('../../components/chains/tools/example'), {
  ssr: false,
});

export default function () {
  return (
    <PageLayout title={'Tools Example'}>
      <Example />
    </PageLayout>
  );
}
