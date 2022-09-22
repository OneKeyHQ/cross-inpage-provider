import { IInpageProviderConfig } from '@onekeyfe/cross-inpage-provider-core';
import { getOrCreateExtInjectedJsBridge } from '../../../extension/extension-bridge-injected/dist';
import { AptosClient, BCS, Types, MaybeHexString } from 'aptos';
import { TxnPayload, TxnOptions } from './types';
import type * as TypeUtils from './type-utils';
import {  ProviderAptos } from './OnekeyAptosProvider';
import { web3Errors } from '@onekeyfe/cross-inpage-provider-errors';

export type AptosRequestMartian = {
  'martianSignAndSubmitTransaction': (transactions: string) => Promise<string>;

  'martianSignTransaction': (transactions:string) => Promise<string>;

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
    return this._account?.publicKey ?? null;
  }

  constructor(props: OneKeyAptosProviderProps) {
    super({
      ...props,
      bridge: props.bridge || getOrCreateExtInjectedJsBridge({ timeout: props.timeout }),
    });

    window.dispatchEvent(new Event('martian#initialized'));
  }

  private async getClient() {
    return new AptosClient(await this.getNetworkURL());
  }

  private _callMartianBridge<T extends keyof JsBridgeRequest>(params: {
    method: T;
    params: JsBridgeRequestParams<T>;
  }): JsBridgeRequestResponse<T> {
    return this.bridgeRequest(params) as JsBridgeRequestResponse<T>;
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
      const res = await this._callMartianBridge({
        method: 'signAndSubmitTransaction',
        params: transaction,
      });
      if (!res) throw web3Errors.provider.unauthorized();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return JSON.parse(res);
    }
  }

  async signTransaction(
    transaction: string | Types.TransactionPayload,
  ): Promise<string | Uint8Array> {
    if (typeof transaction === 'string') {
      return this._callMartianBridge({
        method: 'martianSignTransaction',
        params: transaction,
      });
    } else {
      const res = await this._callMartianBridge({
        method: 'signTransaction',
        params: transaction,
      });
      if (!res) throw web3Errors.provider.unauthorized();

      return new Uint8Array(Buffer.from(res, 'hex'));
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
    const client = await this.getClient();
    const rawTx = await client.generateTransaction(sender, payload, options);
    const serializer = new BCS.Serializer();
    rawTx.serialize(serializer);
    return serializer.getBytes().toString();
  }

  private _convertStringToUint8Array(array: string): Uint8Array {
    return new Uint8Array(array.split(',').map((item) => parseInt(item, 10)));
  }

  async submitTransaction(transaction: Uint8Array | string): Promise<string> {
    const signedTxn =
      typeof transaction === 'string' ? this._convertStringToUint8Array(transaction) : transaction;

    const client = await this.getClient();
    const res = await client.submitTransaction(signedTxn);
    return res.hash;
  }

  async getTransactions(query?: {
    start?: BigInt | number;
    limit?: number;
  }): Promise<Types.Transaction[]> {
    const client = await this.getClient();
    return client.getTransactions(query);
  }

  async getTransaction(txnHash: string): Promise<Types.Transaction> {
    const client = await this.getClient();
    return client.getTransactionByHash(txnHash);
  }

  async getAccountTransactions(
    accountAddress: MaybeHexString,
    query?: { start?: BigInt | number; limit?: number },
  ): Promise<Types.Transaction[]> {
    const client = await this.getClient();
    return client.getAccountTransactions(accountAddress, query);
  }

  async getAccountResources(
    accountAddress: MaybeHexString,
    query?: { ledgerVersion?: BigInt | number },
  ): Promise<Types.MoveResource[]> {
    const client = await this.getClient();
    return client.getAccountResources(accountAddress, query);
  }

  async getAccount(accountAddress: MaybeHexString): Promise<Types.AccountData> {
    const client = await this.getClient();
    return client.getAccount(accountAddress);
  }

  async getChainId(): Promise<number> {
    const client = await this.getClient();
    return client.getChainId();
  }

  async getLedgerInfo(): Promise<Types.IndexResponse> {
    const client = await this.getClient();
    return client.getLedgerInfo();
  }
}

export { ProviderAptosMartian };
