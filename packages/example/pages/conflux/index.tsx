import React from 'react';
import dynamic from 'next/dynamic';
import styles from '../../styles/Home.module.css';
import Link from 'next/link';
import { LogsContainer } from '../../components/LogsContainer';
import { DAppList } from '../../components/dappList/DAppList';
import { dapps } from './dapps.config';

const ConfluxExample = dynamic(() => import('../../components/conflux/ConfluxExample'), {
  ssr: false,
});

export default function () {
  return (
    <div>
      <div className={styles.container}>
        <Link href={'/'}>← Back</Link>
        <h2>Conflux Dapp Example</h2>
        <ConfluxExample />
      </div>
      <LogsContainer />
      <DAppList dapps={dapps} />
    </div>
  );
}
