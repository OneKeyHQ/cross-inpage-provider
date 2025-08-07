import { ProviderEthereum } from '@onekeyfe/onekey-eth-provider';

const KEY_BUILT_IN_PERP_STATUS = '$$$_isOneKeyBuiltInPerpView_@@@';
const HYPERLIQUID_HOSTNAME = 'app.hyperliquid.xyz';
const ONEKEY_PERP_VIEW_PARAM = 'isOneKeyBuiltInPerpView=true';
const ONEKEY_PERP_FIELD = {
  // $$isOneKeyBuiltInPerpView: true
};

// Save original console.log before it might be overridden
const originalConsoleLog = console.log;

class BuiltInPerpInjected {
  constructor() {
    this.init();
    originalConsoleLog('BuiltInPerpInjected>>>>done');
  }

  init() {
    this.saveBuiltInPerpStatus();

    if (this.isBuiltInPerp()) {
      this.modifyFetch();
    }
  }

  isBuiltInPerpUrl() {
    return (
      window.location.hostname === HYPERLIQUID_HOSTNAME &&
      window.location.search.includes(ONEKEY_PERP_VIEW_PARAM)
    );
  }

  saveBuiltInPerpStatus() {
    const isBuiltInPerpUrl: boolean = this.isBuiltInPerpUrl();
    if (isBuiltInPerpUrl) {
      window.sessionStorage.setItem(KEY_BUILT_IN_PERP_STATUS, 'true');
    }
  }

  isBuiltInPerp() {
    return Boolean(
      this.isBuiltInPerpUrl() || window.sessionStorage.getItem(KEY_BUILT_IN_PERP_STATUS),
    );
  }

  async waitBuilderFeeApproved({ jsonBody, url }: { jsonBody: unknown; url: string | undefined }) {
    if (!url || !jsonBody) {
      return;
    }
    const placeOrderActionJsonBody = jsonBody as
      | {
          action: {
            type: 'cancel' | 'order';
          };
          signature: string;
          nonce: string;
        }
      | undefined;
    const isExchangePath = url?.includes('/exchange');
    const hasSignature = !!placeOrderActionJsonBody?.signature;
    const hasNonce = !!placeOrderActionJsonBody?.nonce;
    const isOrderAction = placeOrderActionJsonBody?.action?.type === 'order';
    const isPlaceOrderRequest = isExchangePath && hasSignature && hasNonce && isOrderAction;
    originalConsoleLog(
      'BuiltInPerpInjected>>>>isPlaceOrderRequest',
      isPlaceOrderRequest,
      url,
      jsonBody,
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const ethereum: ProviderEthereum = window?.$onekey?.ethereum as unknown as ProviderEthereum;
    if (
      isPlaceOrderRequest &&
      ethereum &&
      ethereum?.request &&
      ethereum?.selectedAddress &&
      ethereum?.isOneKey &&
      ethereum?.chainId
    ) {
      // ethereum.chainId
      const result = await ethereum?.request?.({
        method: 'hl_checkUserStatus',
        params: [
          {
            userAddress: ethereum?.selectedAddress,
            chainId: ethereum?.chainId,
          },
        ],
      });
      originalConsoleLog('BuiltInPerpInjected___hl_checkUserStatus>>>>result', result);
    }
  }

  modifyFetch() {
    const originalFetch = window.fetch;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const isPostMethod =
        init?.method?.toLowerCase() === 'post' ||
        (!init?.method &&
          typeof input === 'object' &&
          'method' in input &&
          input.method?.toLowerCase() === 'post');

      if (isPostMethod) {
        const modifiedInit = { ...init };

        if (init?.body && typeof init.body === 'string') {
          let jsonBody: unknown;
          let url: string | undefined;
          let isValidJsonBody = false;

          try {
            url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
            jsonBody = JSON.parse(init.body);
            if (typeof jsonBody === 'object' && jsonBody !== null && !Array.isArray(jsonBody)) {
              // ethereum.selectedAddress
              Object.assign(jsonBody as Record<string, unknown>, ONEKEY_PERP_FIELD);
              modifiedInit.body = JSON.stringify(jsonBody);
              isValidJsonBody = true;
            }
          } catch (e) {
            // Not JSON, keep original body
          }

          if (isValidJsonBody) {
            await this.waitBuilderFeeApproved({
              jsonBody,
              url,
            });
          }
        }

        return originalFetch(input, modifiedInit);
      }

      return originalFetch(input, init);
    };
  }
}

export default {
  createInstance: () => {
    if (window.location.hostname === HYPERLIQUID_HOSTNAME) {
      return new BuiltInPerpInjected();
    }
    return undefined;
  },
};
