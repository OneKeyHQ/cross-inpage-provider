import { IInpageProviderConfig } from '@onekeyfe/cross-inpage-provider-core';
import { ProviderWeblnBase } from './ProviderWeblnBase'
import { WeblnProviderEventsMap, GetInfoResponse, IProviderWebln, JsBridgeRequest, JsBridgeRequestParams, JsBridgeRequestResponse, RequestInvoiceArgs, RequestInvoiceResponse, VerifyMessageArgs  } from './types';

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
		if (!this.enabled) {
      throw new Error("Please allow the connection request of webln before calling the getInfo method");
		}
		return this._callBridge({ method: 'getInfo' })
	}

	async makeInvoice(args: RequestInvoiceArgs): Promise<RequestInvoiceResponse> {
		if (!this.enabled) {
			throw new Error("Please allow the connection request of webln before calling the makeInvoice method");
		}
		return this._callBridge({method: 'makeInvoice', params: args})
	}

	async sendPayment(paymentRequest: string) {
		if (!this.enabled) {
			throw new Error("Please allow the connection request of webln before calling the sendPayment method");
		}
		return this._callBridge({ method: 'sendPayment', params: paymentRequest })
	}

	async signMessage(message: string) {
		if (!this.enabled) {
			throw new Error("Please allow the connection request of webln before calling the sendPayment method");
		}
		return this._callBridge({ method: 'signMessage', params: message })
	}

	verifyMessage(signature: string, message: string) {
		if (!this.enabled) {
			throw new Error("Please allow the connection request of webln before calling the sendPayment method");
		}
		return this._callBridge({ method: 'verifyMessage', params: {signature, message} })
	}

	async lnurl(lnurlString: string) {
		if (!this.enabled) {
			throw new Error("Please allow the connection request of webln before calling the lnurl method");
		}
		return this._callBridge({ method: 'lnurl', params: lnurlString })
	}
}

export { ProviderWebln }
