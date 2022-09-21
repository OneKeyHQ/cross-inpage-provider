import { IInpageProviderConfig } from '@onekeyfe/cross-inpage-provider-core';
import { getOrCreateExtInjectedJsBridge } from '../../../extension/extension-bridge-injected/dist';
import { AptosClient, BCS, Types, MaybeHexString } from 'aptos';
import { SignMessagePayload, SignMessageResponse, TxnPayload, TxnOptions } from './types';
import type * as TypeUtils from './type-utils';
import { IProviderAptos, ProviderAptos } from './OnekeyAptosProvider';

export type AptosRequestMartian = {
  'martianSignAndSubmitTransaction': (transactions: string) => Promise<string>;

  'martianSignTransaction': (transactions: Types.Transaction) => Promise<string>;

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

interface IProviderAptosMartian extends IProviderAptos {
  readonly isMartian: true;

  /**
   * Sign and submit transactions
   * @returns Transaction
   */
  signAndSubmitTransaction(transactions: string): Promise<string>;

  /**
   * Sign message
   * @returns Transaction
   */
  signMessage(payload: SignMessagePayload): Promise<SignMessageResponse>;
}

type OneKeyAptosProviderProps = IInpageProviderConfig & {
  timeout?: number;
};

class ProviderAptosMartian extends ProviderAptos implements IProviderAptosMartian {
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

  async signAndSubmitTransaction(transaction: string): Promise<string> {
    const res = this._callMartianBridge({
      method: 'martianSignAndSubmitTransaction',
      params: transaction,
    });

    return Promise.resolve(res);
  }

  async signTransaction(transaction: Types.Transaction): Promise<string> {
    const res = this._callMartianBridge({
      method: 'martianSignTransaction',
      params: transaction,
    });

    return Promise.resolve(res);
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
    max?: string,
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
    options: TxnOptions,
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

  async getTransactionByHash(txnHash: string): Promise<Types.Transaction> {
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
