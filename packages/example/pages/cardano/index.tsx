import React from 'react';
import dynamic from 'next/dynamic';
import styles from '../../styles/Home.module.css';
import Link from 'next/link';
import { LogsContainer } from '../../components/LogsContainer';

// injected provider works only if nextjs ssr disabled
const CardanoExample = dynamic(() => import('../../components/cardano/CardanoExample'), { ssr: false });

export default function () {
  return (
    <div>
      <div className={styles.container}>
        <Link href={'/'}>← Back</Link>
        <h2>Cardano Dapp Example</h2>
        <CardanoExample />
      </div>
      <LogsContainer />
    </div>
  );
}
