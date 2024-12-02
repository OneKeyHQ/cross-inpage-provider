/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ConsoleLike, IDebugLogger } from '@onekeyfe/cross-inpage-provider-types';
// @ts-ignore
import { DEBUG_LOGGER_STORAGE_KEY } from './consts';
import { CrossEventEmitter } from './CrossEventEmitter';
import createDebugAsync from './debug';

// enable debugLogger:
//    localStorage.setItem('$$ONEKEY_DEBUG_LOGGER', '*');

function consoleErrorInDev(...args: unknown[]) {
  const loggerConfig =
    typeof localStorage !== 'undefined' && localStorage.getItem(DEBUG_LOGGER_STORAGE_KEY);
  if (process.env.NODE_ENV !== 'production' || loggerConfig) {
    console.error(...args);
  }
}

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

enum loggerNames {
  jsBridge = 'jsBridge',
  providerBase = 'providerBase',
  extInjected = 'extInjected',
  extContentScripts = 'extContentScripts',
  webview = 'webview',
  desktopInjected = 'desktopInjected',
  ethereum = 'ethereum',
}

class FakeDebugLogger extends CrossEventEmitter implements IDebugLogger {
  constructor() {
    super();
    this.initExternalLogInstances();
    this.setMaxListeners(9999);
  }

  jsBridge = (...args: any[]) => null;
  providerBase = (...args: any[]) => null;
  extInjected = (...args: any[]) => null;
  extContentScripts = (...args: any[]) => null;
  webview = (...args: any[]) => null;
  desktopInjected = (...args: any[]) => null;
  ethereum = (...args: any[]) => null;

  initExternalLogInstances() {
    Object.keys(loggerNames).forEach((name) => {
      // @ts-ignore
      this[name] = this._createExternalLog(name);
    });
  }

  isFaked = true;

  _debug = {
    enable(config: string) {
      //noop
    },
  };
  isDebugReady() {
    return this._debug && typeof this._debug === 'function';
  }
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
      this.once('debugReady', () => {
        if (!this.isFaked) {
          // @ts-ignore
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          this[name]?.(...args);
        }
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return this._externalLogger?.log?.(`${name} >>> `, ...args);
    };
}

class AppDebugLogger extends FakeDebugLogger {
  constructor() {
    super();
    // TODO createDebugSync
    void createDebugAsync().then((debug) => {
      this._debug = debug;
      this.isFaked = false;
      this.initDebugInstances();
      this.emit('debugReady');
    });
  }

  isFaked = false;

  initDebugInstances() {
    if (this.isDebugReady()) {
      Object.keys(loggerNames).forEach((name) => {
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
        this[name] = this._debug(name);
      });
    }
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

// TODO merge FakeDebugLogger and AppDebugLogger to single class
const fakeDebugLogger: IDebugLogger = new FakeDebugLogger();
const appDebugLogger: IDebugLogger = new AppDebugLogger();

export { appDebugLogger, consoleErrorInDev, fakeDebugLogger, fakeLogger };
