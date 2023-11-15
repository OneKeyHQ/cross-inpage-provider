import Link from 'next/link';
import styles from '../styles/PageLayout.module.css';
import { LogsContainer } from './LogsContainer';

export type PageLayoutProps = {
  children?: React.ReactNode;
  title: string;
};

function PageLayout({ children, title }: PageLayoutProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href={'/'} className={styles.backButton}>
          ← Back
        </Link>
        <h3 className={styles.title}>{title}</h3>
      </div>
      <div className={styles.childrenContainer}>{children}</div>
      <div className={styles.logsContainer}>
        <LogsContainer />
      </div>
    </div>
  );
}

export default PageLayout;
