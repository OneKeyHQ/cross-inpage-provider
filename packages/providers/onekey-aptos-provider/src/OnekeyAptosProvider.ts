
import { IInpageProviderConfig } from '@onekeyfe/cross-inpage-provider-core';
import { getOrCreateExtInjectedJsBridge } from '@onekeyfe/extension-bridge-injected';
import { ProviderAptosBase } from './ProviderAptosBase';
import type {
  AptosAccountInfo,
  SignMessagePayload,
  SignMessageResponse,
  SignTransactionPayload,
} from './types';
import type * as TypeUtils from './type-utils';
import { IJsonRpcRequest } from '@onekeyfe/cross-inpage-provider-types';
import { web3Errors } from '@onekeyfe/cross-inpage-provider-errors';
import {  BCS, TxnBuilderTypes, type Types } from 'aptos';
import { convertV2JsonPayloadToV1, convertV2toV1 } from './conversion';
import { AnyRawTransaction,InputTransactionData,TransactionOptions } from '@aptos-labs/wallet-adapter-core';
import { AccountAddress } from '@aptos-labs/ts-sdk';

export type AptosProviderType = 'petra' | 'martian';

const PROVIDER_EVENTS = {
  'connect': 'connect',
  'disconnect': 'disconnect',
  'accountChanged': 'accountChanged',
  'networkChange': 'networkChange',
  'message_low_level': 'message_low_level',
} as const;

type AptosProviderEventsMap = {
  [PROVIDER_EVENTS.connect]: (account: string) => void;
  [PROVIDER_EVENTS.disconnect]: () => void;
  [PROVIDER_EVENTS.accountChanged]: (account: string | null) => void;
  [PROVIDER_EVENTS.networkChange]: (name: string | null) => void;
  [PROVIDER_EVENTS.message_low_level]: (payload: IJsonRpcRequest) => void;
};

export type AptosRequest = {
  'connect': () => Promise<AptosAccountInfo>;

  'disconnect': () => Promise<void>;

  'account': () => Promise<AptosAccountInfo>;

  'network': () => Promise<string>;

  'getNetworkURL': () => Promise<string>;

  'signMessage': (payload: SignMessagePayload) => Promise<SignMessageResponse>;

  'signAndSubmitTransaction': (transactions: InputTransactionData | Types.TransactionPayload) => Promise<string>;

  'signTransaction': (transactions: SignTransactionPayload) => Promise<string>;

  // V2 To V1 SignTransaction
  'martianSignTransaction': (transactions: string) => Promise<string>;
};

type JsBridgeRequest = {
  [K in keyof AptosRequest]: (
    params: Parameters<AptosRequest[K]>[0],
  ) => Promise<TypeUtils.WireStringified<TypeUtils.ResolvePromise<ReturnType<AptosRequest[K]>>>>;
};

type JsBridgeRequestParams<T extends keyof JsBridgeRequest> = Parameters<JsBridgeRequest[T]>[0];

type JsBridgeRequestResponse<T extends keyof JsBridgeRequest> = ReturnType<JsBridgeRequest[T]>;

export type PROVIDER_EVENTS_STRINGS = keyof typeof PROVIDER_EVENTS;

export interface IProviderAptos extends ProviderAptosBase {
  publicKey: string | null;

  /**
   * Connect wallet, and get wallet info
   * @emits `connect` on success
   */
  connect(): Promise<AptosAccountInfo>;

  isConnected(): boolean;

  /**
   * Disconnect wallet
   */
  disconnect(): Promise<void>;

  /**
   * Connect wallet, and get wallet info
   */
  account(): Promise<AptosAccountInfo>;

  /**
   * Sign and submit transactions
   * @returns Transaction
   */
  signAndSubmitTransaction(transactions: any): Promise<any>;

  signTransaction(transactions: any): Promise<any>;

  /**
   * Sign message
   * @returns Transaction
   */
  signMessage(payload: SignMessagePayload): Promise<SignMessageResponse>;

  network(): Promise<string>;

  getNetworkURL(): Promise<string>;
}

type OneKeyAptosProviderProps = IInpageProviderConfig & {
  timeout?: number;
};

function isWalletEventMethodMatch({ method, name }: { method: string; name: string }) {
  return method === `wallet_events_${name}`;
}

class ProviderAptos extends ProviderAptosBase implements IProviderAptos {
  protected _account: AptosAccountInfo | null = null;

  protected aptosProviderType: AptosProviderType = 'petra';

  get publicKey() {
    return this._account?.publicKey ?? null;
  }

  constructor(props: OneKeyAptosProviderProps) {
    super({
      ...props,
      bridge: props.bridge || getOrCreateExtInjectedJsBridge({ timeout: props.timeout }),
    });

    this._registerEvents();
  }

  private _registerEvents() {
    window.addEventListener('onekey_bridge_disconnect', () => {
      this._handleDisconnected();
    });

    this.on(PROVIDER_EVENTS.message_low_level, (payload) => {
      if (!payload) return;
      const { method, params } = payload;

      if (isWalletEventMethodMatch({ method, name: PROVIDER_EVENTS.accountChanged })) {
        this._handleAccountChange(params as AptosAccountInfo);
      }

      if (isWalletEventMethodMatch({ method, name: PROVIDER_EVENTS.networkChange })) {
        this._handleNetworkChange(params as string);
      }
    });
  }

  private _callBridge<T extends keyof JsBridgeRequest>(params: {
    method: T;
    params: JsBridgeRequestParams<T>;
    aptosProviderType?: AptosProviderType;
  }): JsBridgeRequestResponse<T> {
    params.aptosProviderType = this.aptosProviderType;
    return this.bridgeRequest(params) as JsBridgeRequestResponse<T>;
  }

  private _handleConnected(account: AptosAccountInfo, options: { emit: boolean } = { emit: true }) {
    this._account = account;
    if (options.emit && this.isConnectionStatusChanged('connected')) {
      this.connectionStatus = 'connected';
      const address = account?.address ?? null;
      this.emit('connect', address);
      this.emit('accountChanged', address);
    }
  }

  private _handleDisconnected(options: { emit: boolean } = { emit: true }) {
    this._account = null;

    if (options.emit && this.isConnectionStatusChanged('disconnected')) {
      this.connectionStatus = 'disconnected';
      this.emit('disconnect');
      this.emit('accountChanged', null);
    }
  }

  override isAccountsChanged(account: AptosAccountInfo | undefined) {
    return account?.address !== this._account?.address;
  }

  // trigger by bridge account change event
  private _handleAccountChange(payload: AptosAccountInfo) {
    const account = payload;
    if (this.isAccountsChanged(account)) {
      this.emit('accountChanged', account?.address || null);
    }
    if (!account) {
      this._handleDisconnected();
      return;
    }

    this._handleConnected(account, { emit: false });
  }

  private _network: string | null | undefined;
  override isNetworkChanged(network: string) {
    return this._network === undefined || network !== this._network;
  }

  private _handleNetworkChange(payload: string) {
    const network = payload;
    if (this.isNetworkChanged(network)) {
      this.emit('networkChange', network || null);
    }
    this._network = network;
  }

  async connect(): Promise<AptosAccountInfo> {
    if (this._account) {
      return Promise.resolve(this._account);
    }

    const result = await this._callBridge({
      method: 'connect',
      params: undefined,
    });

    if (!result) throw web3Errors.provider.unauthorized();

    this._handleConnected(result, { emit: true });

    return result;
  }

  isConnected() {
    return this._account !== null;
  }

  async account(): Promise<AptosAccountInfo> {
    const res = await this._callBridge({
      method: 'account',
      params: undefined,
    });

    if (!res) throw web3Errors.provider.unauthorized();

    return Promise.resolve(res);
  }

  async signAndSubmitTransaction(
    payloadV1OrGenerateTxnInput: InputTransactionData | Types.TransactionPayload,
    optionsV1?: any,
): Promise<any> {
    if ("data" in payloadV1OrGenerateTxnInput) {
      const generateTxnInput = payloadV1OrGenerateTxnInput;
      const options = {
        expirationTimestamp: generateTxnInput.options?.expireTimestamp,
        sender: generateTxnInput.sender
          ? AccountAddress.from(generateTxnInput.sender).toString()
          : undefined,
        ...generateTxnInput.options,
      }

      // The payload arguments are not serialized, the easiest thing to do is to generate a payload instance
      // if (areBCSArguments(generateTxnInput.data.functionArguments)) {
      //   const network = await this.network();
      //   const payload = await generateV1TransactionPayload(generateTxnInput.data, network);
      //   return await this.signAndSubmitBCSTransaction(payload, options);
      // }

      // The payload arguments are serialized, we can just convert and send them over
      const payload = convertV2JsonPayloadToV1(generateTxnInput.data)
      const res = await this._callBridge({
        method: 'signAndSubmitTransaction',
        params: payload,
      });
      if (!res) throw web3Errors.provider.unauthorized();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return JSON.parse(res);
    } else if("payload" in payloadV1OrGenerateTxnInput){
        const generateTxnInput = payloadV1OrGenerateTxnInput;

        const res = await this._callBridge({
          method: 'signAndSubmitTransaction',
          // @ts-expect-error
          params: generateTxnInput.payload,
        });
        if (!res) throw web3Errors.provider.unauthorized();

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return JSON.parse(res);
    }

    const res = await this._callBridge({
      method: 'signAndSubmitTransaction',
      params: payloadV1OrGenerateTxnInput ,
    });
    if (!res) throw web3Errors.provider.unauthorized();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return JSON.parse(res);
  }

  async signTransaction(transactionOrPayload: Types.TransactionPayload | TxnBuilderTypes.TransactionPayload | AnyRawTransaction,optionsOrAsFeePayer?: TransactionOptions | boolean): Promise<any> {
      if ('rawTransaction' in transactionOrPayload) {
        const transaction = transactionOrPayload as AnyRawTransaction
        const asFeePayer = (optionsOrAsFeePayer as boolean | undefined) ?? false;
        const rawTxnV1 = convertV2toV1(transaction.rawTransaction, TxnBuilderTypes.RawTransaction);

        const secondarySignersAddressesV1 = transaction.secondarySignerAddresses?.map((address:AccountAddress) =>
          convertV2toV1(address, TxnBuilderTypes.AccountAddress),
        );

        let rawTxn:
          | TxnBuilderTypes.RawTransaction
          | TxnBuilderTypes.FeePayerRawTransaction
          | TxnBuilderTypes.MultiAgentRawTransaction;

        if (asFeePayer) {
          const activeAccount = await this.account();
          const feePayerAddressV1 = TxnBuilderTypes.AccountAddress.fromHex(activeAccount.address);
          rawTxn = new TxnBuilderTypes.FeePayerRawTransaction(
            rawTxnV1,
            secondarySignersAddressesV1 ?? [],
            feePayerAddressV1,
          );
        } else if (transaction.feePayerAddress) {
          const feePayerAddressV1 = convertV2toV1(
            transaction.feePayerAddress,
            TxnBuilderTypes.AccountAddress,
          );
          rawTxn = new TxnBuilderTypes.FeePayerRawTransaction(
            rawTxnV1,
            secondarySignersAddressesV1 ?? [],
            feePayerAddressV1,
          );
        } else if (secondarySignersAddressesV1) {
          rawTxn = new TxnBuilderTypes.MultiAgentRawTransaction(
            rawTxnV1,
            secondarySignersAddressesV1,
          );
        } else {
          rawTxn = rawTxnV1;
        }

        const serializer = new BCS.Serializer();
        rawTxn.serialize(serializer)
        const bcsTxn = serializer.getBytes().toString();

        const res: string = await this._callBridge({
          method: 'martianSignTransaction',
          params: bcsTxn,
        });

        if (!res) throw web3Errors.provider.unauthorized();

        return new Uint8Array(Buffer.from(res, 'hex'));
      }


    const res = await this._callBridge({
      method: 'signTransaction',
      params: transactionOrPayload as Types.TransactionPayload,
    });
    if (!res) throw web3Errors.provider.unauthorized();

    return new Uint8Array(Buffer.from(res, 'hex'));
  }

  signMessage(payload: SignMessagePayload): Promise<SignMessageResponse> {
    return this._callBridge({
      method: 'signMessage',
      params: payload,
    });
  }

  network(): Promise<string> {
    return this._callBridge({
      method: 'network',
      params: undefined,
    });
  }

  async getNetwork(): Promise<{
    name: string;
    url: string;
    chainId: number;
  }> {
    const name = await this._callBridge({
      method: 'network',
      params: undefined,
    });

    const url = await this._callBridge({
      method: 'getNetworkURL',
      params: undefined,
    });

    // see more chainID https://aptos.dev/nodes/networks
    const chainId = name === 'Mainnet' ? 1 : 2;

    return {
      name,
      url,
      chainId,
    };
  }

  getNetworkURL(): Promise<string> {
    return this._callBridge({
      method: 'getNetworkURL',
      params: undefined,
    });
  }

  async disconnect(): Promise<void> {
    await this._callBridge({
      method: 'disconnect',
      params: void 0,
    });
    this._handleDisconnected();
  }

  onNetworkChange(listener: AptosProviderEventsMap['networkChange']): this {
    return super.on(PROVIDER_EVENTS.networkChange, listener);
  }

  onAccountChange(listener: AptosProviderEventsMap['accountChanged']): this {
    return super.on(PROVIDER_EVENTS.accountChanged, listener);
  }

  on<E extends keyof AptosProviderEventsMap>(event: E, listener: AptosProviderEventsMap[E]): this {
    return super.on(event, listener);
  }

  emit<E extends keyof AptosProviderEventsMap>(
    event: E,
    ...args: Parameters<AptosProviderEventsMap[E]>
  ): boolean {
    return super.emit(event, ...args);
  }
}

export { ProviderAptos };
