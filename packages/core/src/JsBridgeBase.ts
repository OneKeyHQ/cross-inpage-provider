import EventEmitter from 'eventemitter3';
import isPlainObject from 'lodash/isPlainObject';
import isString from 'lodash/isString';
import { appDebugLogger, consoleErrorInDev } from './loggers';

import {
  IInjectedProviderNamesStrings,
  IJsBridgeCallback,
  IJsBridgeConfig,
  IJsBridgeMessagePayload,
  IJsBridgeMessageTypes,
  IJsonRpcResponse,
  IDebugLogger,
} from '@onekeyfe/cross-inpage-provider-types';
import { web3Errors } from '@onekeyfe/cross-inpage-provider-errors';
import versionInfo from './versionInfo';

function isLegacyExtMessage(payload: unknown): boolean {
  const payloadObj = payload as { name: string };
  return (
    Boolean(payloadObj.name) &&
    ['onekey-provider-eth', 'onekey-provider-cfx', 'publicConfig'].includes(payloadObj.name)
  );
}

type IErrorInfo = {
  code?: string | number;
  message?: string;
  stack?: string;
  data?: any;
};

const BRIDGE_EVENTS = {
  message: 'message',
  error: 'error',
};

abstract class JsBridgeBase extends EventEmitter {
  protected constructor(config: IJsBridgeConfig = {}) {
    super();
    this.config = config;
    this.callbacksExpireTimeout = config.timeout ?? 60 * 1000;
    this.debugLogger = config.debugLogger || appDebugLogger;
    this.sendAsString = config.sendAsString ?? this.sendAsString;
    if (this.config.receiveHandler) {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      this.on(BRIDGE_EVENTS.message, this.globalOnMessage);
    }
    this.on(BRIDGE_EVENTS.error, (error) => {
      consoleErrorInDev('JsBridge ERROR: ', error);
    });
    this.rejectExpiredCallbacks();
  }

  protected isExtUi = false;

  protected isInjected = false;

  protected sendAsString = true;

  public globalOnMessageEnabled = true;

  public providersHub: Record<string, any[]> = {
    // name: []
  };

  public attachProviderInstance(provider: { providerName: string }) {
    const name = provider.providerName;
    if (name) {
      this.providersHub[name] = this.providersHub[name] ?? [];
      this.providersHub[name].push(provider);
    }
  }

  // Only handle type=REQUEST messages, type=RESPONSE message will be ignored
  private globalOnMessage = async (message: IJsBridgeMessagePayload) => {
    try {
      if (this.config.receiveHandler && this.globalOnMessageEnabled) {
        const returnValue: unknown = await this.config.receiveHandler(message, this);
        if (message.id) {
          this.response({
            id: message.id,
            scope: message.scope,
            remoteId: message.remoteId,
            data: returnValue,
          });
        }
      }
    } catch (error) {
      if (message.id && message.type === IJsBridgeMessageTypes.REQUEST) {
        this.responseError({
          id: message.id,
          scope: message.scope,
          remoteId: message.remoteId,
          error,
        });
      }
      this.emit(BRIDGE_EVENTS.error, error);
    } finally {
      // noop
    }
  };

  public version: string = versionInfo.version;

  public remoteInfo: {
    origin?: string;
    remoteId?: string | number | null;
  } = {
    origin: '',
    remoteId: '',
  };

  private config: IJsBridgeConfig;

  private readonly callbacksExpireTimeout: number;

  public debugLogger: IDebugLogger = appDebugLogger;

  private callbacks: Array<IJsBridgeCallback> = [];

  private callbackId = 1;

  private createCallbackId(): number {
    this.callbackId += 1;
    return this.callbackId;
  }

  private createPayload(
    payload: IJsBridgeMessagePayload,
    {
      resolve,
      reject,
    }: {
      resolve?: (value: unknown) => void;
      reject?: (value: unknown) => void;
    },
  ) {
    const { id, type } = payload;
    if (resolve && reject && id && type === IJsBridgeMessageTypes.REQUEST) {
      if (this.callbacks[id]) {
        // TODO custom error
        throw new Error(`JsBridge ERROR: callback exists, id=${id}`);
      }
      this.callbacks[id] = { id, resolve, reject, created: Date.now() };
    }

    // convert to plain error object which can be stringify
    if (payload.error) {
      const errorInfo = payload.error as IErrorInfo;
      payload.error = {
        code: errorInfo.code,
        message: errorInfo.message,
        data: errorInfo.data as unknown,
        stack: errorInfo.stack,
      };
    }
    // delete resolve, reject function which can not be send as string
    delete payload?.resolve;
    delete payload?.reject;

    return payload;
  }

  private send({ type, data, error, id, remoteId, sync = false, scope }: IJsBridgeMessagePayload) {
    const executor = (resolve?: (value: unknown) => void, reject?: (value: unknown) => void) => {
      // TODO check resolve when calling without await
      // eslint-disable-next-line @typescript-eslint/naming-convention
      let _id = id;
      // sendSync without Promise cache
      if (!sync && type === IJsBridgeMessageTypes.REQUEST) {
        _id = this.createCallbackId();
      }
      try {
        const payload = this.createPayload(
          {
            id: _id,
            data,
            error,
            type,
            origin: global?.location?.origin || '',
            remoteId,
            scope,
          },
          { resolve, reject },
        );
        let payloadToSend: unknown = payload;
        if (this.sendAsString) {
          payloadToSend = JSON.stringify(payload);
        }
        this.debugLogger.jsBridge('send', payload, '\r\n ------> ', payload.data);
        this.sendPayload(payloadToSend as string);
      } catch (error) {
        if (_id) {
          this.rejectCallback(_id, error);
        } else {
          this.emit(BRIDGE_EVENTS.error, error);
        }
      }
    };
    if (sync) {
      executor();
      void 0;
    } else {
      return new Promise(executor) as Promise<IJsonRpcResponse<unknown>>;
    }
  }

  rejectCallback(id: number | string, error: unknown) {
    this.processCallback({
      method: 'reject',
      id,
      error,
    });
  }

  resolveCallback(id: number | string, data?: unknown) {
    this.processCallback({
      method: 'resolve',
      id,
      data,
    });
  }

  processCallback({
    method,
    id,
    data,
    error,
  }: {
    method: 'resolve' | 'reject';
    id: number | string;
    data?: unknown;
    error?: unknown;
  }) {
    const callbackInfo = this.callbacks[id as number];
    if (callbackInfo) {
      if (method === 'reject') {
        if (callbackInfo.reject) {
          callbackInfo.reject(error);
        }
        this.emit(BRIDGE_EVENTS.error, error);
      }
      if (method === 'resolve') {
        if (callbackInfo.resolve) {
          callbackInfo.resolve(data);
        }
      }
      this.clearCallbackCache(id);
    }
  }

  rejectExpiredCallbacks() {
    if (!this.callbacksExpireTimeout) {
      return;
    }
    const now = Date.now();
    // eslint-disable-next-line @typescript-eslint/no-for-in-array
    for (const id in this.callbacks) {
      const callbackInfo = this.callbacks[id];
      if (callbackInfo && callbackInfo.created) {
        if (now - callbackInfo.created > this.callbacksExpireTimeout) {
          const error = web3Errors.provider.requestTimeout();
          this.rejectCallback(id, error);
        }
      }
    }
    setTimeout(() => {
      this.rejectExpiredCallbacks();
    }, this.callbacksExpireTimeout);
  }

  clearCallbackCache(id: number | string) {
    delete this.callbacks[id as number];
  }

  public receive(
    payloadReceived: string | IJsBridgeMessagePayload = '',
    sender?: {
      origin?: string;
      internal?: boolean;
    },
  ) {
    let payload: IJsBridgeMessagePayload = {
      data: null,
    };

    if (isPlainObject(payloadReceived)) {
      payload = payloadReceived as IJsBridgeMessagePayload;
    }
    if (isString(payloadReceived)) {
      try {
        payload = JSON.parse(payloadReceived) as IJsBridgeMessagePayload;
      } catch (error) {
        this.emit(BRIDGE_EVENTS.error, error);
        throw new Error('JsBridge ERROR: JSON.parse payloadReceived failed');
      }
    }

    // !IMPORTANT: force overwrite origin and internal field
    //    DO NOT trust dapp params
    payload.origin = sender?.origin;
    payload.internal = Boolean(sender?.internal);

    // ignore legacy Ext publicConfig message
    if (sender?.internal && this.isExtUi && isLegacyExtMessage(payload)) {
      return;
    }

    if (!payload.origin && !this.isInjected) {
      consoleErrorInDev(this?.constructor?.name, '[payload.origin] is missing.', this);
      throw new Error('JsBridge ERROR: receive message [payload.origin] is required.');
    }

    if (!payload.internal && !payload.scope) {
      throw new Error(
        'JsBridge ERROR: receive message [payload.scope] is required for non-internal method call.',
      );
    }

    this.debugLogger.jsBridge(
      'receive',
      payload,
      { sender },
      '\r\n -----> ',
      (payload.data as IJsonRpcResponse<any>)?.result,
      '\r\n -----> ',
      payload.data,
    );

    const { type, id, data, error, origin, remoteId } = payload;
    this.remoteInfo = {
      origin,
      remoteId,
    };

    if (type === IJsBridgeMessageTypes.RESPONSE) {
      if (id === undefined || id === null) {
        throw new Error(
          'JsBridge ERROR: parameter [id] is required in JsBridge.receive() when REQUEST type message',
        );
      }
      const callbackInfo = this.callbacks[id];
      if (callbackInfo) {
        try {
          if (error) {
            this.rejectCallback(id, error);
          } else {
            this.resolveCallback(id, data);
          }
        } catch (error0) {
          this.emit(BRIDGE_EVENTS.error, error0);
        } finally {
          // noop
        }
      }
    } else if (type === IJsBridgeMessageTypes.REQUEST) {
      const eventMessagePayload = {
        ...payload,
        created: Date.now(),
      };
      // https://nodejs.org/api/events.html#capture-rejections-of-promises
      // only type=REQUEST message will be handled by globalOnMessage
      this.emit(BRIDGE_EVENTS.message, eventMessagePayload);
    } else {
      throw new Error(`JsBridge ERROR: payload type not support yet (type=${type || 'undefined'})`);
    }
  }

  public requestSync({
    data,
    scope,
    remoteId,
  }: {
    data: unknown;
    scope?: IInjectedProviderNamesStrings;
    remoteId?: number | string | null;
  }): void {
    void this.send({
      id: undefined,
      type: IJsBridgeMessageTypes.REQUEST,
      scope,
      data,
      remoteId,
      sync: true,
    });
  }

  public request(info: {
    data: unknown;
    remoteId?: number | string | null;
    scope?: IInjectedProviderNamesStrings;
  }): Promise<IJsonRpcResponse<unknown>> | undefined {
    const { data, remoteId, scope } = info;
    if (data === undefined) {
      console.warn('JsBridge ERROR: data required. Call like `bridge.request({ data: {...} });`');
    }
    return this.send({
      type: IJsBridgeMessageTypes.REQUEST,
      data,
      remoteId,
      sync: false,
      scope,
    });
  }

  // send response DATA to remote
  public response({
    id,
    data,
    remoteId,
    scope,
  }: {
    id: number;
    data: unknown;
    scope?: IInjectedProviderNamesStrings;
    remoteId?: number | string | null;
  }): void {
    void this.send({
      type: IJsBridgeMessageTypes.RESPONSE,
      data,
      id,
      remoteId,
      scope,
      sync: true,
    });
  }

  // send response ERROR to remote
  public responseError({
    id,
    error,
    scope,
    remoteId,
  }: {
    id: number;
    error: unknown;
    scope?: IInjectedProviderNamesStrings;
    remoteId?: number | string | null;
  }): void {
    void this.send({
      type: IJsBridgeMessageTypes.RESPONSE,
      error,
      id,
      remoteId,
      scope,
      sync: true,
    });
  }

  abstract sendPayload(payload: IJsBridgeMessagePayload | string): void;
}

export { JsBridgeBase, isLegacyExtMessage };
