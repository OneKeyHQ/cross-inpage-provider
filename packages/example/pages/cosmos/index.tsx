import React from 'react';
import dynamic from 'next/dynamic';
import styles from '../../styles/Home.module.css';
import Link from 'next/link';
import { LogsContainer } from '../../components/LogsContainer';

// injected provider works only if nextjs ssr disabled
const CosmosExample = dynamic(() => import('../../components/cosmos/CosmosExample'), { ssr: false });

export default function () {
  // TODO <Layout />
  // TODO eslint fix: deps order, react close tag
  return (
    <div>
      <div className={styles.container}>
        <Link href={'/'}>← Back</Link>
        <h2>Cosmos Dapp Example</h2>
        <CosmosExample />
      </div>
      <LogsContainer />
    </div>
  );
}
