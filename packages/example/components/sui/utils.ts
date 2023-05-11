import { dapps } from './dapps.config';
import {
  JsonRpcProvider,
  SUI_TYPE_ARG,
  TransactionBlock,
  SuiAddress,
  CoinStruct,
  PaginatedCoins,
} from '@mysten/sui.js';

const MAX_COINS_PER_REQUEST = 50;

export const getAllCoins = async(
  provider: JsonRpcProvider,
  address: SuiAddress,
  coinType: string | null,
): Promise<CoinStruct[]> => {
  let cursor: string | null = null;
  const allData: CoinStruct[] = [];
  do {

    const { data, nextCursor }: PaginatedCoins = await provider.getCoins({
      owner: address,
      coinType,
      cursor,
      limit: MAX_COINS_PER_REQUEST,
    });

    if (!data || !data.length) {
      break;
    }


    allData.push(...data);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    cursor = nextCursor;
  } while (cursor);

  return allData;
}

export const buildTransfer = async (
  provider: JsonRpcProvider,
  sender: string,
  to: string,
  amount: string,
  argType?: string,
): Promise<TransactionBlock> => {
  const recipient = to;
  const isSuiTransfer = argType == null || argType === '';

  const typeArg = isSuiTransfer ? SUI_TYPE_ARG : argType;

  const coinsData = await getAllCoins(provider, sender, typeArg);

  const coins = coinsData?.filter(({ lockedUntilEpoch: lock }) => !lock);

  const tx = new TransactionBlock();

  const [primaryCoin, ...mergeCoins] = coins.filter(
    (coin) => coin.coinType === typeArg,
  );

  if (typeArg === SUI_TYPE_ARG) {
    const coin = tx.splitCoins(tx.gas, [tx.pure(amount)]);
    tx.transferObjects([coin], tx.pure(recipient));
  } else {
    const primaryCoinInput = tx.object(primaryCoin.coinObjectId);
    if (mergeCoins.length) {
      tx.mergeCoins(
        primaryCoinInput,
        mergeCoins.map((coin) => tx.object(coin.coinObjectId)),
      );
    }
    const coin = tx.splitCoins(primaryCoinInput, [tx.pure(amount)]);
    tx.transferObjects([coin], tx.pure(recipient));
  }
  return tx;
};
