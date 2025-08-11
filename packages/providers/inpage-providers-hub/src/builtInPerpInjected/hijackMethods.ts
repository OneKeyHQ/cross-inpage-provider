/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import providersHubUtils from '../utils/providersHubUtils';
import { HyperliquidBuilderStore } from './HyperliquidBuilderStore';
import hyperLiquidDappDetect from './hyperliquidDappDetect';

/* eslint-disable @typescript-eslint/no-unsafe-return */
const originalConsoleLog = providersHubUtils.consoleLog;

function hijackReactUseContext() {
  // 存储原始的 useContext 函数引用
  const hijackedUseContexts = new WeakMap();

  Object.defineProperty(Object.prototype, 'useContext', {
    get() {
      return hijackedUseContexts.get(this);
    },

    set(value) {
      originalConsoleLog('hijackReactUseContext___set_useContext____value', value, this);

      // 检查是否是 React 的 useContext 函数
      if (typeof value === 'function') {
        const funcString = value.toString();

        /*
        t.useContext = function(e) {
            return O.current.useContext(e)
        }
        */
        // 检查函数特征，判断是否是 React 的 useContext
        if (funcString.includes('.current.useContext')) {
          // 判断 this 是 React 对象 like
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
            // 创建包装函数
            // @ts-ignore
            const wrappedUseContext = function (context) {
              // 调用原始函数
              // @ts-ignore
              const result = value.call(this, context);

              // 可以修改返回值
              // if (shouldModifyContext(context)) {
              //   return modifyContextValue(result);
              // }

              // hyperliquid.order_builder_info: undefined
              // hyperliquid.order_type: "limit"
              // hyperliquid.limit_order_tif: "Gtc"
              // hyperliquid.locale-setting: "en-US"
              if (
                result &&
                result?.['hyperliquid.order_type'] &&
                result?.['hyperliquid.limit_order_tif'] &&
                result?.['hyperliquid.locale-setting'] &&
                HyperliquidBuilderStore?.expectBuilderAddress &&
                HyperliquidBuilderStore?.expectMaxBuilderFee
              ) {
                // originalConsoleLog('useContext>>>>result', result);
                result['hyperliquid.order_builder_info'] = {
                  builderAddress: HyperliquidBuilderStore.expectBuilderAddress.toLowerCase(),
                  feeRate: HyperliquidBuilderStore.expectMaxBuilderFee / 1e5,
                };
              }

              return result;
            };

            // 保持原函数的一些属性
            Object.defineProperty(wrappedUseContext, 'name', {
              value: 'useContext',
              configurable: true,
            });

            // 存储包装后的函数
            hijackedUseContexts.set(this, wrappedUseContext);
            return;
          }
        }
      }

      // 不是目标函数，正常存储
      hijackedUseContexts.set(this, value);
    },

    configurable: true,
    enumerable: false,
  });
}

export default {
  run() {
    if (hyperLiquidDappDetect.isBuiltInHyperLiquidSite()) {
      hijackReactUseContext();
    }
  },
};
