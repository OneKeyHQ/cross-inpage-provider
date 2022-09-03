import React from 'react';
import dynamic from 'next/dynamic';
import styles from '../../styles/Home.module.css';
import { LogsContainer } from '../../components/LogsContainer';
import Link from 'next/link';

const IFrameHostExample = dynamic(() => import('../../components/iframe/IFrameHostExample'), {
  ssr: false,
});

export default function () {
  return (
    <div>
      <div className={styles.container}>
        <Link href={'/'}>← Back</Link>
        <h2>HOST</h2>
        <IFrameHostExample />
      </div>
      <LogsContainer />
    </div>
  );
}
