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

type SolanaProviderEventsMap = {
  [PROVIDER_EVENTS.connect]: () => void;
  [PROVIDER_EVENTS.disconnect]: () => void;
  [PROVIDER_EVENTS.accountChanged]: (account: null) => void;
  [PROVIDER_EVENTS.message_low_level]: (payload: IJsonRpcRequest) => void;
};

interface IProviderCardano extends ProviderBase {
	isConnected: boolean;

	getNetworkId(): Promise<NetworkId>;
}

type OneKeyCardanoProviderProps = IInpageProviderConfig & {
  timeout?: number;
};

class ProviderCardano extends ProviderCardanoBase implements IProviderCardano {
	get isConnected() {
		return true
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

	async getNetworkId(): Promise<NetworkId> {
		const result = await this._callBridge({
			method: 'getNetworkId',
			params: undefined
		})	

		return result
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

	on<E extends keyof SolanaProviderEventsMap>(
    event: E,
    listener: SolanaProviderEventsMap[E],
  ): this {
    return super.on(event, listener);
  }

  emit<E extends keyof SolanaProviderEventsMap>(
    event: E,
    ...args: Parameters<SolanaProviderEventsMap[E]>
  ): boolean {
    return super.emit(event, ...args);
  }
}

export {ProviderCardano}
