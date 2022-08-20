import type { NextPage } from 'next';
import Head from 'next/head';
// import Image from 'next/image';
import Link from 'next/link';
import styles from '../styles/Home.module.css';
import packageJson from '../package.json';
import { useEffect } from 'react';

// const myImageLoader = ({ src, width, quality }: any) => {
//   return src as string;
// };

const Home: NextPage = () => {
  useEffect(() => {
    void fetch(`/api/hello?_=${Date.now()}`);
  }, []);
  return (
    <div className={styles.container}>
      <Head>
        <title>Dapp Example - OneKey</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <Link href="/iframe">iframe →</Link>
        <Link href="/ethereum">EVM →</Link>
        <Link href="/solana">Solana →</Link>
        <Link href="/near">NEAR →</Link>
        <a target="_blank" href="https://dapp-near-ref-ui.onekeytest.com">
          NEAR ref-ui →
        </a>
        <Link href="/starcoin">Starcoin →</Link>
        <a target="_blank" href="https://example.walletconnect.org">
          WalletConnect V1 →
        </a>
        <a target="_blank" href="https://react-app.walletconnect.com">
          WalletConnect V2 →
        </a>
        <a>
          Hardware SDK (coming soon)
        </a>
        <button onClick={() => window.location.reload()}>refresh</button>
      </main>

      <footer className={styles.footer}>
        <a>
          {/* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */}
          v{packageJson.version}
        </a>
        <iframe
          src="https://ghbtns.com/github-btn.html?user=OneKeyHQ&repo=cross-inpage-provider&type=star&count=true"
          frameBorder="0"
          scrolling="0"
          title="GitHub"
          height={20}
          width={100}
        />
        <a href="https://www.onekey.so" target="_blank" rel="noopener noreferrer">
          Powered by OneKey →
        </a>
      </footer>
    </div>
  );
};

export default Home;
