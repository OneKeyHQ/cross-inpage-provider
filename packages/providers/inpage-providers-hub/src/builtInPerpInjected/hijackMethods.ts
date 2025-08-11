/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import providersHubUtils from '../utils/providersHubUtils';
import { HyperliquidBuilderStore } from './HyperliquidBuilderStore';
import hyperLiquidDappDetecter from './hyperLiquidDappDetecter';
import { isNumber } from 'lodash-es';

/* eslint-disable @typescript-eslint/no-unsafe-return */
const originalConsoleLog = providersHubUtils.consoleLog;

function hijackReactUseContext() {
  const hijackedUseContexts = new WeakMap();

  Object.defineProperty(Object.prototype, 'useContext', {
    get() {
      return hijackedUseContexts.get(this);
    },

    set(value) {
      originalConsoleLog('hijackReactUseContext___set_useContext____value', value, this);

      if (typeof value === 'function') {
        const funcString = value.toString();

        /*
        t.useContext = function(e) {
            return O.current.useContext(e)
        }
        */
        if (funcString.includes('.current.useContext')) {
          const isReactLike =
            this &&
            typeof this === 'object' &&
            [
              'useCallback',
              'memo',
              'createRef',
              'createContext',
              'createElement',
              'cloneElement',
              'Children',
              'Component',
              'PureComponent',
            ].every((key) => key in this);

          if (isReactLike) {
            // @ts-ignore
            const wrappedUseContext = function (context) {
              // @ts-ignore
              const result = value.call(this, context);

              // hyperliquid.order_builder_info: undefined
              // hyperliquid.order_type: "limit"
              // hyperliquid.limit_order_tif: "Gtc"
              // hyperliquid.locale-setting: "en-US"
              if (
                result &&
                result?.['hyperliquid.order_type'] &&
                result?.['hyperliquid.limit_order_tif'] &&
                result?.['hyperliquid.locale-setting'] &&
                HyperliquidBuilderStore?.storeUpdateByOneKey &&
                HyperliquidBuilderStore?.expectBuilderAddress &&
                isNumber(HyperliquidBuilderStore?.expectMaxBuilderFee) &&
                HyperliquidBuilderStore?.expectMaxBuilderFee >= 0
              ) {
                // originalConsoleLog('useContext>>>>result', result);
                result['hyperliquid.order_builder_info'] = {
                  builderAddress: HyperliquidBuilderStore?.expectBuilderAddress?.toLowerCase?.(),
                  feeRate: HyperliquidBuilderStore?.expectMaxBuilderFee / 1e5,
                };
              }

              return result;
            };

            Object.defineProperty(wrappedUseContext, 'name', {
              value: 'useContext',
              configurable: true,
            });

            hijackedUseContexts.set(this, wrappedUseContext);
            return;
          }
        }
      }

      hijackedUseContexts.set(this, value);
    },

    configurable: true,
    enumerable: false,
  });
}

export default {
  run() {
    if (hyperLiquidDappDetecter.isBuiltInHyperLiquidSite()) {
      hijackReactUseContext();
    }
  },
};
