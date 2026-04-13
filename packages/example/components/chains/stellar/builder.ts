/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import * as StellarSdk from '@stellar/stellar-base';

const MAINNET_PASSPHRASE = 'Public Global Stellar Network ; September 2015';
const MAINNET_HORIZON = 'https://horizon.stellar.org';
const TESTNET_HORIZON = 'https://horizon-testnet.stellar.org';

const TX_TIMEOUT_SECONDS = 300;

export function getHorizonUrl(networkPassphrase: string): string {
  return networkPassphrase === MAINNET_PASSPHRASE ? MAINNET_HORIZON : TESTNET_HORIZON;
}

/**
 * Fetch current account sequence from Horizon.
 * Must be called right before building a transaction so the seqNum is fresh.
 */
export async function fetchAccountSequence(
  horizonUrl: string,
  address: string,
): Promise<string> {
  const res = await fetch(`${horizonUrl}/accounts/${address}`);
  if (!res.ok) {
    throw new Error(`获取账户序列号失败 (${res.status}): 请确认账户已在链上激活`);
  }
  const data = (await res.json()) as { sequence?: string };
  if (!data?.sequence) {
    throw new Error('Horizon 返回数据缺少 sequence 字段');
  }
  return data.sequence;
}

export interface BuildTransactionParams {
  sourceAddress: string;
  destinationAddress: string;
  amount: string;
  networkPassphrase: string;
  sequence: string;
}

export interface BuildPaymentTransactionParams extends BuildTransactionParams {
  memo?: string;
}

/**
 * Build a simple payment transaction
 */
export function buildPaymentTransaction(params: BuildPaymentTransactionParams): string {
  const { sourceAddress, destinationAddress, amount, networkPassphrase, memo, sequence } = params;

  const sourceKeypair = StellarSdk.Keypair.fromPublicKey(sourceAddress);
  const account = new StellarSdk.Account(sourceKeypair.publicKey(), sequence);

  const transactionBuilder = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase,
  });

  transactionBuilder.addOperation(
    StellarSdk.Operation.payment({
      destination: destinationAddress,
      asset: StellarSdk.Asset.native(),
      amount: amount,
    }),
  );

  if (memo) {
    transactionBuilder.addMemo(StellarSdk.Memo.text(memo));
  }

  transactionBuilder.setTimeout(TX_TIMEOUT_SECONDS);

  // Build transaction
  const transaction = transactionBuilder.build();

  // Return XDR
  return transaction.toXDR();
}

/**
 * Build a trust asset transaction (for custom assets)
 */
export function buildTrustTransaction(params: {
  sourceAddress: string;
  assetCode: string;
  assetIssuer: string;
  networkPassphrase: string;
  sequence: string;
  limit?: string;
}): string {
  const { sourceAddress, assetCode, assetIssuer, networkPassphrase, limit, sequence } = params;

  const sourceKeypair = StellarSdk.Keypair.fromPublicKey(sourceAddress);
  const account = new StellarSdk.Account(sourceKeypair.publicKey(), sequence);

  const asset = new StellarSdk.Asset(assetCode, assetIssuer);

  const transactionBuilder = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase,
  });

  transactionBuilder.addOperation(
    StellarSdk.Operation.changeTrust({
      asset: asset,
      limit: limit,
    }),
  );

  transactionBuilder.setTimeout(TX_TIMEOUT_SECONDS);

  const transaction = transactionBuilder.build();
  return transaction.toXDR();
}

export interface BuildPathPaymentStrictSendParams {
  sourceAddress: string;
  destinationAddress: string;
  sendAssetCode: string;
  sendAssetIssuer: string;
  sendAmount: string;
  destAssetCode: string;
  destAssetIssuer: string;
  destMin: string;
  networkPassphrase: string;
  sequence: string;
}

export interface BuildPathPaymentStrictReceiveParams {
  sourceAddress: string;
  destinationAddress: string;
  sendAssetCode: string;
  sendAssetIssuer: string;
  sendMax: string;
  destAssetCode: string;
  destAssetIssuer: string;
  destAmount: string;
  networkPassphrase: string;
  sequence: string;
}

function resolveAsset(code: string, issuer: string): StellarSdk.Asset {
  if (code === 'XLM' && !issuer) {
    return StellarSdk.Asset.native();
  }
  return new StellarSdk.Asset(code, issuer);
}

/**
 * Build a Path Payment Strict Send transaction (swap - fixed send amount)
 */
export function buildPathPaymentStrictSendTransaction(params: BuildPathPaymentStrictSendParams): string {
  const {
    sourceAddress, destinationAddress, sendAssetCode, sendAssetIssuer,
    sendAmount, destAssetCode, destAssetIssuer, destMin, networkPassphrase, sequence,
  } = params;

  const sourceKeypair = StellarSdk.Keypair.fromPublicKey(sourceAddress);
  const account = new StellarSdk.Account(sourceKeypair.publicKey(), sequence);

  const sendAsset = resolveAsset(sendAssetCode, sendAssetIssuer);
  const destAsset = resolveAsset(destAssetCode, destAssetIssuer);

  const transactionBuilder = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase,
  });

  transactionBuilder.addOperation(
    StellarSdk.Operation.pathPaymentStrictSend({
      sendAsset,
      sendAmount,
      destination: destinationAddress,
      destAsset,
      destMin,
      path: [],
    }),
  );

  transactionBuilder.setTimeout(TX_TIMEOUT_SECONDS);
  const transaction = transactionBuilder.build();
  return transaction.toXDR();
}

/**
 * Build a Path Payment Strict Receive transaction (swap - fixed receive amount)
 */
export function buildPathPaymentStrictReceiveTransaction(params: BuildPathPaymentStrictReceiveParams): string {
  const {
    sourceAddress, destinationAddress, sendAssetCode, sendAssetIssuer,
    sendMax, destAssetCode, destAssetIssuer, destAmount, networkPassphrase, sequence,
  } = params;

  const sourceKeypair = StellarSdk.Keypair.fromPublicKey(sourceAddress);
  const account = new StellarSdk.Account(sourceKeypair.publicKey(), sequence);

  const sendAsset = resolveAsset(sendAssetCode, sendAssetIssuer);
  const destAsset = resolveAsset(destAssetCode, destAssetIssuer);

  const transactionBuilder = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase,
  });

  transactionBuilder.addOperation(
    StellarSdk.Operation.pathPaymentStrictReceive({
      sendAsset,
      sendMax,
      destination: destinationAddress,
      destAsset,
      destAmount,
      path: [],
    }),
  );

  transactionBuilder.setTimeout(TX_TIMEOUT_SECONDS);
  const transaction = transactionBuilder.build();
  return transaction.toXDR();
}

/**
 * Build a create account transaction
 */
export function buildCreateAccountTransaction(params: {
  sourceAddress: string;
  destinationAddress: string;
  startingBalance: string;
  networkPassphrase: string;
  sequence: string;
}): string {
  const { sourceAddress, destinationAddress, startingBalance, networkPassphrase, sequence } = params;

  const sourceKeypair = StellarSdk.Keypair.fromPublicKey(sourceAddress);
  const account = new StellarSdk.Account(sourceKeypair.publicKey(), sequence);

  const transactionBuilder = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase,
  });

  transactionBuilder.addOperation(
    StellarSdk.Operation.createAccount({
      destination: destinationAddress,
      startingBalance: startingBalance,
    }),
  );

  transactionBuilder.setTimeout(TX_TIMEOUT_SECONDS);

  const transaction = transactionBuilder.build();
  return transaction.toXDR();
}
