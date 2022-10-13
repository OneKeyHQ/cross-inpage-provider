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
            onChangeText={(text) => {
              text = text?.trim();
              setUri(text);
            }}
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
              <a href={`https://app.onekey.so/wc/connect?uri=${uriEncoded}`} target={'_blank'}>
                UniversalLink (wc uri)
              </a>
            </li>
            <li>
              <a
                href={
                  'cryptowallet://wc?uri=wc%3A9886b1ba-53f3-4763-9d33-b984b154d366%401%3Fbridge%3Dhttps%253A%252F%252Ff.bridge.walletconnect.org%26key%3Da213225afeabf93665a8780622c0eb4effd4f51ebe35e15f6dd71bfa8edd158e'
                }
              >
                cryptowallet (wc uri)
              </a>
            </li>
            <li>
              <a
                href={
                  'https://metamask.app.link/wc?uri=wc%3Ac1f8b4e9-1cfb-4b44-a555-823634f446ee%401%3Fbridge%3Dhttps%253A%252F%252Fj.bridge.walletconnect.org%26key%3D41c1c41844199b766916134e31c0ea60d341343b6f7d309e539e0e222ffed164'
                }
              >
                metamask (wc uri)
              </a>
            </li>
            <li>
              <a
                href={
                  'tpoutside://wc?uri=wc%3Ac1f8b4e9-1cfb-4b44-a555-823634f446ee%401%3Fbridge%3Dhttps%253A%252F%252Fj.bridge.walletconnect.org%26key%3D41c1c41844199b766916134e31c0ea60d341343b6f7d309e539e0e222ffed164'
                }
              >
                tpoutside (wc uri)
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
          </ul>
        ) : null}
      </div>
    </div>
  );
}
