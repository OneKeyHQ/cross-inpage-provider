import { IDebugLogger, ConsoleLike } from '@onekeyfe/cross-inpage-provider-types';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import createDebugAsync from './debug';

const fakeLogger: ConsoleLike = {
  log: (...args: any[]) => undefined,
  warn: (...args: any[]) => undefined,
  error: (...args: any[]) => undefined,
  debug: (...args: any[]) => undefined,
  info: (...args: any[]) => undefined,
  trace: (...args: any[]) => undefined,
};

class FakeDebugLogger implements IDebugLogger {
  _debug = {
    enable(config: string) {
      //noop
    },
  };
  _externalLogger = fakeLogger;
  _attachExternalLogger(logger: ConsoleLike) {
    if (logger) {
      this._externalLogger = logger;
    }
  }
  _createDebugInstance(name: string) {
    // noop
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  _callExternalLog = (...args: any[]) => this._externalLogger?.log(...args);

  jsBridge = this._callExternalLog;
  providerBase = this._callExternalLog;
  extInjected = this._callExternalLog;
  extContentScripts = this._callExternalLog;
}

class AppDebugLogger extends FakeDebugLogger {
  constructor() {
    super();
    void createDebugAsync().then((debug) => (this._debug = debug));
  }
  _debug: any;

  _createDebugInstance(name: string) {
    if (name && this._debug && typeof this._debug === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
      const _instance = this._debug(name);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
      this[name] = (...args: any[]) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        _instance(...args);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        this._externalLogger?.log(...args);
      };
    }
  }
}

const fakeDebugLogger: IDebugLogger = new FakeDebugLogger();
const appDebugLogger: IDebugLogger = new AppDebugLogger();

export { fakeDebugLogger, appDebugLogger, fakeLogger };
