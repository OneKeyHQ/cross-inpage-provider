import { dapps } from './dapps.config';
import {
  Coin,
  JsonRpcProvider,
  SignableTransaction,
  SUI_TYPE_ARG,
  GetObjectDataResponse,
  getObjectId,
  MoveCallTransaction,
  LocalTxnDataSerializer,
  Base64DataBuffer,
} from '@mysten/sui.js';

const DEFAULT_GAS_BUDGET_FOR_PAY = 150;

const computeGasBudgetForPay = (coins: GetObjectDataResponse[], amount: string) => {
  const numInputCoins = Coin.selectCoinSetWithCombinedBalanceGreaterThanOrEqual(
    coins,
    BigInt(amount),
  );
  return DEFAULT_GAS_BUDGET_FOR_PAY * Math.max(2, Math.min(100, numInputCoins.length / 2));
};

export const buildTransfer = async (
  provider: JsonRpcProvider,
  sender: string,
  to: string,
  amount: string,
  argType?: string,
): Promise<SignableTransaction> => {
  const recipient = to;
  const isSuiTransfer = argType == null || argType === '';

  const typeArg = isSuiTransfer ? SUI_TYPE_ARG : argType;
  const readyCoins = await provider.getCoinBalancesOwnedByAddress(sender, typeArg);
  const totalBalance = Coin.totalBalance(readyCoins);
  const gasBudget = computeGasBudgetForPay(readyCoins, amount);

  let amountAndGasBudget = isSuiTransfer ? BigInt(amount) + BigInt(gasBudget) : BigInt(amount);
  if (amountAndGasBudget > totalBalance) {
    amountAndGasBudget = totalBalance;
  }

  const inputCoins = Coin.selectCoinSetWithCombinedBalanceGreaterThanOrEqual(
    readyCoins,
    amountAndGasBudget,
  ) as GetObjectDataResponse[];

  const selectCoinIds = inputCoins.map((object) => getObjectId(object));

  const txCommon = {
    inputCoins: selectCoinIds,
    recipients: [recipient],
    amounts: [parseInt(amount)],
    gasBudget,
  };

  let encodedTx: SignableTransaction;
  if (isSuiTransfer) {
    encodedTx = {
      kind: 'paySui',
      data: {
        ...txCommon,
      },
    };
  } else {
    // Get native coin objects
    const gasFeeCoins = await provider.selectCoinsWithBalanceGreaterThanOrEqual(
      sender,
      BigInt(gasBudget),
      SUI_TYPE_ARG,
    );

    const gasCoin = Coin.selectCoinWithBalanceGreaterThanOrEqual(gasFeeCoins, BigInt(gasBudget)) as
      | GetObjectDataResponse
      | undefined;

    if (!gasCoin) {
      console.log(`[error] gas coin not found`);
      return null;
    }

    encodedTx = {
      kind: 'pay',
      data: {
        ...txCommon,
        gasPayment: getObjectId(gasCoin),
      },
    };
  }

  return encodedTx;
};

export const buildTransferPay = async (
  provider: JsonRpcProvider,
  sender: string,
  to: string,
  amount: string,
): Promise<SignableTransaction> => {
  const recipient = to;

  const typeArg = SUI_TYPE_ARG;
  const readyCoins = await provider.getCoinBalancesOwnedByAddress(sender, typeArg);
  const totalBalance = Coin.totalBalance(readyCoins);
  const gasBudget = computeGasBudgetForPay(readyCoins, amount);

  let amountAndGasBudget = BigInt(amount) + BigInt(gasBudget);
  if (amountAndGasBudget > totalBalance) {
    amountAndGasBudget = totalBalance;
  }

  const inputCoins = Coin.selectCoinSetWithCombinedBalanceGreaterThanOrEqual(
    readyCoins,
    amountAndGasBudget,
  ) as GetObjectDataResponse[];

  const selectCoinIds = inputCoins.map((object) => getObjectId(object));

  return {
    kind: 'pay',
    data: {
      inputCoins: selectCoinIds,
      recipients: [recipient],
      amounts: [parseInt(amount)],
      gasBudget,
    },
  };
};

export const buildMoveCall = async (
  provider: JsonRpcProvider,
  sender: string,
): Promise<MoveCallTransaction> => {
  const gasBudget = 2000;

  // Get native coin objects
  const gasFeeCoins = await provider.selectCoinsWithBalanceGreaterThanOrEqual(
    sender,
    BigInt(gasBudget),
    SUI_TYPE_ARG,
  );

  const gasCoin = Coin.selectCoinWithBalanceGreaterThanOrEqual(gasFeeCoins, BigInt(gasBudget)) as
    | GetObjectDataResponse
    | undefined;

  if (!gasCoin) {
    console.log(`[error] gas coin not found`);
    return null;
  }

  return {
    packageObjectId: '0x0000000000000000000000000000000000000002',
    module: 'devnet_nft',
    function: 'mint',
    typeArguments: [],
    arguments: [
      'Example NFT',
      'An NFT created by Sui Wallet',
      'ipfs://QmZPWWy5Si54R3d26toaqRiqvCH7HkGdXkxwUgCm2oKKM2?filename=img-sq-01.png',
    ],
    gasPayment: getObjectId(gasCoin),
    gasBudget,
  };
};
