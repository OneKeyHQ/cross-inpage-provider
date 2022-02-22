/* eslint-disable @typescript-eslint/ban-ts-comment */
import { IDebugLogger, ConsoleLike } from '@onekeyfe/cross-inpage-provider-types';
// @ts-ignore
import createDebugAsync from './debug';

// enable debugLogger:
//    localStorage.setItem('$$ONEKEY_DEBUG_LOGGER', '*');

const fakeLogger: ConsoleLike = {
  // @ts-ignore
  _isFakeLogger: true,
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

  _createExternalLog =
    (name: string) =>
    (...args: any[]) => {
      const _logger = this._externalLogger;
      if (_logger) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return _logger.log(name, ...args);
      }
    };

  jsBridge = this._createExternalLog('jsBridge >>');
  providerBase = this._createExternalLog('providerBase >>');
  extInjected = this._createExternalLog('extInjected >>');
  extContentScripts = this._createExternalLog('extContentScripts >>');
}

class AppDebugLogger extends FakeDebugLogger {
  constructor() {
    super();
    void createDebugAsync().then((debug) => (this._debug = debug));
  }
  _debug: any;

  _debugInstanceCreatedMap: Record<string, boolean> = {};

  _createDebugInstance(name: string) {
    if (this._debugInstanceCreatedMap[name]) {
      return;
    }
    this._debugInstanceCreatedMap[name] = true;
    if (name && this._debug && typeof this._debug === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
      const _debugLog = this._debug(name) as (...args: any[]) => any;
      // @ts-ignore
      const _originLog = this[name] as (...args: any[]) => any;
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
      this[name] = (...args: any[]) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        _debugLog(...args);
        if (_originLog && typeof _originLog === 'function') {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          _originLog(...args);
        }
      };
    }
  }
}

const fakeDebugLogger: IDebugLogger = new FakeDebugLogger();
const appDebugLogger: IDebugLogger = new AppDebugLogger();

export { fakeDebugLogger, appDebugLogger, fakeLogger };
