// @ts-nocheck
/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unused-vars */
import React from 'react';
import dynamic from 'next/dynamic';
import styles from '../../styles/Home.module.css';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button, HStack, TextArea, Box } from 'native-base';

// injected provider works only if nextjs ssr disabled
const STCExample = dynamic(() => import('../../components/starcoin/STCExample'), { ssr: false });

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
          <TextArea
            my={4}
            placeholder={'Copy & Paste Wallet-Connect uri here'}
            id="text-uri"
            value={uri}
            rows={5}
            style={{ width: '100%' }}
            onChange={(e) => setUri(e.target.value?.trim())}
          />
          <HStack space={2}>
            <Button
              onPress={async () => {
                const text = await navigator.clipboard.readText();
                setUri(text || '');
              }}
            >
              Paste
            </Button>
            <Button variant={'outline'} onPress={() => setUri('')}>
              Clear
            </Button>
          </HStack>
        </Box>

        {uri ? (
          <ul>
            <li>
              <a href="https://app.onekey.so/account/aaaaa" target={'_blank'}>
                UniversalLink (TODO)
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
          </ul>
        ) : null}
      </div>
    </div>
  );
}
