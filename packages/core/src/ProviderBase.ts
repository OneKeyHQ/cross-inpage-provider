import EventEmitter from 'eventemitter3';
import isFunction from 'lodash/isFunction';

import { JsBridgeBase } from './JsBridgeBase';
import { IInjectedProviderNamesStrings, IJsonRpcResponse } from '@onekeyfe/cross-inpage-provider-types';

export type ConsoleLike = Pick<Console, 'log' | 'warn' | 'error' | 'debug' | 'info' | 'trace'>;

export type IBridgeRequestCallback = (error: Error | null, result?: IJsonRpcResponse<unknown>) => void;

export type IInpageProviderConfig = {
  bridge?: JsBridgeBase;
  logger?: ConsoleLike;
  maxEventListeners?: number;
  shouldSendMetadata?: boolean;
};

// TODO check extension connection ping/pong, get extension meta (version, vendor, bridgeVersion)
abstract class ProviderBase extends EventEmitter {
  constructor(config: IInpageProviderConfig) {
    super();
    if(!config.bridge){
      throw new Error('ProviderBase init error: bridge required')
    }
    this.config = config;
    this.bridge = config.bridge;
    // TODO logger shouldSendMetadata in ProviderBase
    setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      this.bridge.attachProviderInstance(this as any);
    }, 0);
  }

  // TODO ping/_isBridgeConnected , metamask_sendDomainMetadata method auto call

  public events = new EventEmitter();

  public isOneKey = true;

  protected abstract providerName: IInjectedProviderNamesStrings;

  protected readonly config: IInpageProviderConfig;

  public readonly bridge: JsBridgeBase;

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
}

export { ProviderBase };
