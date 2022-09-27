import React from 'react';
import dynamic from 'next/dynamic';
import styles from '../../styles/Home.module.css';

const IFrameExample = dynamic(() => import('../../components/iframe/IFrameExample'), {
  ssr: false,
});

export default function () {
  return (
    <div>
      <div className={styles.container}>
        <h2>FRAME</h2>
        <IFrameExample />
      </div>
    </div>
  );
}
