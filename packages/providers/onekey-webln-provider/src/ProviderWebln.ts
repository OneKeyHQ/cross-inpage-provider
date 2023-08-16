/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { IInpageProviderConfig } from "@onekeyfe/cross-inpage-provider-core";
import { ProviderWeblnBase } from "./ProviderWeblnBase";
import {
  WeblnProviderEventsMap,
  GetInfoResponse,
  IProviderWebln,
  JsBridgeRequest,
  JsBridgeRequestParams,
  JsBridgeRequestResponse,
  RequestInvoiceArgs,
  RequestInvoiceResponse,
  EnableResponse,
} from "./types";

class ProviderWebln extends ProviderWeblnBase implements IProviderWebln {
  private states = {
    enabled: false,
    executing: false 
  }

  constructor(props: IInpageProviderConfig) {
    super(props);
    this.handlerLnurl();
  }

  on<E extends keyof WeblnProviderEventsMap>(
    event: E,
    listener: WeblnProviderEventsMap[E]
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
    if (this.states.enabled) {
      return { enabled: true };
    }
    const result = await this._callBridge({ method: "enable" });
    if (typeof result.enabled === "boolean") {
      this.states.enabled = true
    }
    return result;
  }

  async getInfo(): Promise<GetInfoResponse> {
    if (!this.states.enabled) {
      throw new Error(
        "Please allow the connection request of webln before calling the getInfo method"
      );
    }
    return this._callBridge({ method: "getInfo" });
  }

  async makeInvoice(args: RequestInvoiceArgs): Promise<RequestInvoiceResponse> {
    if (!this.states.enabled) {
      throw new Error(
        "Please allow the connection request of webln before calling the makeInvoice method"
      );
    }
    return this._callBridge({ method: "makeInvoice", params: args });
  }

  async sendPayment(paymentRequest: string) {
    if (!this.states.enabled) {
      throw new Error(
        "Please allow the connection request of webln before calling the sendPayment method"
      );
    }
    return this._callBridge({ method: "sendPayment", params: paymentRequest });
  }

  async signMessage(message: string) {
    if (!this.states.enabled) {
      throw new Error(
        "Please allow the connection request of webln before calling the sendPayment method"
      );
    }
    return this._callBridge({ method: "signMessage", params: message });
  }

  verifyMessage(signature: string, message: string) {
    if (!this.states.enabled) {
      throw new Error(
        "Please allow the connection request of webln before calling the sendPayment method"
      );
    }
    return this._callBridge({
      method: "verifyMessage",
      params: { signature, message },
    });
  }

  getBalance() {
    if (!this.states.enabled) {
      throw new Error(
        "Please allow the connection request of webln before calling the getBalance method"
      );
    }
    return this._callBridge({ method: "getBalance", params: undefined });
  }

  async lnurl(lnurlString: string) {
    if (!this.states.enabled) {
      throw new Error(
        "Please allow the connection request of webln before calling the lnurl method"
      );
    }
    return this._callBridge({ method: "lnurl", params: lnurlString });
  }

  handlerLnurl() {
    if (document) {
      window.addEventListener("click", (ev) => {
        const target = ev.composedPath()[0] as HTMLElement;
        if (!target || !target.closest) {
          return;
        }
        const lightningLink = target.closest('[href^="lightning:" i]');
        const lnurlLink = target.closest('[href^="lnurl" i]');
        const bitcoinLinkWithLighting = target.closest(
          '[href*="lightning=ln" i]'
        );
        let href;
        let paymentRequest: string | null | undefined;
        let lnurl: string | undefined;

        if (!lightningLink && !bitcoinLinkWithLighting && !lnurlLink) {
          return;
        }
        ev.preventDefault();

        if (lightningLink) {
          href = lightningLink.getAttribute("href")?.toLowerCase();
          paymentRequest = href?.replace("lightning:", "");
        } else if (bitcoinLinkWithLighting) {
          href = bitcoinLinkWithLighting.getAttribute("href")?.toLowerCase();
          const url = new URL(href ?? "");
          const query = new URLSearchParams(url.search);
          paymentRequest = query.get("lightning");
        } else if (lnurlLink) {
          href = lnurlLink.getAttribute("href")?.toLowerCase();
          lnurl = href?.replace(/^lnurl[pwc]:/i, "");
        }

        if (!paymentRequest && !lnurl) {
          return;
        }

        if (paymentRequest && paymentRequest.startsWith("lnurl")) {
          lnurl = paymentRequest.replace(/^lnurl[pwc]:/i, "");
        }

        if (paymentRequest && paymentRequest.match(/(\S+@\S+)/)) {
          lnurl = paymentRequest.match?.(/(\S+@\S+)/)?.[1];
        }

        window.webln.enable().then((response: EnableResponse) => {
          if (!response.enabled) {
            return;
          }
          if (lnurl) {
            return window.webln.lnurl(lnurl);
          }

          if (paymentRequest) {
            return window.webln.sendPayment(paymentRequest);
          }
        })
      }, { capture: true });
    }
  }
}

export { ProviderWebln };
