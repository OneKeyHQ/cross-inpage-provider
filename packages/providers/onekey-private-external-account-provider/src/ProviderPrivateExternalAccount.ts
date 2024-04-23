/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { IInpageProviderConfig } from "@onekeyfe/cross-inpage-provider-core";
import { ProviderPrivateExternalAccountBase } from "./ProviderPrivateExternalAccountBase";
import {
  JsBridgeRequest,
  JsBridgeRequestParams,
  JsBridgeRequestResponse,
  PrivateExternalAccountProviderEventsMap,
  IExternalAccount,
  IProviderPrivateExternalAccount,
  IEncodedTxBtc,
  IBtcNetwork,
  ISignTxRes
} from "./types";

function isWalletEventMethodMatch(method: string, name: string) {
  return method === `metamask_${name}` || method === `wallet_events_${name}`;
}

const PROVIDER_EVENTS = {
  'connect': 'connect',
  'disconnect': 'disconnect',
  'accountChanged': 'accountChanged',
  'message_low_level': 'message_low_level',
} as const;


class ProviderPrivateExternalAccount extends ProviderPrivateExternalAccountBase implements IProviderPrivateExternalAccount {
  constructor(props: IInpageProviderConfig) {
    super(props);
    this._registerEvents()
  }

  private _registerEvents() {
    window.addEventListener('onekey_bridge_disconnect', () => {
      this._handleDisconnected();
    });

    this.on(PROVIDER_EVENTS.message_low_level, (payload) => {
      const { method } = payload;
      if (isWalletEventMethodMatch(method, PROVIDER_EVENTS.accountChanged)) {
        this._handleAccountChange();
      }
    });
  }

  private _handleDisconnected(options: { emit: boolean } = { emit: true }) {
    if (options.emit && this.isConnectionStatusChanged('disconnected')) {
      this.emit('disconnect');
      this.emit('accountChanged');
    }
  }

  private _handleAccountChange() {
    this.emit('accountChanged');
  }

  on<E extends keyof PrivateExternalAccountProviderEventsMap>(
    event: E,
    listener: PrivateExternalAccountProviderEventsMap[E]
  ): this {
    return super.on(event, listener);
  }

  off<E extends keyof PrivateExternalAccountProviderEventsMap>(
    event: E,
    listener: PrivateExternalAccountProviderEventsMap[E]
  ): this {
    return super.off(event, listener);
  }

  emit<E extends keyof PrivateExternalAccountProviderEventsMap>(
    event: E,
    ...args: Parameters<PrivateExternalAccountProviderEventsMap[E]>
  ): boolean {
    return super.emit(event, ...args);
  }

  private _callBridge<T extends keyof JsBridgeRequest>(params: {
    method: T;
    params?: JsBridgeRequestParams<T>;
  }): JsBridgeRequestResponse<T> {
    return this.bridgeRequest(params) as JsBridgeRequestResponse<T>
  }

  async btc_requestAccount(network: IBtcNetwork): Promise<IExternalAccount> {
    const result = await this._callBridge({ method: "btc_requestAccount", params: network });  
    return result
  }

  async btc_signTransaction(params: {
    encodedTx: IEncodedTxBtc;
    network: IBtcNetwork;
  }): Promise<ISignTxRes> {
    const result = await this._callBridge({ method: "btc_signTransaction", params });
    return result
  }
}

export { ProviderPrivateExternalAccount };
