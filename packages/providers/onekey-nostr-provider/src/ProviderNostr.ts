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
  NostrRequeset,
  NostrProviderEventsMap,
  Event,
  IRelay
} from "./types";

class ProviderNostr extends ProviderNostrBase implements IProviderNostr {
  private states = {
    enabled: false,
    executing: false 
  }

  constructor(props: IInpageProviderConfig) {
    super(props);
  }

  setExecuting(executing: boolean) {
    this.states.executing = executing
  }

  private checkEnabled(method: keyof NostrRequeset) {
    if (!this.states.enabled) {
      const message = `Please allow the connection request of webln before calling the ${method} method`
      alert(message)
      throw new Error(message);
    }
    if (this.states.executing) {
      const message = `window.webln call already executing`
      alert(message)
      throw new Error(message) 
    }
  }

  on<E extends keyof NostrProviderEventsMap>(
    event: E,
    listener: NostrProviderEventsMap[E]
  ): this {
    return super.on(event, listener);
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

  async getPublicKey(): Promise<string> {
    const result = await this._callBridge({ method: "getPublicKey" });  
    return result
  }

  async signEvent(): Promise<Event> {
    const result = await this._callBridge({ method: "signEvent" });  
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
}

export { ProviderNostr };
