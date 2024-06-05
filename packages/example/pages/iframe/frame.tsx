import React from 'react';
import dynamic from 'next/dynamic';

const IFrameExample = dynamic(() => import('../../components/chains/iframe/IFrameExample'), {
  ssr: false,
});

export default function () {
  return (
    <div>
      <div className="p-2">
        <h2 className="font-medium">IFrame</h2>
        <IFrameExample />
      </div>
    </div>
  );
}
