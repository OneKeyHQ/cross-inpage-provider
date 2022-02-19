import { IDebugLogger } from '@onekeyfe/cross-inpage-provider-types';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import createDebugAsync from './debug';
const noop = (...args: any[]) => undefined;

class FakeDebugLogger implements IDebugLogger {
  jsBridge = noop;
  extInjected = noop;
  extContentScripts = noop;
  _debug = {
    enable(config: string) {
      //noop
    },
  };
  _createDebugInstance(name: string) {
    // noop
  }
}

class AppDebugLogger extends FakeDebugLogger {
  constructor() {
    super();
    void createDebugAsync().then((debug) => (this._debug = debug));
  }
  _debug: any;

  _createDebugInstance(name: string) {
    if (name && this._debug) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
      this[name] = this._debug(name);
    }
  }
}

const fakeDebugLogger: IDebugLogger = new FakeDebugLogger();
const appDebugLogger: IDebugLogger = new AppDebugLogger();

export { fakeDebugLogger, appDebugLogger };
