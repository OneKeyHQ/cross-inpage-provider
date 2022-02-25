/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { JsBridgeBase } from './JsBridgeBase';
import { DEBUG_LOGGER_STORAGE_KEY } from './consts';

function fixGlobalShim() {
  // FIX errors in ReactNative
  //    ReferenceError: Can't find variable: global
  // @ts-ignore
  window.global = window.global || window || window.globalThis;

  // @ts-ignore
  window.global = window.global || window || window.globalThis;
}

function injectJsBridge(bridgeCreator: () => JsBridgeBase | unknown): JsBridgeBase {
  fixGlobalShim();

  if (!window?.$onekey?.jsBridge) {
    window.$onekey = window.$onekey || {};
    window.$onekey.jsBridge = bridgeCreator();
    if (typeof localStorage !== 'undefined' && localStorage.getItem(DEBUG_LOGGER_STORAGE_KEY)) {
      console.log('===== jsBridge injected success! >>>>> ', performance.now());
    }
  }

  return window.$onekey.jsBridge as JsBridgeBase;
}

export { injectJsBridge };
