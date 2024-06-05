import React from 'react';
import dynamic from 'next/dynamic';

const Example = dynamic(() => import('../../components/chains/multichain/example'), {
  ssr: false,
});

export default function () {
  return <Example />;
}
