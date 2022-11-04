import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { LogsContainer } from '../../components/LogsContainer';
import { DAppList } from '../../components/dappList/DAppList';
import styles from '../../styles/Home.module.css';

import { dapps } from './dapps.config';

const TronExample = dynamic(() => import('../../components/tron/TronExample'), {
  ssr: false,
});

export default function () {
  return (
    <div>
      <div className={styles.container}>
        <Link href={'/'}>← Back</Link>
        <h2>Tron Dapp Example</h2>
        <TronExample />
      </div>
      <LogsContainer />
      <DAppList dapps={dapps} />
    </div>
  );
}
