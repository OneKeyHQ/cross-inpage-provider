import providersHubUtils from '../utils/providersHubUtils';
import { FIXED_ADDITIONAL_POST_BODY } from './consts';
import hijackMethods from './hijackMethods';
import hyperLiquidOneKeyWalletApi from './hyperLiquidOneKeyWalletApi';
import hyperLiquidApiUtils from './hyperLiquidServerApi';
import hyperLiquidDappDetect from './hyperliquidDappDetect';

const originalConsoleLog = providersHubUtils.consoleLog;

export class BuiltInPerpInjected {
  constructor() {
    this.init();
    originalConsoleLog('BuiltInPerpInjected>>>>done');
  }

  init() {
    if (hyperLiquidDappDetect.isBuiltInHyperLiquidSite()) {

      hijackMethods.run();

      this.modifyFetch();
    }
  }

  // do not remove this method, it is used by onekey-eth-provider
  isBuiltInPerp() {
    return hyperLiquidDappDetect.isBuiltInHyperLiquidSite();
  }

  modifyApiPostBody({
    originalBody,
    jsonBody,
    jsonBodyToUpdate,
  }: {
    originalBody: string;
    jsonBody: unknown;
    jsonBodyToUpdate: Record<string, unknown>;
  }) {
    if (Object.keys(jsonBodyToUpdate).length) {
      Object.assign(jsonBody as Record<string, unknown>, jsonBodyToUpdate);
      return JSON.stringify(jsonBody);
    }
    return originalBody;
  }

  async waitBuilderFeeApproved({
    jsonBody,
    url,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    jsonBodyToUpdate,
  }: {
    jsonBody: unknown;
    url: string | undefined;
    jsonBodyToUpdate: Record<string, unknown>;
  }) {
    if (!url || !jsonBody) {
      return;
    }

    const isPlaceOrderRequest = hyperLiquidApiUtils.isPlaceOrderRequest({ jsonBody, url });

    if (isPlaceOrderRequest) {
      await hyperLiquidOneKeyWalletApi.checkHyperliquidUserApproveStatus({
        shouldApproveBuilderFee: true,
      });
    }

    originalConsoleLog(
      'BuiltInPerpInjected>>>>isPlaceOrderRequest',
      isPlaceOrderRequest,
      url,
      jsonBody,
    );
  }

  // TODO move to hijackMethods
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
        if (init?.body && typeof init.body === 'string') {
          const modifiedInit = { ...init };
          let jsonBody: unknown;
          let url: string | undefined;
          let isValidJsonBody = false;

          try {
            url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
            jsonBody = JSON.parse(init.body);
            if (hyperLiquidApiUtils.isApiJsonBodyValid(jsonBody)) {
              isValidJsonBody = true;
            }
          } catch (e) {
            // Not JSON, keep original body
          }

          if (isValidJsonBody && jsonBody && url) {
            const jsonBodyToUpdate = {
              ...FIXED_ADDITIONAL_POST_BODY,
            };

            await this.waitBuilderFeeApproved({
              jsonBody,
              url,
              jsonBodyToUpdate,
            });

            modifiedInit.body = this.modifyApiPostBody({
              originalBody: init.body,
              jsonBody,
              jsonBodyToUpdate,
            });
            return originalFetch(input, modifiedInit);
          }
        }
      }

      return originalFetch(input, init);
    };
  }
}

export default {
  createInstance: () => {
    if (hyperLiquidDappDetect.isBuiltInHyperLiquidSite()) {
      return new BuiltInPerpInjected();
    }
    return undefined;
  },
};
