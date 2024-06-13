/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unused-vars */
import React from 'react';
import dynamic from 'next/dynamic';
import styles from '../../styles/Home.module.css';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button } from '../../components/ui/button';
import PageLayout from '../../components/PageLayout';

// injected provider works only if nextjs ssr disabled
const STCExample = dynamic(() => import('../../components/chains/starcoin/example'), {
  ssr: false,
});

// 添加具体的函数组件名
export default function DeepLinkTest() {
  const [uri, setUri] = useState('');
  const uriEncoded = useMemo(() => encodeURIComponent(uri), [uri]);

  // 仅在客户端渲染组件
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <PageLayout title="DeepLink Test">
      <a target="_blank" rel="noopener noreferrer" href="https://example.walletconnect.org">
        Get uri from WalletConnectExample →
      </a>
      <div className="mb-4">
        {/* 恢复使用 textarea 来输入和显示 URI */}
        <textarea
          className="p-2 border border-gray-300 rounded w-full"
          placeholder="Copy & Paste Wallet-Connect uri here"
          id="text-uri"
          value={uri}
          onChange={(e) => setUri(e.target.value.trim())}
          rows={5}
        />

        <div className="flex flex-row gap-4">
          <Button
            onClick={async () => {
              try {
                const text = await navigator.clipboard.readText();
                setUri(text || '');
              } catch (error) {
                console.error('Clipboard access error:', error);
                alert('Failed to access clipboard. Please ensure permissions are granted.');
              }
            }}
          >
            Paste
          </Button>
          <Button variant="outline" onClick={() => setUri('')}>
            Clear
          </Button>
        </div>
      </div>

      {uri && (
        <ul className="list-disc pl-5">
          {[
            {
              href: `https://app.onekey.so/wc/connect?uri=${uriEncoded}`,
              text: 'UniversalLink (full link)',
            },
            {
              href: 'https://app.onekey.so/account/0xA9b4d559A98ff47C83B74522b7986146538cD4dF',
              text: 'UniversalLink (account)',
            },
            { href: 'wc://', text: 'wc:// (empty link)' },
            { href: 'onekey-wallet://', text: 'onekey-wallet:// (empty link)' },
            { href: uri, text: 'wc: (full link)' },
            {
              href: `onekey-wallet:/wc?uri=${uriEncoded}`,
              text: 'onekey-wallet:/wc?uri= (full link)',
            },
            {
              href: `onekey-wallet://wc?uri=${uriEncoded}`,
              text: 'onekey-wallet://wc?uri= (full link)',
            },
            {
              href: `onekey-wallet:///wc?uri=${uriEncoded}`,
              text: 'onekey-wallet:///wc?uri= (full link)',
            },
            {
              href: `onekey-wallet:wc?uri=${uriEncoded}`,
              text: 'onekey-wallet:wc?uri= (full link)',
            },
            { href: `cryptowallet://wc?uri=${uriEncoded}`, text: 'cryptowallet (full link)' },
            { href: `tpoutside://wc?uri=${uriEncoded}`, text: 'tpoutside (full link)' },
            {
              href: `https://metamask.app.link/wc?uri=${uriEncoded}`,
              text: 'metamask (full link)',
            },
          ].map((link, index) => (
            <li key={index}>
              <a href={link.href} target="_blank" rel="noopener noreferrer">
                {link.text}
              </a>
            </li>
          ))}
        </ul>
      )}
    </PageLayout>
  );
}
