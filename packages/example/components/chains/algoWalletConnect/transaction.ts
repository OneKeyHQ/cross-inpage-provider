import type { SignerTransaction, WalletTransaction, JsonRpcRequest } from './types';
import { apiGetTxnParams, ChainType } from './api';
import { isEmpty } from 'lodash';
import algosdk, { algosToMicroalgos, type Transaction } from 'algosdk';

const getPayloadId = (): number => {
    const date = Date.now() * Math.pow(10, 3)
    const extra = Math.floor(Math.random() * Math.pow(10, 3))
    return date + extra
  }

export const formatJsonRpcRequest = <T = any>(method: string, params: T): JsonRpcRequest => {
    return {
      id: getPayloadId(),
      jsonrpc: '2.0',
      method,
      params
    }
  }

export const base64ToUint8Array = (data: string) => {
return Uint8Array.from(window.atob(data), (value) => value.charCodeAt(0))
}

export const encodeUnsignedTransactionInBase64 = (txn: Transaction): string => {
  return Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString('base64');
};

export function composeTransaction(transaction: SignerTransaction, signerAddress?: string) {
  let signers: WalletTransaction['signers'];

  if (signerAddress && !(transaction.signers || []).includes(signerAddress)) {
    signers = [];
  }

  const txnRequestParams: WalletTransaction = {
    txn: encodeUnsignedTransactionInBase64(transaction.txn),
  };

  if (Array.isArray(signers)) {
    txnRequestParams.signers = signers;
  }

  if (transaction.authAddr) {
    txnRequestParams.authAddr = transaction.authAddr;
  }

  if (transaction.message) {
    txnRequestParams.message = transaction.message;
  }

  if (transaction.msig) {
    txnRequestParams.msig = transaction.msig;
  }

  return txnRequestParams;
}

export const getSignTxnRequestParams = (
  txns: SignerTransaction[] | SignerTransaction[][],
  signerAddress?: string,
) => {
  // If `txns` is a single array, convert it to an array of arrays
  if (!Array.isArray(txns[0])) {
    txns = [txns as SignerTransaction[]];
  }

  return (txns as SignerTransaction[][]).flatMap((txGroup) =>
    txGroup.map<WalletTransaction>((txGroupDetail) =>
      composeTransaction(txGroupDetail, signerAddress),
    ),
  );
};

export async function generateSinglePayTxn(
  chain: ChainType,
  fromAddress: string,
  toAddress: string,
  amount: number,
  note: string | undefined,
): Promise<SignerTransaction> {
  const suggestedParams = await apiGetTxnParams(chain);

  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: fromAddress,
    to: toAddress,
    amount: amount,
    note:
      !note || isEmpty(note) ? new Uint8Array() : new Uint8Array(Buffer.from(note)),
    suggestedParams,
  });

  return {
    txn,
    message: 'This is a payment transaction that sends Algos.',
  };
}

export async function generateSingleAssetTransferTxn(
    chain: ChainType,
    fromAddress: string,
    toAddress: string,
    assetIndex: string,
    amount: number,
    note: string | undefined,
  ): Promise<SignerTransaction> {
    const suggestedParams = await apiGetTxnParams(chain);

    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: fromAddress,
      to: toAddress,
      amount: amount,
      assetIndex: parseInt(assetIndex),
      note:
        !note || isEmpty(note) ? new Uint8Array() : new Uint8Array(Buffer.from(note)),
      suggestedParams,
    });

    return {
      txn,
      message: 'This transaction will send USDC.',
    };
  }

  function getAssetReserve(chain: ChainType): string {
    if (chain === ChainType.MainNet) {
      return '2UEQTE5QDNXPI7M3TU44G6SYKLFWLPQO7EBZM7K7MHMQQMFI4QJPLHQFHM';
    }

    if (chain === ChainType.TestNet) {
      return 'UJBZPEMXLD6KZOLUBUDSZ3DXECXYDADZZLBH6O7CMYXHE2PLTCW44VK5T4';
    }

    throw new Error(`Asset reserve not defined for chain ${chain as string}`);
  }

  export async function generateSingleAssetCloseTxn(
    chain: ChainType,
    fromAddress: string,
    toAddress: string,
    assetIndex: string,
    amount: number,
    note: string | undefined,
  ): Promise<SignerTransaction> {
    const suggestedParams = await apiGetTxnParams(chain);

    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: fromAddress,
      to: getAssetReserve(chain),
      amount: amount,
      assetIndex: parseInt(assetIndex),
      note:
        !note || isEmpty(note) ? new Uint8Array() : new Uint8Array(Buffer.from(note)),
      closeRemainderTo: toAddress,
      suggestedParams,
    });

    return {
      txn,
      message: 'This transaction will send USDC.',
    };
  }

  export async function generateSingleAppOptIn(
    chain: ChainType,
    fromAddress: string,
    appIndex: string,
    note: string | undefined,
    appArgs?: Uint8Array[] | undefined,
  ): Promise<SignerTransaction> {
    const suggestedParams = await apiGetTxnParams(chain);

    const txn = algosdk.makeApplicationOptInTxnFromObject({
        from: fromAddress,
        appIndex: parseInt(appIndex),
        note:
            !note || isEmpty(note) ? new Uint8Array() : new Uint8Array(Buffer.from(note)),
        appArgs: appArgs ?? [Uint8Array.from([0]), Uint8Array.from([0, 1])],
        suggestedParams,
      });

    return {
      txn,
      message: 'This transaction will send USDC.',
    };
  }

  export async function generateSingleAppCall(
    chain: ChainType,
    fromAddress: string,
    appIndex: string,
    note: string | undefined,
    appArgs?: Uint8Array[] | undefined,
  ): Promise<SignerTransaction> {
    const suggestedParams = await apiGetTxnParams(chain);

    const txn = algosdk.makeApplicationNoOpTxnFromObject({
        from: fromAddress,
        appIndex: parseInt(appIndex),
        note:
            !note || isEmpty(note) ? new Uint8Array() : new Uint8Array(Buffer.from(note)),
        appArgs: appArgs ?? [Uint8Array.from([0]), Uint8Array.from([0, 1])],
        suggestedParams,
      });

    return {
      txn,
      message: 'This transaction will send USDC.',
    };
  }

  export async function generateSingleAppCloseOut(
    chain: ChainType,
    fromAddress: string,
    appIndex: string,
    note: string | undefined,
    appArgs?: Uint8Array[] | undefined,
  ): Promise<SignerTransaction> {
    const suggestedParams = await apiGetTxnParams(chain);

    const txn = algosdk.makeApplicationCloseOutTxnFromObject({
        from: fromAddress,
        appIndex: parseInt(appIndex),
        note:
            !note || isEmpty(note) ? new Uint8Array() : new Uint8Array(Buffer.from(note)),
        appArgs: appArgs ?? [Uint8Array.from([0]), Uint8Array.from([0, 1])],
        suggestedParams,
      });

    return {
      txn,
      message: 'This transaction will send USDC.',
    };
  }

  export async function generateSingleAppClearState(
    chain: ChainType,
    fromAddress: string,
    appIndex: string,
    note: string | undefined,
    appArgs?: Uint8Array[] | undefined,
  ): Promise<SignerTransaction> {
    const suggestedParams = await apiGetTxnParams(chain);

    const txn = algosdk.makeApplicationClearStateTxnFromObject({
        from: fromAddress,
        appIndex: parseInt(appIndex),
        note:
            !note || isEmpty(note) ? new Uint8Array() : new Uint8Array(Buffer.from(note)),
        appArgs: appArgs ?? [Uint8Array.from([0]), Uint8Array.from([0, 1])],
        suggestedParams,
      });

    return {
      txn,
      message: 'This transaction will send USDC.',
    };
  }

