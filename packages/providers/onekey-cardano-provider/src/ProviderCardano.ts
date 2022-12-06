import { ProviderBase } from '@onekeyfe/cross-inpage-provider-core'
import { ProviderCardanoBase } from './ProviderCardanoBase'
import { IInpageProviderConfig } from '@onekeyfe/cross-inpage-provider-core';
import { getOrCreateExtInjectedJsBridge } from '@onekeyfe/extension-bridge-injected';
import { isWalletEventMethodMatch } from './utils'
import { IJsonRpcRequest } from '@onekeyfe/cross-inpage-provider-types';
import * as TypeUtils from './type-utils'

export enum NetworkId {
  mainnet = 1,
  testnet = 0
}

export interface CardanoRequest {
	getNetworkId: () => Promise<NetworkId>
}

export type JsBridgeRequest = {
	[K in keyof CardanoRequest]: (params: Parameters<CardanoRequest[K]>[0]) => Promise<TypeUtils.WireStringified<TypeUtils.ResolvePromise<ReturnType<CardanoRequest[K]>>>>
}

type JsBridgeRequestParams<T extends keyof JsBridgeRequest> = Parameters<JsBridgeRequest[T]>[0]

type JsBridgeRequestResponse<T extends keyof JsBridgeRequest> = ReturnType<JsBridgeRequest[T]>

type CardanoProviderState = {
	publicKey: string;
}

const PROVIDER_EVENTS = {
  'connect': 'connect',
  'disconnect': 'disconnect',
  'accountChanged': 'accountChanged',
  'message_low_level': 'message_low_level',
} as const;

type CardanoProviderEventsMap = {
  [PROVIDER_EVENTS.connect]: () => void;
  [PROVIDER_EVENTS.disconnect]: () => void;
  [PROVIDER_EVENTS.accountChanged]: (account: null) => void;
  [PROVIDER_EVENTS.message_low_level]: (payload: IJsonRpcRequest) => void;
};

type WalletApi = any
type Cip30Wallet = {
  enable(): Promise<WalletApi>;
  isEnabled(): Promise<boolean>;
  apiVersion: string;
  name: string;
  icon: string;
}

interface IProviderCardano extends ProviderBase {
	isConnected: boolean;

  onekey: Cip30Wallet;

	getNetworkId(): Promise<NetworkId>;
}

type OneKeyCardanoProviderProps = IInpageProviderConfig & {
  timeout?: number;
};

class ProviderCardano extends ProviderCardanoBase implements IProviderCardano {
	get isConnected() {
		return true
	}

  get onekey() {
    return {
      apiVersion: '0.1.0',
      name: 'oneKey',
      icon: 'https://theme.zdassets.com/theme_assets/10237731/cd8f795ce97bdd7657dd4fb4b19fde3f32b50349.png',
      isEnabled: () => Promise.resolve(true),
      enable: () => {
        return Promise.resolve({
          getNetworkId: () => this.getNetworkId(),
        })
      }
    }
  }

  constructor(props: OneKeyCardanoProviderProps) {
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
      const { method, params } = payload;

      if (isWalletEventMethodMatch(method, PROVIDER_EVENTS.accountChanged)) {
        this._handleAccountChange(params);
      }
    });

  }

	private _callBridge<T extends keyof JsBridgeRequest>(params: {
		method: T;
		params: JsBridgeRequestParams<T>;
	}): JsBridgeRequestResponse<T> {
		return this.bridgeRequest(params) as JsBridgeRequestResponse<T>;
	}

	private postMessage(param: any) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		return this._callBridge(param);
	}

	private _handleDisconnected(options: { emit: boolean } = { emit: true }) {
    if (options.emit && this.isConnectionStatusChanged('disconnected')) {
      this.connectionStatus = 'disconnected';
      this.emit('disconnect');
      this.emit('accountChanged', null);
    }
  }

	private _handleAccountChange(payload: any) {
		// TODO: handle account change
	}

	on<E extends keyof CardanoProviderEventsMap>(
    event: E,
    listener: CardanoProviderEventsMap[E],
  ): this {
    return super.on(event, listener);
  }

  emit<E extends keyof CardanoProviderEventsMap>(
    event: E,
    ...args: Parameters<CardanoProviderEventsMap[E]>
  ): boolean {
    return super.emit(event, ...args);
  }

  // CIP30 Wallet API 👇

/**
 * Returns the network id of the currently connected account.
 * 0 is testnet and 1 is mainnet but other networks can possibly be returned by wallets.
 * Those other network ID values are not governed by this document.
 *
 * This result will stay the same unless the connected account has changed.
 *
 * @throws ApiError
 */
  async getNetworkId(): Promise<NetworkId> {
		const result = await this._callBridge({
			method: 'getNetworkId',
			params: undefined
		})	

		return result
	}

}

export {ProviderCardano}
