import { IDebugLogger } from '@onekeyfe/cross-inpage-provider-types';
const noop = (...args: any[]) => undefined;
const fakeDebugLogger: IDebugLogger = {
  jsBridge: noop,
  extInjected: noop,
  extContentScripts: noop,
};
export { fakeDebugLogger };
