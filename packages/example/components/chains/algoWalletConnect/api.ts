/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import algosdk from 'algosdk';

export enum ChainType {
  MainNet = 'mainnet',
  TestNet = 'testnet',
}

const mainNetClient = new algosdk.Algodv2('', 'https://mainnet-api.algonode.cloud', '');
const testNetClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');

export function clientForChain(chain: ChainType): algosdk.Algodv2 {
  switch (chain) {
    case ChainType.MainNet:
      return mainNetClient;
    case ChainType.TestNet:
      return testNetClient;
    default:
      throw new Error(`Unknown chain type: ${chain as string}`);
  }
}

export async function apiGetTxnParams(chain: ChainType): Promise<algosdk.SuggestedParams> {
  const params = await clientForChain(chain).getTransactionParams().do();
  return params;
}

export async function apiSubmitTransactions(
  chain: ChainType,
  stxns: Uint8Array[],
): Promise<number> {
  const { txId } = await clientForChain(chain).sendRawTransaction(stxns).do();
  return await waitForTransaction(chain, txId as string);
}

async function waitForTransaction(chain: ChainType, txId: string): Promise<number> {
  const client = clientForChain(chain);

  let lastStatus = await client.status().do();
  let lastRound = lastStatus['last-round'] as number;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const status = await client.pendingTransactionInformation(txId).do();
    if (status['pool-error']) {
      throw new Error(`Transaction Pool Error: ${status['pool-error'] as string}`);
    }
    if (status['confirmed-round']) {
      return status['confirmed-round'] as number;
    }
    lastStatus = await client.statusAfterBlock(lastRound + 1).do();
    lastRound = lastStatus['last-round'];
  }
}
