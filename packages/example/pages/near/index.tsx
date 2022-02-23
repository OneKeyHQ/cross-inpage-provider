import dynamic from 'next/dynamic';
import styles from '../../styles/Home.module.css';
import Link from 'next/link'

// near provider works only if nextjs ssr disabled
const NearExample = dynamic(() => import('../../components/near/NearExample'), { ssr: false });

export default function () {
  return (
    <div className={styles.container}>
      <Link href={'/'}>← Back</Link>
      <h3 className={styles.title}>Near Dapp Example</h3>
      <NearExample />
    </div>
  );
}
