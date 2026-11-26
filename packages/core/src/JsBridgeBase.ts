/* eslint-disable @typescript-eslint/ban-ts-comment */
import { isPlainObject, isString, isNil } from 'lodash-es';
import { CrossEventEmitter } from './CrossEventEmitter';
import { appDebugLogger, consoleErrorInDev } from './loggers';

import type { Web3ProviderError } from '@onekeyfe/cross-inpage-provider-errors';
import { web3Errors, toNativeErrorObject } from '@onekeyfe/cross-inpage-provider-errors';
import {
  IDebugLogger,
  IInjectedProviderNamesStrings,
  IJsBridgeCallback,
  IJsBridgeConfig,
  IJsBridgeMessagePayload,
  IJsBridgeMessageTypes,
  IJsonRpcResponse,
} from '@onekeyfe/cross-inpage-provider-types';
import versionInfo from './versionInfo';

const orignalConsoleLog = console.log;

function toPlainError(errorInfo: IErrorInfo) {
  return {
    constructorName: errorInfo.constructorName,

    name: errorInfo.name,
    message: errorInfo.message,
    stack: errorInfo.stack,

    code: errorInfo.code,
    data: errorInfo.data as unknown,

    key: errorInfo.key, // i18n key
    info: errorInfo.info as unknown, // i18n params
    className: errorInfo.className,
    autoToast: errorInfo.autoToast,
    requestId: errorInfo.requestId,
    httpStatusCode: errorInfo.httpStatusCode,

    reconnect: errorInfo.reconnect,
    payload: errorInfo.payload,
  };
}

function createFallbackError(error: unknown): Error {
  let message = 'Unknown bridge error';
  try {
    if (typeof error === 'string') {
      message = error;
    } else if (error && typeof error === 'object') {
      const remoteMessage = (error as { message?: unknown }).message;
      if (typeof remoteMessage === 'string') {
        message = remoteMessage;
      }
    }
  } catch {
    // Reading serialized error metadata is best-effort across runtime boundaries.
  }
  return new Error(message);
}

function isLegacyExtMessage(payload: unknown): boolean {
  const payloadObj = payload as { name: string };
  return (
    Boolean(payloadObj.name) &&
    ['onekey-provider-eth', 'onekey-provider-cfx', 'publicConfig'].includes(payloadObj.name)
  );
}

const globalWindow = typeof window !== 'undefined' ? window : global;

type IErrorInfo = Error & {
  constructorName?: string;

  // Error
  name?: string;
  message?: string;
  stack?: string;

  // Web3RpcError
  code?: string | number;
  data?: any;

  // OneKeyError
  key?: string;
  info?: any;
  className?: string;
  autoToast?: boolean;
  requestId?: string;
  httpStatusCode?: number;

  // OneKeyHardwareError
  reconnect?: boolean;
  payload?: {
    code?: number | string;
    error?: string;
    message?: string;
    params?: any;
    connectId?: string;
    deviceId?: string;
  };
};

const BRIDGE_EVENTS = {
  message: 'message',
  error: 'error',
};

const UINT32_RANGE = 0x100000000;
const CALLBACK_ID_HIGH_BITS_MASK = 0x1fffff;
const CALLBACK_ID_MAX_ATTEMPTS = 10;
const REQUEST_PAYLOAD_CACHE_LIMIT = 100;

// 21 random high bits + 32 random low bits, so ids stay safe integers through JSON.
function createRandomCallbackId(): number {
  let high: number | undefined;
  let low: number | undefined;
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const values = new Uint32Array(2);
      crypto.getRandomValues(values);
      high = values[0];
      low = values[1];
    }
  } catch {
    // Some runtimes expose crypto without a working getRandomValues.
  }
  if (high === undefined || low === undefined) {
    high = Math.floor(Math.random() * UINT32_RANGE);
    low = Math.floor(Math.random() * UINT32_RANGE);
  }
  return (high & CALLBACK_ID_HIGH_BITS_MASK) * UINT32_RANGE + low;
}

// Remote peers echo the id back; accept the canonical numeric string form as well.
function normalizeCallbackId(id: unknown): number | undefined {
  let value = id;
  if (typeof value === 'string' && String(Number(value)) === value) {
    value = Number(value);
  }
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) {
    return value;
  }
  return undefined;
}

function hasRemoteId(remoteId: unknown): remoteId is number | string {
  return !isNil(remoteId) && remoteId !== '';
}

abstract class JsBridgeBase extends CrossEventEmitter {
  private callbacks = new Map<number, IJsBridgeCallback>();

  private callbacksExpireTimer?: ReturnType<typeof setTimeout>;

  private _requestPayloadCache = new Map<number, IJsBridgeMessagePayload>();

  protected isExtUi = false;

  protected isInjected = false;

  protected sendAsString = true;

  public globalOnMessageEnabled = true;

  public providersHub: Record<string, any[]> = {
    // name: []
  };

  private config: IJsBridgeConfig;

  // TODO increase timeout as hardware sign transaction may take a long time
  //    can set timeout for each callback
  protected callbacksExpireTimeout: number = 10 * 60 * 1000;

  public debugLogger: IDebugLogger = appDebugLogger;

  constructor(config: IJsBridgeConfig = {}) {
    super();
    this.config = config;
    this.callbacksExpireTimeout = config.timeout ?? this.callbacksExpireTimeout;
    this.debugLogger = config.debugLogger || appDebugLogger;
    this.sendAsString = config.sendAsString ?? this.sendAsString;
    if (this.config.receiveHandler) {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      this.on(BRIDGE_EVENTS.message, this.globalOnMessage);
    }
    this.on(BRIDGE_EVENTS.error, (error) => {
      consoleErrorInDev('JsBridge ERROR: ', error, {
        code: (error as Web3ProviderError<any>)?.code,
      });
    });
  }

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
            peerOrigin: message.origin,
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
          peerOrigin: message.origin,
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

  private createCallbackId(): number {
    let id = 0;
    for (let attempt = 0; attempt < CALLBACK_ID_MAX_ATTEMPTS; attempt += 1) {
      id = createRandomCallbackId();
      if (id > 0 && !this.callbacks.has(id)) {
        return id;
      }
    }
    // A stubbed or broken random source can keep repeating; take the next free id instead of spinning.
    do {
      id = id >= Number.MAX_SAFE_INTEGER ? 1 : id + 1;
    } while (this.callbacks.has(id));
    return id;
  }

  private getCallback(id: unknown): IJsBridgeCallback | undefined {
    const callbackId = normalizeCallbackId(id);
    return callbackId === undefined ? undefined : this.callbacks.get(callbackId);
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
    const { id, type, remoteId } = payload;
    if (resolve && reject && id && type === IJsBridgeMessageTypes.REQUEST) {
      if (this.callbacks.has(id)) {
        // TODO custom error
        throw new Error(`JsBridge ERROR: callback exists, id=${id}`);
      }
      this.callbacks.set(id, { id, resolve, reject, created: Date.now(), remoteId });
      this.startCallbackExpireTimerLoop();
    }

    // convert to plain error object which can be stringify
    if (payload.error) {
      const errorInfo = payload.error as IErrorInfo;
      payload.error = toPlainError(errorInfo);
    }
    // delete resolve, reject function which can not be send as string
    delete payload?.resolve;
    delete payload?.reject;

    return payload;
  }

  private send({
    type,
    data,
    error,
    id,
    remoteId,
    sync = false,
    scope,
    peerOrigin,
  }: IJsBridgeMessagePayload) {
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
            origin: globalWindow?.location?.origin || '',
            peerOrigin,
            remoteId,
            scope,
          },
          { resolve, reject },
        );
        let payloadToSend: unknown = payload;
        if (this.sendAsString) {
          payloadToSend = JSON.stringify(payload);
        }

        // @ts-ignore
        if (this.debugLogger.jsBridge?.enabled) {
          if (payload && payload.id && payload.type === IJsBridgeMessageTypes.REQUEST) {
            if (this._requestPayloadCache.size >= REQUEST_PAYLOAD_CACHE_LIMIT) {
              this._requestPayloadCache.clear();
            }
            this._requestPayloadCache.set(payload.id, payload);
          }
        }
        this.debugLogger.jsBridge(
          'send',
          payload,
          '\r\n ------> ',
          payload.data,
          '\r\n ------> ',
          // @ts-ignore
          payload.data?.result,
        );

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
    const callbackInfo = this.getCallback(id);
    if (callbackInfo) {
      this.clearCallbackCache(id);
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
    }
  }

  private rejectExpiredCallbacks() {
    if (!this.callbacksExpireTimeout || this.callbacks.size === 0) {
      return;
    }
    const now = Date.now();
    const expiredIds: number[] = [];
    this.callbacks.forEach((callbackInfo, id) => {
      if (callbackInfo.created && now - callbackInfo.created > this.callbacksExpireTimeout) {
        expiredIds.push(id);
      }
    });
    expiredIds.forEach((id) => {
      const error = web3Errors.provider.requestTimeout();
      this.rejectCallback(id, error);
    });
  }

  private stopCallbackExpireTimerLoop() {
    if (this.callbacksExpireTimer) {
      clearTimeout(this.callbacksExpireTimer);
      this.callbacksExpireTimer = undefined;
    }
  }

  private startCallbackExpireTimerLoop() {
    if (!this.callbacksExpireTimeout || this.callbacks.size === 0 || this.callbacksExpireTimer) {
      return;
    }
    this.callbacksExpireTimer = setTimeout(() => {
      this.callbacksExpireTimer = undefined;
      this.rejectExpiredCallbacks();
      this.startCallbackExpireTimerLoop();
    }, this.callbacksExpireTimeout);
    (this.callbacksExpireTimer as { unref?: () => void } | null)?.unref?.();
  }

  clearCallbackCache(id: number | string) {
    const callbackId = normalizeCallbackId(id);
    if (callbackId !== undefined) {
      this.callbacks.delete(callbackId);
    }
    if (this.callbacks.size === 0) {
      this.stopCallbackExpireTimerLoop();
    }
  }

  public receive(
    payloadReceived: string | IJsBridgeMessagePayload = '',
    sender?: {
      origin?: string;
      internal?: boolean;
    },
  ) {
    // orignalConsoleLog('JsBridgeBase.receive', payloadReceived, sender);

    let payload: IJsBridgeMessagePayload = {
      data: null,
    };

    if (isNil(payloadReceived) || payloadReceived === '') {
      throw new Error('JsBridge ERROR: receive() payload is empty');
    }

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

    const relatedCallbackId = normalizeCallbackId(payload?.id);
    const relatedSendPayload =
      (relatedCallbackId !== undefined && this._requestPayloadCache.get(relatedCallbackId)) || null;
    this.debugLogger.jsBridge(
      'receive',
      payload,
      { sender },
      '\r\n -----> ',
      (payload.data as IJsonRpcResponse<any>)?.result ?? payload.data,
      '\r\n <----- ',
      relatedSendPayload?.data,
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
      const callbackInfo = this.getCallback(id);
      if (callbackInfo) {
        if (
          hasRemoteId(callbackInfo.remoteId) &&
          (!hasRemoteId(remoteId) || String(remoteId) !== String(callbackInfo.remoteId))
        ) {
          // Only the remote the request was sent to may settle it.
          this.debugLogger.jsBridge('receive: ignore RESPONSE from another remote', {
            id,
            remoteId,
          });
          return;
        }
        if (error) {
          let errorObject: Error;
          try {
            errorObject = toNativeErrorObject(error);
          } catch {
            errorObject = createFallbackError(error);
          }
          this.rejectCallback(id, errorObject);
        } else {
          try {
            this.resolveCallback(id, data);
          } catch (error0) {
            this.emit(BRIDGE_EVENTS.error, error0);
          }
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
    peerOrigin,
  }: {
    id: number;
    data: unknown;
    scope?: IInjectedProviderNamesStrings;
    remoteId?: number | string | null;
    peerOrigin?: string;
  }): void {
    void this.send({
      type: IJsBridgeMessageTypes.RESPONSE,
      data,
      id,
      remoteId,
      scope,
      sync: true,
      peerOrigin,
    });
  }

  // send response ERROR to remote
  public responseError({
    id,
    error,
    scope,
    remoteId,
    peerOrigin,
  }: {
    id: number;
    error: unknown;
    scope?: IInjectedProviderNamesStrings;
    remoteId?: number | string | null;
    peerOrigin?: string;
  }): void {
    void this.send({
      type: IJsBridgeMessageTypes.RESPONSE,
      error,
      id,
      remoteId,
      scope,
      sync: true,
      peerOrigin,
    });
  }

  abstract sendPayload(payload: IJsBridgeMessagePayload | string): void;
}

export { JsBridgeBase, isLegacyExtMessage };
