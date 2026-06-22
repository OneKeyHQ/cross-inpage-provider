// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

// @mysten/sui 2.x: types moved to /jsonRpc, SuiClient -> SuiJsonRpcClient
import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import { Transaction } from '@mysten/sui/transactions';
import type {
  SuiObjectRef,
  SuiJsonRpcClient as SuiClient,
} from '@mysten/sui/jsonRpc';
export async function sponsorTransaction(
  client: SuiClient,
  sender: string,
  transactionKindBytes: Uint8Array,
  coinType: string = SUI_TYPE_ARG,
) {
  let payment: SuiObjectRef[] = [];

  const coins = await client.getCoins({ owner: sender, limit: 1 });
  if (coins.data.length > 0) {
    payment = coins.data.map((coin) => ({
      objectId: coin.coinObjectId,
      version: coin.version,
      digest: coin.digest,
    }));
  }

  const tx = Transaction.fromKind(transactionKindBytes);
  tx.setSender(sender);
  tx.setGasOwner(sender);
  tx.setGasPayment(payment);

  return tx;
}
