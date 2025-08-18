import { merge } from 'lodash';
import providersHubUtils from '../utils/providersHubUtils';
import { FIXED_ADDITIONAL_POST_BODY } from './consts';
import hijackMethods from './hijackMethods';
import hyperLiquidDappDetecter from './hyperLiquidDappDetecter';
import hyperLiquidOneKeyWalletApi from './hyperLiquidOneKeyWalletApi';
import hyperLiquidApiUtils from './hyperLiquidServerApi';

const originalConsoleLog = providersHubUtils.consoleLog;

export class BuiltInPerpInjected {
  constructor() {
    this.init();
    originalConsoleLog('BuiltInPerpInjected>>>>done');
  }

  init() {
    if (hyperLiquidDappDetecter.isBuiltInHyperLiquidSite()) {
      hijackMethods.run();

      this.modifyFetch();
    }
  }

  // do not remove this method, it is used by onekey-eth-provider
  isBuiltInPerp() {
    return hyperLiquidDappDetecter.isBuiltInHyperLiquidSite();
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
      merge(jsonBody as Record<string, unknown>, jsonBodyToUpdate);
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
      // TODO remove
      // merge(jsonBodyToUpdate, {
      //   action: {
      //     builder: {
      //       f: 9999,
      //     },
      //   },
      // });
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

            const isPlaceOrderRequest = hyperLiquidApiUtils.isPlaceOrderRequest({ jsonBody, url });

            if (isPlaceOrderRequest) {
              await this.waitBuilderFeeApproved({
                jsonBody,
                url,
                jsonBodyToUpdate,
              });
            }

            modifiedInit.body = this.modifyApiPostBody({
              originalBody: init.body,
              jsonBody,
              jsonBodyToUpdate,
            });
            try {
              const result = await originalFetch(input, modifiedInit);
              try {
                if (isPlaceOrderRequest) {
                  const resData = (await result.clone().json()) as
                    | {
                        response: string;
                        status: 'err' | 'ok'; // success or err
                      }
                    | undefined;
                  if (resData?.status === 'err') {
                    originalConsoleLog('BuiltInPerpInjected__PlaceOrderRequest__Error1', resData);
                    void hyperLiquidOneKeyWalletApi.clearUserMaxBuilderFeeCache();
                    void hyperLiquidOneKeyWalletApi.logHyperLiquidServerApiAction({
                      payload: jsonBody,
                      error: resData,
                    });
                  }
                  /*
                    {
                        "status": "ok",
                        "response": {
                            "type": "order",
                            "data": {
                                "statuses": [
                                    {
                                        "resting": {
                                            "oid": 133956942251
                                        }
                                    }
                                ]
                            }
                        }
                    }
                  */
                  if (resData?.status === 'ok') {
                    originalConsoleLog('BuiltInPerpInjected__PlaceOrderRequest__Success', resData);
                    void hyperLiquidOneKeyWalletApi.logHyperLiquidServerApiAction({
                      payload: jsonBody,
                    });
                  }
                }
              } catch (eeee) {
                // ignore
                originalConsoleLog('BuiltInPerpInjected__PlaceOrderRequest__Error2', eeee);
              }
              return result;
            } catch (error) {
              if (isPlaceOrderRequest) {
                originalConsoleLog('BuiltInPerpInjected__PlaceOrderRequest__Error3', error);
              }
              throw error;
            }
          }
        }
      }

      return originalFetch(input, init);
    };
  }
}

export default {
  createInstance: () => {
    try {
      if (hyperLiquidDappDetecter.isBuiltInHyperLiquidSite()) {
        return new BuiltInPerpInjected();
      }
      return undefined;
    } catch (error) {
      originalConsoleLog('BuiltInPerpInjected__createInstance__Error', error);
      return undefined;
    }
  },
};
