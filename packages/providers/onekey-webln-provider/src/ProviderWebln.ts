import { IInpageProviderConfig } from '@onekeyfe/cross-inpage-provider-core';
import { ProviderWeblnBase } from './ProviderWeblnBase'
import { WeblnProviderEventsMap, GetInfoResponse, IProviderWebln, JsBridgeRequest, JsBridgeRequestParams, JsBridgeRequestResponse  } from './types';

class ProviderWebln extends ProviderWeblnBase implements IProviderWebln {
	enabled: boolean;
  isEnabled: boolean;		
	executing: boolean;

	constructor(props: IInpageProviderConfig) {
		super(props)
    this.enabled = false;
    this.isEnabled = false; // seems some webln implementations use webln.isEnabled and some use webln.enabled
    this.executing = false;
  }

	on<E extends keyof WeblnProviderEventsMap>(
    event: E,
    listener: WeblnProviderEventsMap[E],
  ): this {
    return super.on(event, listener);
  }

  emit<E extends keyof WeblnProviderEventsMap>(
    event: E,
    ...args: Parameters<WeblnProviderEventsMap[E]>
  ): boolean {
    return super.emit(event, ...args);
  }

	private _callBridge<T extends keyof JsBridgeRequest>(params: {
    method: T;
    params?: JsBridgeRequestParams<T>;
  }): JsBridgeRequestResponse<T> {
    return this.bridgeRequest(params) as JsBridgeRequestResponse<T>;
  }

	async enable() {
		if (this.enabled) {
			return { enabled: true }
		}
		const result = await this._callBridge({ method: 'enable' })
		if (typeof result.enabled === 'boolean') {
			this.enabled = result.enabled
			this.isEnabled = result.enabled
		}
		return result
	}

	async getInfo(): Promise<GetInfoResponse> {
		return this._callBridge({ method: 'getInfo' })
	}
}

export { ProviderWebln }
