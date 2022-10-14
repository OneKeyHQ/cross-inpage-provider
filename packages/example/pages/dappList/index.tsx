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
  return (
    <div>
      <div className={styles.container}>
        <Link href={'/'}>← Back</Link>
        <h1>Dapp List</h1>

        <ul>
          {[
            ['1inch', 'https://app.1inch.io/'],
            ['aave', 'https://app.aave.com/'],
            ['compound', 'https://app.compound.finance/'],
            ['dydx', 'https://trade.dydx.exchange/'],
            ['gem', 'https://www.gem.xyz/'],
            ['indexcoop', 'https://app.indexcoop.com/'],
            ['magiceden', 'https://magiceden.io/'],
            ['oasis', 'https://oasis.app/'],
            ['opensea', 'https://opensea.io/'],
            ['pancake', 'https://pancakeswap.finance/'],
            ['rarible', 'https://rarible.com/'],
            ['sushi', 'https://www.sushi.com/swap'],
            ['synthetix', 'https://staking.synthetix.io/'],
            ['uniswap', 'https://app.uniswap.org/'],
            ['yearn', 'https://yearn.finance/'],
            ['zapper', 'https://zapper.fi/'],
            ['zerion', 'https://app.zerion.io/'],
          ].map(([name, href]) => {
            return (
              <li>
                <a href={href} target={'_blank'}>
                  {name} →
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
