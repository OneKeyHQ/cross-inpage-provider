/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import type { ProviderEthereum } from '@onekeyfe/onekey-eth-provider';
import { isNumber, isString } from 'lodash-es';
import { hackConnectButton } from '../connectButtonHack/hackConnectButton';
import providersHubUtils from '../utils/providersHubUtils';
import { HYPERLIQUID_HOSTNAME } from './consts';
import {
  HyperliquidBuilderStore,
  IHyperliquidBuilderCustomSettings,
} from './HyperliquidBuilderStore';
import hyperLiquidDappDetecter from './hyperLiquidDappDetecter';

type IHyperliquidBuilderFeeConfig = {
  expectBuilderAddress: string;
  expectMaxBuilderFee: number;
  shouldModifyPlaceOrderPayload?: boolean;
  customLocalStorage?: Record<string, unknown>;
  customLocalStorageV2?: Record<
    string,
    {
      value: unknown;
      skipIfExists?: boolean;
    }
  >;
  customSettings?: IHyperliquidBuilderCustomSettings;
};

function getEthereum() {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const ethereum = window?.$onekey?.ethereum as unknown as ProviderEthereum | undefined;
  if (ethereum?.request && ethereum?.isOneKey) {
    return ethereum;
  }
  return undefined;
}

function saveBuilderFeeConfigToStorage({
  result,
  fromSource,
}: {
  result: IHyperliquidBuilderFeeConfig | undefined;
  fromSource: string;
}) {
  if (!hyperLiquidDappDetecter.isBuiltInHyperLiquidSite()) {
    return;
  }
  providersHubUtils.consoleLog(
    'BuiltInPerpInjected___saveBuilderFeeConfigToStorage>>>>result',
    result,
    fromSource,
  );
  if (result?.customLocalStorage) {
    try {
      Object.entries(result.customLocalStorage).forEach(([key, value]) => {
        try {
          if (isString(value) && value && key) {
            if (key === 'hyperliquid.locale-setting') {
              localStorage.setItem(key, value);
            } else {
              const currentValue = localStorage.getItem(key);
              if (currentValue === null || currentValue === undefined) {
                localStorage.setItem(key, value);
              }
            }
          }
        } catch (error) {
          console.error(error);
        }
      });
    } catch (error) {
      console.error(error);
    }
  }
  if (result?.customLocalStorageV2) {
    try {
      Object.entries(result.customLocalStorageV2).forEach(([key, valueInfo]) => {
        const { value, skipIfExists } = valueInfo || {};
        try {
          if (isString(value) && value && key) {
            if (skipIfExists) {
              const currentValue = localStorage.getItem(key);
              if (currentValue === null || currentValue === undefined) {
                localStorage.setItem(key, value);
              }
            } else {
              localStorage.setItem(key, value);
            }
          }
        } catch (error) {
          console.error(error);
        }
      });
    } catch (error) {
      console.error(error);
    }
  }
  if (result?.customSettings) {
    providersHubUtils.consoleLog(
      'BuiltInPerpInjected___saveBuilderFeeConfigToStorage>>>>result.customSettings22211',
      result.customSettings,
    );
    try {
      HyperliquidBuilderStore.customSettings = result.customSettings;
    } catch (error) {
      console.error(error);
    }
  }
  if (
    result?.expectBuilderAddress &&
    isNumber(result?.expectMaxBuilderFee) &&
    result?.expectMaxBuilderFee >= 0
  ) {
    // HyperliquidBuilderStore --> hijackReactUseContextMethod
    HyperliquidBuilderStore.updateBuilderInfo(
      result.expectBuilderAddress.toLowerCase(),
      result.expectMaxBuilderFee,
    );
    HyperliquidBuilderStore.storeUpdateByOneKeyWallet = true;

    // do not modify localStorage, otherwise the hyperliquid page will not work properly when the onekey plugin is disabled
    localStorage.removeItem('hyperliquid.order_builder_info');
    // localStorage.setItem(
    //   'hyperliquid.order_builder_info',
    //   JSON.stringify({
    //     builderAddress: result.expectBuilderAddress.toLowerCase(),
    //     feeRate: result.expectMaxBuilderFee / 1e5,
    //   }),
    // );
  } else if (!result?.expectBuilderAddress || result?.expectMaxBuilderFee < 0) {
    localStorage.removeItem('hyperliquid.order_builder_info');
    HyperliquidBuilderStore.storeUpdateByOneKeyWallet = false;
  }
}

function registerBuilderFeeUpdateEvents(ethereum: ProviderEthereum | undefined) {
  if (!hyperLiquidDappDetecter.isBuiltInHyperLiquidSite()) {
    return;
  }

  ethereum?.on('message', (payload, p1, p2) => {
    try {
      const { type: method, data: params } = (payload as { type: string; data: unknown }) || {};
      if (method === 'onekeyWalletEvents_builtInPerpConfigChanged') {
        const paramsInfo = params as {
          hyperliquidBuilderAddress: string;
          hyperliquidMaxBuilderFee: number;
        };
        saveBuilderFeeConfigToStorage({
          result: {
            expectBuilderAddress: paramsInfo.hyperliquidBuilderAddress,
            expectMaxBuilderFee: paramsInfo.hyperliquidMaxBuilderFee,
          },
          fromSource: 'onekeyWalletEvents_builtInPerpConfigChanged',
        });
      }
    } catch (error) {
      console.error(error);
    }
  });
}

function hackConnectionButton() {
  hackConnectButton({
    urls: [HYPERLIQUID_HOSTNAME],
    providers: [IInjectedProviderNames.ethereum],
    replaceMethod() {
      const customSettings = HyperliquidBuilderStore?.customSettings;

      const hideNavigationBar = () => {
        let navBarRightContainer: Element | null | undefined;

        if (customSettings?.hideNavBar ?? true) {
          const siteIcon =
            window?.document?.querySelectorAll?.('a[href="/trade"]>svg')?.[0]?.parentElement;
          const navBarItems = siteIcon?.nextElementSibling?.childNodes;
          navBarRightContainer = siteIcon?.nextElementSibling?.nextElementSibling;

          navBarItems?.forEach((item, index) => {
            try {
              const ele = item as HTMLElement;
              if (index >= 1) {
                const href = ele?.querySelector('a')?.getAttribute('href');
                if (ele && !href?.includes('/trade')) {
                  ele.style.display = 'none';
                }
              }
            } catch (error) {
              console.error(error);
            }
          });
        }

        if (customSettings?.hideNavBarConnectButton ?? false) {
          if (navBarRightContainer) {
            const button = navBarRightContainer.querySelector('button');
            if (button && button?.textContent?.toLowerCase()?.trim() === 'connect') {
              button.style.display = 'none';
            }
          }
        }
      };

      const hideNotOneKeyWalletConnectButton = () => {
        const buttons = Array.from(document?.querySelectorAll?.('div.modal button'));
        const oneKeyButton = buttons.find((button) =>
          button?.textContent?.toLowerCase()?.includes?.('onekey'),
        );
        const oneKeyButtonParent = oneKeyButton?.parentElement;
        const connectButtons = oneKeyButtonParent?.childNodes;
        connectButtons?.forEach((button) => {
          try {
            const ele = button as HTMLElement;
            if (
              ele &&
              ele !== oneKeyButton &&
              !ele.textContent?.toLowerCase()?.includes?.('onekey')
            ) {
              ele.style.display = 'none';
            }
          } catch (error) {
            console.error(error);
          }
        });
      };

      try {
        hideNavigationBar();
      } catch (error) {
        console.error(error);
      }
      try {
        if (customSettings?.hideNotOneKeyWalletConnectButton ?? true) {
          hideNotOneKeyWalletConnectButton();
        }
      } catch (error) {
        console.error(error);
      }
    },
  });
}

async function initHyperliquidBuilderFeeConfig(ethereum: ProviderEthereum | undefined) {
  if (!hyperLiquidDappDetecter.isBuiltInHyperLiquidSite()) {
    return;
  }

  hackConnectionButton();

  ethereum = ethereum || getEthereum();
  const isEthereumValid = !!ethereum && !!ethereum?.request && !!ethereum?.isOneKey;
  if (ethereum && isEthereumValid) {
    registerBuilderFeeUpdateEvents(ethereum);
    const response: Promise<IHyperliquidBuilderFeeConfig> = ethereum?.request?.({
      method: 'hl_getBuilderFeeConfig',
      params: [],
    });
    const result: IHyperliquidBuilderFeeConfig = await response;
    saveBuilderFeeConfigToStorage({
      result,
      fromSource: 'hl_getBuilderFeeConfig',
    });
  }
}

async function checkHyperliquidUserApproveStatus({
  shouldApproveBuilderFee,
}: {
  shouldApproveBuilderFee: boolean;
}) {
  if (!hyperLiquidDappDetecter.isBuiltInHyperLiquidSite()) {
    return;
  }
  const ethereum = getEthereum();
  if (
    ethereum &&
    ethereum?.request &&
    ethereum?.isOneKey &&
    ethereum?.selectedAddress &&
    ethereum?.chainId
  ) {
    // ethereum.chainId
    const result: IHyperliquidBuilderFeeConfig = await ethereum?.request?.({
      method: 'hl_checkUserStatus',
      params: [
        {
          userAddress: ethereum?.selectedAddress,
          chainId: ethereum?.chainId,
          shouldApproveBuilderFee,
        },
      ],
    });
    providersHubUtils.consoleLog('BuiltInPerpInjected___hl_checkUserStatus>>>>result', result);
    saveBuilderFeeConfigToStorage({
      result,
      fromSource: 'hl_checkUserStatus',
    });
  }
}

async function logHyperLiquidServerApiAction({ payload, error }: { payload: any; error?: any }) {
  if (!hyperLiquidDappDetecter.isBuiltInHyperLiquidSite()) {
    return Promise.resolve(undefined);
  }
  const ethereum = getEthereum();
  if (ethereum && ethereum?.request && ethereum?.isOneKey) {
    let errorMessage = '';
    if (error) {
      try {
        errorMessage = JSON.stringify(error);
      } catch (error) {
        console.error(error);
      }
    }
    void ethereum?.request({
      method: 'hl_logApiEvent',
      params: [
        {
          apiPayload: payload,
          userAddress: ethereum?.selectedAddress,
          chainId: ethereum?.chainId,
          errorMessage,
        },
      ],
    });
  }
  return Promise.resolve(undefined);
}

async function clearUserMaxBuilderFeeCache() {
  if (!hyperLiquidDappDetecter.isBuiltInHyperLiquidSite()) {
    return Promise.resolve(undefined);
  }
  const ethereum = getEthereum();
  if (ethereum && ethereum?.request && ethereum?.isOneKey) {
    void ethereum?.request({
      method: 'hl_clearUserBuilderFeeCache',
      params: [],
    });
  }
  return Promise.resolve(undefined);
}

export default {
  initHyperliquidBuilderFeeConfig,
  checkHyperliquidUserApproveStatus,
  logHyperLiquidServerApiAction,
  clearUserMaxBuilderFeeCache,
};
