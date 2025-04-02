/* eslint-disable @typescript-eslint/no-explicit-any */
import { IInpageProviderConfig } from '@onekeyfe/cross-inpage-provider-core';
import { getOrCreateExtInjectedJsBridge } from '@onekeyfe/extension-bridge-injected';
import type { Types, MaybeHexString } from 'aptos';
import { TxnPayload, TxnOptions } from './types';
import type * as TypeUtils from './type-utils';
import { AptosProviderType, ProviderAptos } from './OnekeyAptosProvider';
import { web3Errors } from '@onekeyfe/cross-inpage-provider-errors';
import { get } from 'lodash';
import { serializeTransactionPayload } from './serializer';

type AnyNumber = bigint | number;

export type AptosRequestMartian = {
  'martianSignAndSubmitTransaction': (transactions: string) => Promise<string>;

  'martianSignTransaction': (transactions: string) => Promise<string>;

  'signAndSubmitTransaction': (transactions: Types.TransactionPayload) => Promise<string>;

  'signTransaction': (transactions: Types.TransactionPayload) => Promise<string>;

  'signGenericTransaction': (transaction: {
    func: string;
    args: any[];
    type_args: any[];
  }) => Promise<string>;

  'createCollection': (
    name: string,
    description: string,
    uri: string,
    maxAmount: string,
  ) => Promise<string>;

  'createToken': (
    collectionName: string,
    name: string,
    description: string,
    supply: number,
    uri: string,
    max: string,
    royalty_payee_address: string,
    royalty_points_denominator: number,
    royalty_points_numerator: number,
    property_keys: Array<string>,
    property_values: Array<string>,
    property_types: Array<string>,
  ) => Promise<string>;

  // RPC proxy
  'generateTransaction': (
    sender: string,
    payload: TxnPayload,
    options?: TxnOptions,
  ) => Promise<string>;

  'submitTransaction': (transaction: string) => Promise<string>;

  'getTransactions': (query?: { start?: string; limit?: number }) => Promise<Types.Transaction[]>;

  'getTransaction': (txnHash: string) => Promise<Types.Transaction>;

  'getAccountTransactions': (
    accountAddress: string,
    query?: { start?: string; limit?: number },
  ) => Promise<Types.Transaction[]>;

  'getAccountResources': (
    accountAddress: string,
    query?: { ledgerVersion?: string },
  ) => Promise<Types.MoveResource[]>;

  'getAccount': (accountAddress: string) => Promise<Types.AccountData>;

  'getChainId': () => Promise<{ chainId: number }>;

  'getLedgerInfo': () => Promise<Types.IndexResponse>;
};

type JsBridgeRequest = {
  [K in keyof AptosRequestMartian]: (
    params: Parameters<AptosRequestMartian[K]>[0],
  ) => Promise<
    TypeUtils.WireStringified<TypeUtils.ResolvePromise<ReturnType<AptosRequestMartian[K]>>>
  >;
};

type JsBridgeRequestParams<T extends keyof JsBridgeRequest> = Parameters<JsBridgeRequest[T]>[0];

type JsBridgeRequestResponse<T extends keyof JsBridgeRequest> = ReturnType<JsBridgeRequest[T]>;

type OneKeyAptosProviderProps = IInpageProviderConfig & {
  timeout?: number;
};

class ProviderAptosMartian extends ProviderAptos {
  public readonly isMartian = true;

  get publicKey() {
    return this._state.account?.publicKey ?? null;
  }

  constructor(props: OneKeyAptosProviderProps) {
    super({
      ...props,
      bridge: props.bridge || getOrCreateExtInjectedJsBridge({ timeout: props.timeout }),
    });

    window.dispatchEvent(new Event('martian#initialized'));
  }

  private _callMartianBridge<T extends keyof JsBridgeRequest>(params: {
    method: T;
    params: JsBridgeRequestParams<T>;
    aptosProviderType?: AptosProviderType;
  }): JsBridgeRequestResponse<T> {
    params.aptosProviderType = this.aptosProviderType;
    return this.bridgeRequest(params) as JsBridgeRequestResponse<T>;
  }

  hasStandardV2SignAndSubmitTransaction(transaction: string | Types.TransactionPayload): boolean {
    if (typeof transaction === 'object' && 'payload' in transaction && !('type' in transaction)) {
      return true;
    }
    return false;
  }

  async signAndSubmitTransaction(
    transaction: string | Types.TransactionPayload,
  ): Promise<string | Types.Transaction> {
    if (typeof transaction === 'string') {
      return await this._callMartianBridge({
        method: 'martianSignAndSubmitTransaction',
        params: transaction,
      });
    } else {
      if (this.hasStandardV2SignAndSubmitTransaction(transaction)) {
        // @ts-expect-error
        return await this.signAndSubmitTransactionV2(transaction);
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return super.signAndSubmitTransaction(transaction);
    }
  }

  hasStandardV2SignTransaction(transaction: string | Types.TransactionPayload): boolean {
    if (
      typeof transaction === 'object' &&
      'bcsToHex' in transaction &&
      'rawTransaction' in transaction
    ) {
      return true;
    }
    return false;
  }

  async signTransaction(
    transaction: string | Types.TransactionPayload,
    // V2 sign transaction as fee payer
    asFeePayer?: boolean,
  ): Promise<string | Uint8Array> {
    if (typeof transaction === 'string') {
      return this._callMartianBridge({
        method: 'martianSignTransaction',
        params: transaction,
      });
    } else {
      // aptos standard wallet v2
      // adapter @aptos-labs/wallet-adapter-core 3.x
      if (this.hasStandardV2SignTransaction(transaction)) {
        let transactionType: 'simple' | 'multi_agent';
        if (get(transaction, 'rawTransaction.secondarySignerAddresses')) {
          transactionType = 'multi_agent';
        } else {
          transactionType = 'simple';
        }

        // @ts-expect-error
        return this.signTransactionV2({
          // @ts-expect-error
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
          transaction: transaction.bcsToHex().toStringWithoutPrefix(),
          transactionType,
          asFeePayer,
        });
      } else {
        // aptos V1 sign transaction
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return super.signTransaction(transaction);
      }
    }
  }

  async signGenericTransaction(transaction: {
    func: string;
    args: any[];
    type_args: any[];
  }): Promise<string> {
    return this._callMartianBridge({
      method: 'signGenericTransaction',
      params: {
        func: transaction.func,
        args: transaction.args,
        type_args: transaction.type_args,
      },
    });
  }

  async generateSignAndSubmitTransaction(
    sender: string,
    payload: TxnPayload,
    options?: TxnOptions,
  ): Promise<string> {
    const txn = await this.generateTransaction(sender, payload, options);
    const txnHash = await this.signAndSubmitTransaction(txn);
    return txnHash as string;
  }

  async createCollection(name: string, description: string, uri: string): Promise<string> {
    return this._callMartianBridge({
      method: 'createCollection',
      // @ts-expect-error
      params: {
        name,
        description,
        uri,
      },
    });
  }

  async createToken(
    collectionName: string,
    name: string,
    description: string,
    supply: number,
    uri: string,
    max?: number | bigint,
    royalty_payee_address?: string,
    royalty_points_denominator?: number,
    royalty_points_numerator?: number,
    property_keys?: Array<string>,
    property_values?: Array<string>,
    property_types?: Array<string>,
  ): Promise<string> {
    return this._callMartianBridge({
      method: 'createToken',
      // @ts-expect-error
      params: {
        collectionName,
        name,
        description,
        supply,
        uri,
        max,
        royalty_payee_address,
        royalty_points_denominator,
        royalty_points_numerator,
        property_keys,
        property_values,
        property_types,
      },
    });
  }

  // rpc
  async generateTransaction(
    sender: string,
    payload: TxnPayload,
    options?: TxnOptions,
  ): Promise<string> {
    return this._callMartianBridge({
      method: 'generateTransaction',
      // @ts-expect-error
      params: {
        sender,
        payload,
        options,
      },
    });
  }

  private _convertStringToUint8Array(array: string): Uint8Array {
    return new Uint8Array(array.split(',').map((item) => parseInt(item, 10)));
  }

  private _convertMaybeHexStringTostring(hexString: MaybeHexString): string {
    if (typeof hexString === 'string') {
      return hexString;
    } else {
      return hexString.toString();
    }
  }

  private _convertAnyNumberToString(number: AnyNumber): string {
    if (typeof number === 'string') {
      return number;
    } else {
      return number.toString();
    }
  }

  async submitTransaction(transaction: Uint8Array | string): Promise<string> {
    const txraw =
      typeof transaction === 'string' ? this._convertStringToUint8Array(transaction) : transaction;
    return this._callMartianBridge({
      method: 'submitTransaction',
      params: Buffer.from(txraw).toString('hex'),
    });
  }

  async getTransactions(query?: {
    start?: AnyNumber;
    limit?: number;
  }): Promise<Types.Transaction[]> {
    return this._callMartianBridge({
      method: 'getTransactions',
      params: {
        ...query,
        start: query?.start ? this._convertAnyNumberToString(query.start) : undefined,
      },
    });
  }

  async getTransaction(txnHash: string): Promise<Types.Transaction> {
    return this._callMartianBridge({
      method: 'getTransaction',
      params: txnHash,
    });
  }

  async getAccountTransactions(
    accountAddress: MaybeHexString,
    query?: { start?: AnyNumber; limit?: number },
  ): Promise<Types.Transaction[]> {
    return this._callMartianBridge({
      method: 'getAccountTransactions',
      // @ts-expect-error
      params: {
        accountAddress: this._convertMaybeHexStringTostring(accountAddress),
        query: {
          ...query,
          start: query?.start ? this._convertAnyNumberToString(query.start) : undefined,
        },
      },
    });
  }

  async getAccountResources(
    accountAddress: MaybeHexString,
    query?: { ledgerVersion?: AnyNumber },
  ): Promise<Types.MoveResource[]> {
    return this._callMartianBridge({
      method: 'getAccountResources',
      // @ts-expect-error
      params: {
        accountAddress: this._convertMaybeHexStringTostring(accountAddress),
        query: {
          ...query,
          ledgerVersion: query?.ledgerVersion
            ? this._convertAnyNumberToString(query.ledgerVersion)
            : undefined,
        },
      },
    });
  }

  async getAccount(accountAddress: MaybeHexString): Promise<Types.AccountData> {
    return this._callMartianBridge({
      method: 'getAccount',
      params: this._convertMaybeHexStringTostring(accountAddress),
    });
  }

  async getChainId(): Promise<{ chainId: number }> {
    return this._callMartianBridge({
      method: 'getChainId',
      params: undefined,
    });
  }

  async getLedgerInfo(): Promise<Types.IndexResponse> {
    return this._callMartianBridge({
      method: 'getLedgerInfo',
      params: undefined,
    });
  }
}

export { ProviderAptosMartian };
