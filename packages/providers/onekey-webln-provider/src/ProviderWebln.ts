import { ProviderWeblnBase } from './ProviderWeblnBase'
import { GetInfoResponse, IProviderWebln, JsBridgeRequest, JsBridgeRequestParams, JsBridgeRequestResponse  } from './types';

class ProviderWebln extends ProviderWeblnBase implements IProviderWebln {
	private _callBridge<T extends keyof JsBridgeRequest>(params: {
    method: T;
    params?: JsBridgeRequestParams<T>;
  }): JsBridgeRequestResponse<T> {
    return this.bridgeRequest(params) as JsBridgeRequestResponse<T>;
  }

	async enable() {
		return this._callBridge({ method: 'enable' })
	}

	async getInfo(): Promise<GetInfoResponse> {
		return this._callBridge({ method: 'getInfo' })
	}
}

export { ProviderWebln }
