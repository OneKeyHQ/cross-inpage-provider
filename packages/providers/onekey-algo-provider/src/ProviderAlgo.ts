import { IInpageProviderConfig } from '@onekeyfe/cross-inpage-provider-core';
import { ProviderAlgoBase } from './ProviderAlgoBase';
import {
  AlgoProviderEventsMap,
  BaseHTTPClient,
  DisplayEncoding,
  EnableOpts,
  EnableResult,
  IProviderAlgo,
  PROVIDER_EVENTS,
  PostTxnsResult,
  SignTxnsResult,
  TransactionResult,
  WalletTransaction,
} from './types';
import { isWalletEventMethodMatch } from './utils';

class ProviderAlgo extends ProviderAlgoBase implements IProviderAlgo {
  public readonly isExodus = true;
  public readonly isOneKey = true;
  public isConnected = false;
  public address: string | null = null;

  constructor(props: IInpageProviderConfig) {
    super(props);
    this._registerEvents();
  }

  private _registerEvents() {
    window.addEventListener('onekey_bridge_disconnect', () => {
      this._handleDisconnected();
    });

    this.on(PROVIDER_EVENTS.message_low_level, (payload) => {
      const { method, params } = payload;
      if (isWalletEventMethodMatch(method, PROVIDER_EVENTS.accountChanged)) {
        this._handleAccountChange(params as string);
      }
    });
  }

  private _handleConnected(connectInfo: { address: string }) {
    this.isConnected = true;
    this.address = connectInfo.address;
    this.emit(PROVIDER_EVENTS.connect, connectInfo);
    this.emit(PROVIDER_EVENTS.accountChanged, connectInfo.address);
  }

  private _handleDisconnected(options: { emit: boolean } = { emit: true }) {
    this.isConnected = false;
    this.address = null;
    if (options.emit && this.isConnectionStatusChanged('disconnected')) {
      this.emit(PROVIDER_EVENTS.disconnect);
      this.emit(PROVIDER_EVENTS.accountChanged, '');
    }
  }

  private _handleAccountChange(address: string) {
    this.emit(PROVIDER_EVENTS.accountChanged, address);
  }

  on<E extends keyof AlgoProviderEventsMap>(event: E, listener: AlgoProviderEventsMap[E]): this {
    return super.on(event, listener);
  }

  off<E extends keyof AlgoProviderEventsMap>(event: E, listener: AlgoProviderEventsMap[E]): this {
    return super.off(event, listener);
  }

  emit<E extends keyof AlgoProviderEventsMap>(
    event: E,
    ...args: Parameters<AlgoProviderEventsMap[E]>
  ): boolean {
    return super.emit(event, ...args);
  }

  enable(opts?: EnableOpts) {
    return this.request<EnableResult>({ method: 'algo_enable', params: opts });
  }

  signTxns(transactions: WalletTransaction[]) {
    return this.request<SignTxnsResult>({ method: 'algo_signTxns', params: transactions });
  }

  postTxns(transactions: string[]) {
    return this.request<PostTxnsResult>({ method: 'algo_postTxns', params: transactions });
  }

  signAndPostTxns(transactions: WalletTransaction[]) {
    return this.request<PostTxnsResult>({ method: 'algo_signAndPostTxns', params: transactions });
  }

  getAlgodv2Client() {
    return this.request<BaseHTTPClient>({ method: 'algo_getAlgodv2Client' });
  }

  getIndexerClient() {
    return this.request<BaseHTTPClient>({ method: 'algo_getIndexerClient' });
  }

  // legacy

  async connect() {
    const addresses = await this.request<string[]>({ method: 'algo_requestAccounts' });
    const address = addresses[0];
    this._handleConnected({ address });
    return { address };
  }

  async disconnect() {
    await this.request<void>({ method: 'algo_disconnect' });
    this._handleDisconnected();
  }

  signAndSendTransaction(transactions: Uint8Array[]): Promise<TransactionResult> {
    return this.request<TransactionResult>({
      method: 'algo_signAndSendTransaction',
      params: transactions,
    });
  }

  async signTransaction(transactions: Uint8Array[]): Promise<Uint8Array[]> {
    const result = await this.request<string>({
      method: 'algo_signTransaction',
      params: transactions,
    });
    const rawTxs = result.split(',').map((tx) => Uint8Array.from(Buffer.from(tx, 'base64')));
    return rawTxs;
  }

  signMessage(
    encodedMessage: Uint8Array,
    display?: DisplayEncoding | undefined,
  ): Promise<{ signature: Uint8Array; address: string }> {
    return this.request<{ signature: Uint8Array; address: string }>({
      method: 'algo_signMessage',
      params: { encodedMessage, display },
    });
  }
}

export { ProviderAlgo };
