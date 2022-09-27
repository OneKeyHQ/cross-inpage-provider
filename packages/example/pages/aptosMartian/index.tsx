import React from 'react';
import dynamic from 'next/dynamic';
import styles from '../../styles/Home.module.css';
import Link from 'next/link';
import { LogsContainer } from '../../components/LogsContainer';

// injected provider works only if nextjs ssr disabled
const AptosExample = dynamic(() => import('../../components/aptosMartian/AptosExample'), { ssr: false });

export default function () {
  // TODO <Layout />
  // TODO eslint fix: deps order, react close tag
  return (
    <div>
      <div className={styles.container}>
        <Link href={'/'}>← Back</Link>
        <h2>Aptos Martian Dapp Example</h2>
        <AptosExample />
      </div>
      <LogsContainer />
    </div>
  );
}
