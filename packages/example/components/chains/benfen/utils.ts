// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { BenfenObjectRef, BenfenClient } from '@benfen/bfc.js/client';
import {
  GAS_SAFE_OVERHEAD,
  DEFAULT_GAS_PRICE,
  TransactionBlock,
} from '@benfen/bfc.js/transactions';
import {
  bfc2HexAddress,
  BFC_DECIMALS,
  MIST_PER_BFC,
  normalizeStructTag,
  parseStructTag,
} from '@benfen/bfc.js/utils';

export const normalizeStructTagForRpc = (address: string) => {
  const tag = parseStructTag(address);
  tag.address = bfc2HexAddress(tag.address);
  return normalizeStructTag(tag);
};

export async function sponsorTransaction(
  client: BenfenClient,
  sender: string,
  transactionKindBytes: Uint8Array,
) {
  let payment: BenfenObjectRef[] = [];

  const coins = await client.getCoins({ owner: sender, limit: 1 });
  if (coins.data.length > 0) {
    payment = coins.data.map((coin) => ({
      objectId: coin.coinObjectId,
      version: coin.version,
      digest: coin.digest,
    }));
  }

  const tx = TransactionBlock.fromKind(transactionKindBytes);
  tx.setSender(sender);
  tx.setGasOwner(sender);
  tx.setGasPayment(payment);

  return tx;
}

export const TOKEN_INFO = {
  BFC: {
    address: 'BFC000000000000000000000000000000000000000000000000000000000000000268e4::bfc::BFC',
    decimals: 9,
    symbol: 'BFC',
    logoURI: 'https://obstatic.243096.com/mili/images/currency/chain/Benfen2.png',
  },
  BUSD: {
    address: 'BFC00000000000000000000000000000000000000000000000000000000000000c8e30a::busd::BUSD',
    decimals: 9,
    symbol: 'BUSD',
    logoURI:
      'https://obstatic.243096.com/download/token/images/BenfenTEST/BFC00000000000000000000000000000000000000000000000000000000000000c8e30a::busd::BUSD.png',
  },
};

export const computeTxBudget = async (
  tx: TransactionBlock,
  gasBalance: bigint,
  gasToken: (typeof TOKEN_INFO)['BFC'],
  client: BenfenClient,
  reserveAmount = BigInt(0),
) => {
  const MAX_BFC_BUDGET = BigInt(50000000000);
  let overhead = GAS_SAFE_OVERHEAD * DEFAULT_GAS_PRICE;

  if (gasToken.address === TOKEN_INFO.BFC.address) {
    const availableForGas = gasBalance - reserveAmount;
    tx.setGasBudget(availableForGas < MAX_BFC_BUDGET ? availableForGas : MAX_BFC_BUDGET);
  } else {
    const rate = BigInt(await client.getStableRate(normalizeStructTagForRpc(gasToken.address)));
    const max = (((MAX_BFC_BUDGET * MIST_PER_BFC) / rate) * BigInt(9)) / BigInt(10); // 10% overhead
    overhead = (overhead * MIST_PER_BFC) / rate;
    const availableForGas = gasBalance - reserveAmount;
    tx.setGasBudget(availableForGas < max ? availableForGas : max);
  }
  const result = await client.dryRunTransactionBlock({
    transactionBlock: await tx.build({ client }),
  });
  if (result.effects.status.status !== 'success') {
    throw new Error(result.effects.status.error || 'Unknown error');
  }
  const gasUsed = result.effects.gasUsed;
  const budget = BigInt(gasUsed.computationCost) + BigInt(gasUsed.storageCost) + overhead;
  tx.setGasBudget(budget < gasBalance ? budget : gasBalance);
};
