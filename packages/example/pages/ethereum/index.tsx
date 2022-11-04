import React from 'react';
import dynamic from 'next/dynamic';
import styles from '../../styles/Home.module.css';
import Link from 'next/link';
import { DAppList } from '../../components/dappList/DAppList';
import { dapps } from './dapps.config';

// injected provider works only if nextjs ssr disabled
const EVMExample = dynamic(() => import('../../components/ethereum/EVMExample'), { ssr: false });

export default function () {
  return (
    <div>
      <div className={styles.container}>
        <Link href={'/'}>← Back</Link>
        <EVMExample />
      </div>
      <DAppList dapps={dapps} />
    </div>
  );
}
