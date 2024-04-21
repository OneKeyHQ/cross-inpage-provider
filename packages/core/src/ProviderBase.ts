/* eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/ban-ts-comment */
import { isFunction } from 'lodash-es';
import { CrossEventEmitter } from './CrossEventEmitter';

import { JsBridgeBase } from './JsBridgeBase';
import {
  IInjectedProviderNamesStrings,
  IJsonRpcResponse,
  ConsoleLike,
  IDebugLogger,
} from '@onekeyfe/cross-inpage-provider-types';
import siteMetadata from './siteMetadata';
import { fakeLogger, fakeDebugLogger, consoleErrorInDev } from './loggers';
import versionInfo from './versionInfo';
import { WALLET_INFO_LOACAL_KEY } from './consts';

export type IBridgeRequestCallback = (
  error: Error | null,
  result?: IJsonRpcResponse<unknown>,
) => void;

export type IInpageProviderConfig = {
  bridge?: JsBridgeBase;
  logger?: ConsoleLike | null;
  maxEventListeners?: number;
};

export type DebugLoggerConfig = {
  config: string;
  enabledKeys: string[];
};
export type ConnectWalletInfo = {
  debugLoggerConfig?: DebugLoggerConfig;
  walletInfo?: {
    version?: 'string';
    name?: 'string';
  };
  providerState: unknown;
};
export type IProviderBaseConnectionStatus = 'connected' | 'disconnected';

const METHODS = {
  wallet_getConnectWalletInfo: 'wallet_getConnectWalletInfo',
  wallet_sendSiteMetadata: 'wallet_sendSiteMetadata',
};

abstract class ProviderBase extends CrossEventEmitter {
  constructor(config: IInpageProviderConfig) {
    super();
    if (!config.bridge) {
      throw new Error('ProviderBase init error: bridge required.');
    }
    this.config = config;
    this.bridge = config.bridge;
    this.logger = config.logger || fakeLogger;

    // TODO init this.debugLogger first, and enable debug config after extension connect
    this.debugLogger = this.bridge?.debugLogger || fakeDebugLogger;
    this.bridge?.debugLogger?._attachExternalLogger(this.logger);
    setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      this.bridge.attachProviderInstance(this as any);
    }, 0);
    // call sendSiteMetadataDomReady/getConnectWalletInfo in ProviderPrivate, dont need here
    // void this.sendSiteMetadataDomReady();
    // void this.getConnectWalletInfo();
  }

  configDebugLogger(config: DebugLoggerConfig) {
    try {
      if (!config || !this.bridge.debugLogger) {
        return;
      }
      const debugLogger = this.bridge.debugLogger;
      (config.enabledKeys || []).forEach((key) => {
        debugLogger._createDebugInstance(key);
      });
      if (config.config) {
        debugLogger._debug.enable(config.config);
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      window.$onekey = window.$onekey || {};
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      window.$onekey.$debugLogger = debugLogger;
    } catch (error) {
      consoleErrorInDev('configDebugLogger ERROR:', error);
    }
  }

  async getConnectWalletInfo({ timeout = 3000 } = {}): Promise<ConnectWalletInfo | null> {
    // eslint-disable-next-line no-async-promise-executor,@typescript-eslint/no-misused-promises
    return new Promise(async (resolve, reject) => {
      const timer = setTimeout(() => {
        console.error(`getConnectWalletInfo timeout: ${timeout}`);
        resolve(null);
      }, timeout);
      try {
        const result = (await this.bridgeRequest({
          method: METHODS.wallet_getConnectWalletInfo,
          params: [{ time: Date.now() }],
        })) as ConnectWalletInfo;
        if (result) {
          result.providerState = result.providerState || {};
        }
        if (result && result.debugLoggerConfig) {
          this.configDebugLogger(result.debugLoggerConfig);
        }
        if (result && result.walletInfo) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          window.$onekey = window.$onekey || {};
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          window.$onekey.$walletInfo = result.walletInfo;
          try {
            localStorage.setItem(WALLET_INFO_LOACAL_KEY, JSON.stringify(result.walletInfo));
          } catch (e) {
            console.error(e);
          }
        }
        if (result) {
          resolve(result);
        } else {
          console.error('getConnectWalletInfo error: result=null');
          resolve(null);
        }
      } catch (err) {
        // TODO wallet not installed, timeout ERROR
        consoleErrorInDev('getConnectWalletInfo: ERROR', err);
        resolve(null);
      } finally {
        clearTimeout(timer);
      }
    });
  }

  public version: string = versionInfo.version;

  public isOneKey = true;

  protected abstract providerName: IInjectedProviderNamesStrings;

  protected readonly config: IInpageProviderConfig;

  public readonly bridge: JsBridgeBase;

  public debugLogger: IDebugLogger = fakeDebugLogger;

  public readonly logger: ConsoleLike = fakeLogger;

  async bridgeRequest(data: unknown, callback?: IBridgeRequestCallback) {
    let hasCallback = false;
    if (callback && isFunction(callback)) {
      hasCallback = true;
    }
    try {
      const payload = {
        data: data ?? {},
        scope: this.providerName,
      };
      this.debugLogger.providerBase('bridgeRequest:', payload, '\r\n -----> ', payload.data);
      const resData = await this.bridge.request(payload);

      if (resData) {
        // @ts-ignore
        resData.id = data?.id ?? resData.id ?? undefined;
        // @ts-ignore
        resData.jsonrpc = data?.jsonrpc ?? resData.jsonrpc ?? '2.0';
      }

      const result = resData ? (resData.result as unknown) : undefined;
      if (callback && hasCallback) {
        // callback with params: { id, result, jsonrpc }
        callback(null, resData);
      }
      this.debugLogger.providerBase(
        'bridgeRequest RETURN:',
        { req: payload, res: resData },
        '\r\n -----> ',
        payload.data,
        '\r\n -----> ',
        result,
      );
      return result;
    } catch (error) {
      if (callback && hasCallback) {
        callback(error);
      }
      throw error;
    }
  }

  public sendSiteMetadataDomReady() {
    if (document.readyState === 'complete') {
      void this.sendSiteMetadata();
    } else {
      const domContentLoadedHandler = () => {
        void this.sendSiteMetadata();
        window.removeEventListener('DOMContentLoaded', domContentLoadedHandler);
      };
      window.addEventListener('DOMContentLoaded', domContentLoadedHandler);
    }
  }

  async sendSiteMetadata() {
    const metadata = await siteMetadata.getSiteMetadata();

    return await this.bridgeRequest({
      method: METHODS.wallet_sendSiteMetadata,
      params: metadata,
    });
  }

  connectionStatus?: IProviderBaseConnectionStatus;
  isConnectionStatusChanged(newStatus: IProviderBaseConnectionStatus): boolean {
    return this.connectionStatus === undefined || newStatus !== this.connectionStatus;
  }
  isAccountsChanged(...args: any[]): boolean {
    throw new Error('isAccountsChanged not implemented');
  }
  isNetworkChanged(...args: any[]): boolean {
    throw new Error('isNetworkChanged not implemented');
  }
}

export { ProviderBase };
