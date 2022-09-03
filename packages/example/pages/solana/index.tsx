import React from 'react';
import dynamic from 'next/dynamic';
import styles from '../../styles/Home.module.css';
import Link from 'next/link';
import { LogsContainer } from '../../components/LogsContainer';

const SolanaExample = dynamic(() => import('../../components/solana/SolanaExample'), {
  ssr: false,
});

export default function () {
  return (
    <div>
      <div className={styles.container}>
        <Link href={'/'}>← Back</Link>
        <h2>Solana Dapp Example</h2>
        <SolanaExample />
      </div>
      <LogsContainer />
    </div>
  );
}
