/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { JsBridgeBase } from './JsBridgeBase';
import { commonLogger } from './loggerConsole';

// function fixGlobalShim() {
//   // FIX errors in ReactNative
//   //    ReferenceError: Can't find variable: global
//   // @ts-ignore
//   window.global = window.global || window || window.globalThis;

//   // @ts-ignore
//   window.global = window.global || window || window.globalThis;
// }

function injectJsBridge(bridgeCreator: () => JsBridgeBase | unknown): JsBridgeBase {
  // remove fixGlobalShim,
  // because fixGlobalShim make some website not work properly
  //  make cloudfare dead loop and make zhihu.com search functionally down
  // fixGlobalShim();

  if (!window?.$onekey?.jsBridge) {
    window.$onekey = window.$onekey || {};
    window.$onekey.jsBridge = bridgeCreator();
    commonLogger.debug('JsBridge injected success!', performance.now());
  }

  return window.$onekey.jsBridge as JsBridgeBase;
}

export { injectJsBridge };
