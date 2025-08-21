/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import providersHubUtils from '../utils/providersHubUtils';
import { HyperliquidBuilderStore } from './HyperliquidBuilderStore';
import hyperLiquidDappDetecter from './hyperLiquidDappDetecter';

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
                result?.['hyperliquid.locale-setting']
              ) {
                const builderInfo = HyperliquidBuilderStore?.getAvailableBuilderInfo();

                if (builderInfo) {
                  // originalConsoleLog('useContext>>>>result', result);
                  result['hyperliquid.order_builder_info'] = {
                    builderAddress: builderInfo.address,
                    feeRate: builderInfo.fee / 1e5,
                  };
                }
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

type HyperLiquidOrderObject = {
  grouping: string;
  orders: {
    a: string;
    b: string;
    p: string;
    r: string;
  }[];
  type: string;
  builder?: {
    b: string;
    f: number;
  };
};

function isHyperLiquidObjectLike(obj: HyperLiquidOrderObject | undefined): boolean {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const requiredFields = ['grouping', 'orders', 'type'];
  const hasAllRequiredFields = requiredFields.every((field) =>
    Object.prototype.hasOwnProperty.call(obj, field),
  );

  if (!hasAllRequiredFields) {
    return false;
  }

  return Boolean(
    typeof obj.grouping === 'string' &&
      obj.grouping === 'na' &&
      Array.isArray(obj.orders) &&
      obj.orders.length > 0 &&
      Object.prototype.hasOwnProperty.call(obj.orders[0], 'a') &&
      Object.prototype.hasOwnProperty.call(obj.orders[0], 'b') &&
      Object.prototype.hasOwnProperty.call(obj.orders[0], 'p') &&
      Object.prototype.hasOwnProperty.call(obj.orders[0], 'r') &&
      Object.prototype.hasOwnProperty.call(obj.orders[0], 's') &&
      Object.prototype.hasOwnProperty.call(obj.orders[0], 't') &&
      typeof obj.type === 'string' &&
      obj.type === 'order',
  );
}

function hijackObjectKeys() {
  const originalObjectKeys = Object.keys;

  Object.keys = function (obj: object) {
    try {
      if (obj && isHyperLiquidObjectLike(obj as HyperLiquidOrderObject) === true) {
        const builderInfo = HyperliquidBuilderStore?.getAvailableBuilderInfo();
        if (builderInfo) {
          // "builder":{"b":"0x11111","f":35}
          (obj as HyperLiquidOrderObject).builder = {
            b: builderInfo.address,
            f: builderInfo.fee,
          };
        }
      }
    } catch (e) {
      originalConsoleLog('hijackObjectKeys____error', e);
    }
    return originalObjectKeys(obj);
  };
}

export default {
  run() {
    if (hyperLiquidDappDetecter.isBuiltInHyperLiquidSite()) {
      hijackReactUseContext();
      hijackObjectKeys();
    }
  },
};
