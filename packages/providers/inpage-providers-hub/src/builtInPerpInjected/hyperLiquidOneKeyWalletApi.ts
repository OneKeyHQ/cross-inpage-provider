/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { ProviderEthereum } from '@onekeyfe/onekey-eth-provider';
import { isNumber } from 'lodash-es';
import providersHubUtils from '../utils/providersHubUtils';
import { HyperliquidBuilderStore } from './HyperliquidBuilderStore';
import hyperLiquidDappDetecter from './hyperLiquidDappDetecter';

type IHyperliquidBuilderFeeConfig = {
  expectBuilderAddress: string;
  expectMaxBuilderFee: number;
  shouldModifyPlaceOrderPayload?: boolean;
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
    HyperliquidBuilderStore.storeUpdateByOneKey = true;
    
    // do not modify localStorage, otherwise the hyperliquid page will not work properly when the onekey plugin is disabled
    // localStorage.setItem(
    //   'hyperliquid.order_builder_info',
    //   JSON.stringify({
    //     builderAddress: result.expectBuilderAddress.toLowerCase(),
    //     feeRate: result.expectMaxBuilderFee / 1e5,
    //   }),
    // );
  }
}

function registerBuilderFeeUpdateEvents(ethereum: ProviderEthereum | undefined) {
  if (!hyperLiquidDappDetecter.isBuiltInHyperLiquidSite()) {
    return;
  }

  ethereum?.on('message', (payload, p1, p2) => {
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
  });
}

async function initHyperliquidBuilderFeeConfig(ethereum: ProviderEthereum | undefined) {
  if (!hyperLiquidDappDetecter.isBuiltInHyperLiquidSite()) {
    return;
  }

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

async function logHyperLiquidServerApiAction({ payload }: { payload: any }) {
  if (!hyperLiquidDappDetecter.isBuiltInHyperLiquidSite()) {
    return;
  }
  const ethereum = getEthereum();
  if (ethereum && ethereum?.request && ethereum?.isOneKey) {
    void ethereum?.request({
      method: 'hl_logApiEvent',
      params: [{ apiPayload: payload }],
    });
  }
}

export default {
  initHyperliquidBuilderFeeConfig,
  checkHyperliquidUserApproveStatus,
  logHyperLiquidServerApiAction,
};
