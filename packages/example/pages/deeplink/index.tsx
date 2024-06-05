// @ts-nocheck
/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unused-vars */
import React from 'react';
import dynamic from 'next/dynamic';
import styles from '../../styles/Home.module.css';
import Link from 'next/link';
import { useMemo, useState } from 'react';

// injected provider works only if nextjs ssr disabled
const STCExample = dynamic(() => import('../../components/chains/starcoin/example'), { ssr: false });

export default function () {
  const [uri, setUri] = useState('');
  const uriEncoded = useMemo(() => encodeURIComponent(uri), [uri]);
  if (typeof window === 'undefined') {
    return null;
  }
  return (
    <div>
      <div className={styles.container}>
        <Link href={'/'}>← Back</Link>
        <h1>DeepLink Test</h1>

        <a target="WalletConnectExampleV1" href="https://example.walletconnect.org">
          Get uri from WalletConnectExample V1 →
        </a>
        <Box mb={4}>
          {/* <input
            my={4}
            placeholder={'Copy & Paste Wallet-Connect uri here'}
            id="text-uri"
            value={uri}
            rows={5}
            style={{ width: '100%' }}
            onChangeText={(text) => {
              text = text?.trim();
              setUri(text);
            }}
          /> */}
          <HStack space={2}>
            <button
              onClick={async () => {
                const text = await navigator.clipboard.readText();
                setUri(text || '');
              }}
            >
              Paste
            </button>
            <button variant={'outline'} onPress={() => setUri('')}>
              Clear
            </button>
          </HStack>
        </Box>

        {uri ? (
          <ul>
            <li>
              <a href={`https://app.onekey.so/wc/connect?uri=${uriEncoded}`} target={'_blank'}>
                UniversalLink (full link)
              </a>
            </li>
            <li>
              <a
                href="https://app.onekey.so/account/0xA9b4d559A98ff47C83B74522b7986146538cD4dF"
                target={'_blank'}
              >
                UniversalLink (account)
              </a>
            </li>
            <li>
              <a href="wc://">wc:// (empty link)</a>
            </li>
            <li>
              <a href="onekey-wallet://">onekey-wallet:// (empty link)</a>
            </li>
            <li>
              <a href={uri}>wc: (full link)</a>
            </li>
            <li>
              <a href={`onekey-wallet:/wc?uri=${uriEncoded}`}>onekey-wallet:/wc?uri= (full link)</a>
            </li>
            <li>
              <a href={`onekey-wallet://wc?uri=${uriEncoded}`}>
                onekey-wallet://wc?uri= (full link)
              </a>
            </li>
            <li>
              <a href={`onekey-wallet:///wc?uri=${uriEncoded}`}>
                onekey-wallet:///wc?uri= (full link)
              </a>
            </li>
            <li>
              <a href={`onekey-wallet:wc?uri=${uriEncoded}`}>onekey-wallet:wc?uri= (full link)</a>
            </li>
            <li>
              <a href={`cryptowallet://wc?uri=${uriEncoded}`}>cryptowallet (full link)</a>
            </li>
            <li>
              <a href={`tpoutside://wc?uri=${uriEncoded}`}>tpoutside (full link)</a>
            </li>
            <li>
              <a href={`https://metamask.app.link/wc?uri=${uriEncoded}`}>metamask (full link)</a>
            </li>
          </ul>
        ) : null}
      </div>
    </div>
  );
}
