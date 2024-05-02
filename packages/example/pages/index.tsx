import React, { RefObject, useMemo, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
// import Image from 'next/image';
import Link from 'next/link';
import styles from '../styles/Home.module.css';
import packageJson from '../package.json';
import { useEffect } from 'react';
import { Button } from 'native-base';
import { Tree } from 'react-arborist';
import * as uuid from 'uuid';

// const myImageLoader = ({ src, width, quality }: any) => {
//   return src as string;
// };

type ITreeNodeInfo = {
  isLeaf: boolean;
  isOpen: boolean;
  isClosed: boolean;
  isInternal: boolean;
  data: ITreeNodeData;
  toggle: () => void;
};
type ITreeNodeData = {
  id: string;
  name: string;
  icon?: string;
  href?: string;
  target?: string;
  children?: ITreeNodeData[];
};
type ITreeNodeProps = {
  node: ITreeNodeInfo;
  style: unknown;
  dragHandle: RefObject<HTMLDivElement>;
};
function TreeNode({ node, style, dragHandle }: ITreeNodeProps) {
  const { href, target, name, icon } = node.data;
  const link = useMemo(() => {
    if (target && href) {
      return (
        <a href={href} target={target}>
          {`${name} →`}
        </a>
      );
    }
    if (href) {
      return <Link href={href}>{`${name} →`}</Link>;
    }
    return <span>{name}</span>;
  }, [href, name, target]);
  const imgIcon = useMemo(() => {
    if (icon) {
      return (
        <img alt={icon} src={icon} style={{ width: '14px', height: '14px', borderRadius: '50%' }} />
      );
    }
    if (node.isInternal) {
      if (node.isClosed) {
        return '📁';
      }
      return '📂';
    }
    return '👉';
  }, [icon, node.isClosed, node.isInternal]);
  return (
    <div style={style} ref={dragHandle} onClick={() => node.toggle()}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          cursor: node.isInternal ? 'pointer' : undefined,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            minWidth: '16px',
            marginRight: '8px',
          }}
        >
          {imgIcon}
        </div>
        {link}
      </div>
    </div>
  );
}

const data: ITreeNodeData[] = [
  {
    id: uuid.v4(),
    name: 'General',
    children: [
      { id: uuid.v4(), name: 'iframe', href: '/iframe' },
      { id: uuid.v4(), name: 'DeepLink', href: '/deeplink' },
      { id: uuid.v4(), name: 'DappList', href: '/dappList' },
      {
        id: uuid.v4(),
        name: 'Hardware SDK',
        href: 'https://hardware-example.onekeytest.com/',
      },
    ],
  },
  {
    id: uuid.v4(),
    name: 'WalletConnect',
    // icon: 'https://example.walletconnect.org/favicon.ico',
    children: [
      {
        id: uuid.v4(),
        name: 'WalletConnect V1',
        href: 'https://example.walletconnect.org',
        target: 'WalletConnectExampleV1',
        icon: 'https://example.walletconnect.org/favicon.ico',
      },
      {
        id: uuid.v4(),
        name: 'WalletConnect V2',
        href: 'https://react-app.walletconnect.com',
        target: 'WalletConnectExampleV2',
        icon: 'https://example.walletconnect.org/favicon.ico',
      },
      {
        id: uuid.v4(),
        name: 'Aptos WalletConnect',
        href: '/aptosWalletconnect',
        icon: 'https://uni.onekey-asset.com/static/chain/apt.png',
      },
      {
        id: uuid.v4(),
        name: 'Algo WalletConnect',
        href: '/algoWalletConnect',
        icon: 'https://uni.onekey-asset.com/static/chain/algo.png',
      },
    ],
  },
  {
    id: uuid.v4(),
    name: 'Networks',
    children: [
      {
        id: uuid.v4(),
        name: 'EVM',
        href: '/ethereum',
        icon: 'https://uni.onekey-asset.com/static/chain/eth.png',
      },
      {
        id: uuid.v4(),
        name: 'Solana',
        href: '/solana',
        icon: 'https://uni.onekey-asset.com/static/chain/sol.png',
      },
      {
        id: uuid.v4(),
        name: 'NEAR',
        href: '/near',
        icon: 'https://uni.onekey-asset.com/static/chain/near.png',
      },
      {
        id: uuid.v4(),
        name: 'NEAR ref-ui',
        href: 'https://dapp-near-ref-ui.onekeytest.com',
        target: '_blank',
        icon: 'https://uni.onekey-asset.com/static/chain/near.png',
      },
      {
        id: uuid.v4(),
        name: 'Starcoin',
        href: '/starcoin',
        icon: 'https://uni.onekey-asset.com/static/chain/stc.png',
      },
      {
        id: uuid.v4(),
        name: 'Aptos',
        href: '/aptos',
        icon: 'https://uni.onekey-asset.com/static/chain/apt.png',
      },{
        id: uuid.v4(),
        name: 'AptosWalletAdapter',
        href: 'https://aptos-labs.github.io/aptos-wallet-adapter/',
        icon: 'https://uni.onekey-asset.com/static/chain/apt.png',
      },
      {
        id: uuid.v4(),
        name: 'Aptos Martian',
        href: '/aptosMartian',
        icon: 'https://uni.onekey-asset.com/static/chain/apt.png',
      },
      {
        id: uuid.v4(),
        name: 'Conflux',
        href: '/conflux',
        icon: 'https://uni.onekey-asset.com/static/chain/cfx.png',
      },
      {
        id: uuid.v4(),
        name: 'Tron',
        href: '/tron',
        icon: 'https://uni.onekey-asset.com/static/chain/filled_trx.png',
      },
      {
        id: uuid.v4(),
        name: 'Sui Standard',
        href: '/suiStandard',
        icon: 'https://uni.onekey-asset.com/static/chain/sui.png',
      },
      {
        id: uuid.v4(),
        name: 'Cardano',
        href: '/cardano',
        icon: 'https://uni.onekey-asset.com/static/chain/ada.png',
      },
      {
        id: uuid.v4(),
        name: 'Cosmos',
        href: '/cosmos',
        icon: 'https://uni.onekey-asset.com/static/chain/cosmos.png',
      },
      {
        id: uuid.v4(),
        name: 'Polkadot',
        href: '/polkadot',
        icon: 'https://uni.onekey-asset.com/static/chain/polkadot.png',
      },
    ],
  },
];

const Home: NextPage = () => {
  useEffect(() => {
    void fetch(`/api/hello?_=${Date.now()}`);
  }, []);
  const [chainId, setChainId] = useState('');
  useEffect(() => {
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    global?.$onekey?.ethereum?.request({ method: 'net_version' }).then((res: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      setChainId(res);
    });
  }, []);
  return (
    <div className={styles.container}>
      <Head>
        <title>Dapp Example - OneKey</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <Button onPress={() => window.location.reload()}>Refresh</Button>
        <a>EVM-chainId={chainId}</a>
        <Tree height={900} initialData={data} rowHeight={38} indent={20}>
          {TreeNode as any}
        </Tree>
      </main>

      <footer className={styles.footer}>
        <a>
          {/* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */}v
          {packageJson.version}
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
