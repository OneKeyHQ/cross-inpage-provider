/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import * as StellarSdk from '@stellar/stellar-base';

export interface BuildTransactionParams {
  sourceAddress: string;
  destinationAddress: string;
  amount: string;
  networkPassphrase: string;
}

export interface BuildPaymentTransactionParams extends BuildTransactionParams {
  memo?: string;
}

/**
 * Build a simple payment transaction
 */
export function buildPaymentTransaction(params: BuildPaymentTransactionParams): string {
  const { sourceAddress, destinationAddress, amount, networkPassphrase, memo } = params;

  // Create source account
  const sourceKeypair = StellarSdk.Keypair.fromPublicKey(sourceAddress);
  const account = new StellarSdk.Account(sourceKeypair.publicKey(), '0');

  // Build transaction
  const transactionBuilder = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase,
  });

  // Add payment operation
  transactionBuilder.addOperation(
    StellarSdk.Operation.payment({
      destination: destinationAddress,
      asset: StellarSdk.Asset.native(),
      amount: amount,
    }),
  );

  // Add memo if provided
  if (memo) {
    transactionBuilder.addMemo(StellarSdk.Memo.text(memo));
  }

  // Set timeout
  transactionBuilder.setTimeout(180);

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
  limit?: string;
}): string {
  const { sourceAddress, assetCode, assetIssuer, networkPassphrase, limit } = params;

  const sourceKeypair = StellarSdk.Keypair.fromPublicKey(sourceAddress);
  const account = new StellarSdk.Account(sourceKeypair.publicKey(), '0');

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

  transactionBuilder.setTimeout(180);

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
    sendAmount, destAssetCode, destAssetIssuer, destMin, networkPassphrase,
  } = params;

  const sourceKeypair = StellarSdk.Keypair.fromPublicKey(sourceAddress);
  const account = new StellarSdk.Account(sourceKeypair.publicKey(), '0');

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

  transactionBuilder.setTimeout(180);
  const transaction = transactionBuilder.build();
  return transaction.toXDR();
}

/**
 * Build a Path Payment Strict Receive transaction (swap - fixed receive amount)
 */
export function buildPathPaymentStrictReceiveTransaction(params: BuildPathPaymentStrictReceiveParams): string {
  const {
    sourceAddress, destinationAddress, sendAssetCode, sendAssetIssuer,
    sendMax, destAssetCode, destAssetIssuer, destAmount, networkPassphrase,
  } = params;

  const sourceKeypair = StellarSdk.Keypair.fromPublicKey(sourceAddress);
  const account = new StellarSdk.Account(sourceKeypair.publicKey(), '0');

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

  transactionBuilder.setTimeout(180);
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
}): string {
  const { sourceAddress, destinationAddress, startingBalance, networkPassphrase } = params;

  const sourceKeypair = StellarSdk.Keypair.fromPublicKey(sourceAddress);
  const account = new StellarSdk.Account(sourceKeypair.publicKey(), '0');

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

  transactionBuilder.setTimeout(180);

  const transaction = transactionBuilder.build();
  return transaction.toXDR();
}
