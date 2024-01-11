/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { IInpageProviderConfig } from "@onekeyfe/cross-inpage-provider-core";
import { ProviderNostrBase } from "./ProviderNostrBase";
import {
  JsBridgeRequest,
  JsBridgeRequestParams,
  JsBridgeRequestResponse,
  IProviderNostr,
  NostrProviderEventsMap,
  Event,
  IRelay
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


class ProviderNostr extends ProviderNostrBase implements IProviderNostr {
  private states = {
    enabled: false,
    executing: false 
  }

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

  on<E extends keyof NostrProviderEventsMap>(
    event: E,
    listener: NostrProviderEventsMap[E]
  ): this {
    return super.on(event, listener);
  }

  off<E extends keyof NostrProviderEventsMap>(
    event: E,
    listener: NostrProviderEventsMap[E]
  ): this {
    return super.off(event, listener);
  }

  emit<E extends keyof NostrProviderEventsMap>(
    event: E,
    ...args: Parameters<NostrProviderEventsMap[E]>
  ): boolean {
    return super.emit(event, ...args);
  }

  private _callBridge<T extends keyof JsBridgeRequest>(params: {
    method: T;
    params?: JsBridgeRequestParams<T>;
  }): JsBridgeRequestResponse<T> {
    return this.bridgeRequest(params) as JsBridgeRequestResponse<T>
  }

  async enable(): Promise<boolean> {
    return Promise.resolve(true)
  }

  async getPublicKey(): Promise<string> {
    const result = await this._callBridge({ method: "getPublicKey" });  
    return result
  }

  async signEvent(event: Event): Promise<Event> {
    const result = await this._callBridge({ method: "signEvent", params: { event } });  
    return result
  }

  async getRelays(): Promise<IRelay> {
    const result = await this._callBridge({ method: "getRelays" });  
    return result
  }

  async encrypt(pubkey: string, plaintext: string): Promise<string> {
    const result = await this._callBridge({ method: "encrypt", params: { pubkey, plaintext } });  
    return result    
  }

  async decrypt(pubkey: string, ciphertext: string): Promise<string> {
    const result = await this._callBridge({ method: "decrypt", params: { pubkey, ciphertext } });  
    return result
  }

  nip04 = {
    encrypt: async (pubkey: string, plaintext: string) => {
      const result = await this._callBridge({ method: "encrypt", params: { pubkey, plaintext } });  
      return result
    },
    decrypt: async (pubkey: string, ciphertext: string) => {
      const result = await this._callBridge({ method: "decrypt", params: { pubkey, ciphertext } });  
      return result
    },
  }

  async signSchnorr(sigHash: string): Promise<string> {
    const result = await this._callBridge({ method: "signSchnorr", params: sigHash });
    return result
  }
}

export { ProviderNostr };
