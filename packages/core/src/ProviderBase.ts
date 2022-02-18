import EventEmitter from 'eventemitter3';
import isFunction from 'lodash/isFunction';

import { JsBridgeBase } from './JsBridgeBase';
import {
  IInjectedProviderNamesStrings,
  IJsonRpcResponse,
} from '@onekeyfe/cross-inpage-provider-types';
import siteMetadata from './siteMetadata';

export type ConsoleLike = Pick<Console, 'log' | 'warn' | 'error' | 'debug' | 'info' | 'trace'>;

export type IBridgeRequestCallback = (
  error: Error | null,
  result?: IJsonRpcResponse<unknown>
) => void;

export type IInpageProviderConfig = {
  bridge?: JsBridgeBase;
  logger?: ConsoleLike;
  maxEventListeners?: number;
  shouldSendMetadata?: boolean;
};

const fakeLogger: ConsoleLike = {
  log: () => undefined,
  warn: () => undefined,
  error: () => undefined,
  debug: () => undefined,
  info: () => undefined,
  trace: () => undefined,
};

export type ConnectWalletInfo = {
  walletInfo?: {
    version?: 'string';
    name?: 'string';
  };
  providerState?: unknown;
};

const METHODS = {
  wallet_getConnectWalletInfo: 'wallet_getConnectWalletInfo',
  wallet_sendSiteMetadata: 'wallet_sendSiteMetadata',
};

abstract class ProviderBase extends EventEmitter {
  protected constructor(config: IInpageProviderConfig) {
    super();
    if (!config.bridge) {
      throw new Error('ProviderBase init error: bridge required.');
    }
    this.config = config;
    this.bridge = config.bridge;
    this.logger = config.logger || fakeLogger;
    setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      this.bridge.attachProviderInstance(this as any);
    }, 0);
    if (config.shouldSendMetadata) {
      void this.sendSiteMetadata();
    }
  }

  async getConnectWalletInfo({ timeout = 3000 } = {}): Promise<ConnectWalletInfo | null> {
    // eslint-disable-next-line no-async-promise-executor,@typescript-eslint/no-misused-promises
    return new Promise(async (resolve, reject) => {
      const timer = setTimeout(() => {
        resolve(null);
      }, timeout);
      try {
        const result = (await this.bridgeRequest({
          method: METHODS.wallet_getConnectWalletInfo,
          params: [{ time: Date.now() }],
        })) as ConnectWalletInfo;
        if (result && result.walletInfo) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          window.$onekey = window.$onekey || {};
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          window.$onekey.walletInfo = result.walletInfo;
        }
        if (result && result.providerState) {
          resolve(result);
        } else {
          resolve(null);
        }
      } catch (err) {
        resolve(null);
      } finally {
        clearTimeout(timer);
      }
    });
  }

  public isOneKey = true;

  protected abstract providerName: IInjectedProviderNamesStrings;

  protected readonly config: IInpageProviderConfig;

  public readonly bridge: JsBridgeBase;

  public readonly logger: ConsoleLike = fakeLogger;

  async bridgeRequest(data: unknown, callback?: IBridgeRequestCallback) {
    let hasCallback = false;
    if (callback && isFunction(callback)) {
      hasCallback = true;
    }
    try {
      const resData = await this.bridge.request({
        data: data ?? {},
        scope: this.providerName,
      });
      const result = resData ? (resData.result as unknown) : undefined;
      if (callback && hasCallback) {
        callback(null, result);
      }
      return result;
    } catch (error) {
      if (callback && hasCallback) {
        callback(error);
      }
      throw error;
    }
  }

  async sendSiteMetadata() {
    const metadata = await siteMetadata.getSiteMetadata();
    return await this.bridgeRequest({
      method: METHODS.wallet_sendSiteMetadata,
      params: metadata,
    });
  }
}

export { ProviderBase };
