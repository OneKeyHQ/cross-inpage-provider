import dynamic from 'next/dynamic';
import styles from '../../styles/Home.module.css';
import Link from 'next/link';
import { LogsContainer } from '../../components/LogsContainer';

// injected provider works only if nextjs ssr disabled
const NearExample = dynamic(() => import('../../components/near/NearExample'), { ssr: false });

export default function () {
  // TODO <Layout />
  // TODO eslint fix: deps order, react close tag
  return (
    <div>
      <div className={styles.container}>
        <Link href={'/'}>← Back</Link>
        <h2>Near Dapp Example</h2>
        <NearExample />
      </div>
      <LogsContainer />
    </div>
  );
}
