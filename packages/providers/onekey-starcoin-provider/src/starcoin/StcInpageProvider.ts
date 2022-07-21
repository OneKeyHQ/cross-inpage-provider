/* eslint-disable no-dupe-class-members,@typescript-eslint/ban-ts-comment */
import { web3Errors } from '@onekeyfe/cross-inpage-provider-errors';
import { IJsonRpcRequest, IJsonRpcResponse } from '@onekeyfe/cross-inpage-provider-types';
import {
  IBridgeRequestCallback,
  IInpageProviderConfig,
} from '@onekeyfe/cross-inpage-provider-core';

import BaseProvider, { BaseProviderOptions } from './BaseProvider';
import messages from './messages';
import sendSiteMetadata from './siteMetadata';
import { EMITTED_NOTIFICATIONS, NOOP } from './utils';

export interface SendSyncJsonRpcRequest extends IJsonRpcRequest {
  method: 'stc_accounts' | 'stc_coinbase' | 'stc_uninstallFilter' | 'net_version';
}

type WarningEventName = keyof SentWarningsState['events'];

export interface StcInpageProviderOptions extends BaseProviderOptions {
  /**
   * Whether the provider should send page metadata.
   */
  shouldSendMetadata?: boolean;
}

interface SentWarningsState {
  // methods
  enable: boolean;
  experimentalMethods: boolean;
  send: boolean;
  // events
  events: {
    close: boolean;
    data: boolean;
    networkChanged: boolean;
    notification: boolean;
  };
}

export default class StcInpageProvider extends BaseProvider {
  protected _sentWarnings: SentWarningsState = {
    // methods
    enable: false,
    experimentalMethods: false,
    send: false,
    // events
    events: {
      close: false,
      data: false,
      networkChanged: false,
      notification: false,
    },
  };

  /**
   * Experimental methods can be found here.
   */
  public readonly _starmask: ReturnType<StcInpageProvider['_getExperimentalApi']>;

  public networkVersion: string | null;

  /**
   * Indicating that this provider is a MetaMask provider.
   */
  public readonly isStarMask: true;

  /**
   * @param connectionStream - A Node.js duplex stream
   * @param options - An options bag
   * @param options.jsonRpcStreamName - The name of the internal JSON-RPC stream.
   * Default: metamask-provider
   * @param options.logger - The logging API to use. Default: console
   * @param options.maxEventListeners - The maximum number of event
   * listeners. Default: 100
   * @param options.shouldSendMetadata - Whether the provider should
   * send page metadata. Default: true
   */
  constructor(config: IInpageProviderConfig) {
    super(config);

    // sendSiteMetadataDomReady in ProviderPrivate, dont need here
    const shouldSendMetadata = false;

    this.networkVersion = null;
    this.isStarMask = true;

    this._sendSync = this._sendSync.bind(this);
    this.enable = this.enable.bind(this);
    this.send = this.send.bind(this);
    this.sendAsync = this.sendAsync.bind(this);
    this._warnOfDeprecation = this._warnOfDeprecation.bind(this);

    this._starmask = this._getExperimentalApi();

    // handle JSON-RPC notifications
    this.bridge.on('notification', (payload: IJsonRpcRequest) => {
      const { method } = payload;
      if (EMITTED_NOTIFICATIONS.includes(method)) {
        // deprecated
        // emitted here because that was the original order
        this.emit('data', payload);
        // deprecated
        const payloadParams = payload.params as { result: any };
        this.emit('notification', payloadParams.result);
      }
    });

    // send website metadata
    if (shouldSendMetadata) {
      if (document.readyState === 'complete') {
        void sendSiteMetadata(this.bridge, this._log);
      } else {
        const domContentLoadedHandler = () => {
          void sendSiteMetadata(this.bridge, this._log);
          window.removeEventListener('DOMContentLoaded', domContentLoadedHandler);
        };
        window.addEventListener('DOMContentLoaded', domContentLoadedHandler);
      }
    }
  }

  //= ===================
  // Public Methods
  //= ===================

  /**
   * Submits an RPC request per the given JSON-RPC request object.
   *
   * @param payload - The RPC request object.
   * @param callback
   */
  sendAsync(payload: IJsonRpcRequest, callback?: IBridgeRequestCallback): void {
    void this._rpcRequest(payload, callback);
  }

  /**
   * We override the following event methods so that we can warn consumers
   * about deprecated events:
   *   addListener, on, once, prependListener, prependOnceListener
   */

  // @ts-ignore
  addListener(eventName: string, listener: (...args: unknown[]) => void) {
    this._warnOfDeprecation(eventName);
    return super.addListener(eventName, listener);
  }

  // @ts-ignore
  on(eventName: string, listener: (...args: unknown[]) => void) {
    this._warnOfDeprecation(eventName);
    return super.on(eventName, listener);
  }

  // @ts-ignore
  once(eventName: string, listener: (...args: unknown[]) => void) {
    this._warnOfDeprecation(eventName);
    return super.once(eventName, listener);
  }

  prependListener(eventName: string, listener: (...args: unknown[]) => void) {
    this._warnOfDeprecation(eventName);
    return super.prependListener(eventName, listener);
  }

  prependOnceListener(eventName: string, listener: (...args: unknown[]) => void) {
    this._warnOfDeprecation(eventName);
    return super.prependOnceListener(eventName, listener);
  }

  //= ===================
  // Private Methods
  //= ===================

  /**
   * When the provider becomes disconnected, updates internal state and emits
   * required events. Idempotent with respect to the isRecoverable parameter.
   *
   * Error codes per the CloseEvent status codes as required by EIP-1193:
   * https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes
   *
   * @param isRecoverable - Whether the disconnection is recoverable.
   * @param errorMessage - A custom error message.
   * @emits StcInpageProvider#disconnect
   */
  protected _handleDisconnect(isRecoverable: boolean, errorMessage?: string) {
    super._handleDisconnect(isRecoverable, errorMessage);
    if (this.networkVersion && !isRecoverable) {
      this.networkVersion = null;
    }
  }

  /**
   * Warns of deprecation for the given event, if applicable.
   */
  protected _warnOfDeprecation(eventName: string): void {
    if (this._sentWarnings?.events[eventName as WarningEventName] === false) {
      this._log.warn(messages.warnings.events[eventName as WarningEventName]);
      this._sentWarnings.events[eventName as WarningEventName] = true;
    }
  }

  //= ===================
  // Deprecated Methods
  //= ===================

  /**
   * Equivalent to: starcoin.request('stc_requestAccounts')
   *
   * @deprecated Use request({ method: 'stc_requestAccounts' }) instead.
   * @returns A promise that resolves to an array of addresses.
   */
  async enable(): Promise<string[]> {
    if (!this._sentWarnings.enable) {
      this._log.warn(messages.warnings.enableDeprecation);
      this._sentWarnings.enable = true;
    }

    return (await this._rpcRequest({
      method: 'stc_requestAccounts',
      params: [],
    })) as Promise<string[]>;
  }

  _rpcResult(result: any, payload?: SendSyncJsonRpcRequest): IJsonRpcResponse<any> {
    return {
      id: payload?.id ?? undefined,
      jsonrpc: payload?.jsonrpc ?? '2.0',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      result,
    };
  }

  send(methodOrPayload: unknown, callbackOrArgs?: unknown): unknown {
    if (!this._sentWarnings.send) {
      this._log.warn(messages.warnings.sendDeprecation);
      this._sentWarnings.send = true;
    }

    if (typeof methodOrPayload === 'string' && (!callbackOrArgs || Array.isArray(callbackOrArgs))) {
      return this._rpcRequest({
        method: methodOrPayload,
        params: callbackOrArgs,
      }).then((result) => this._rpcResult(result));
    }

    if (
      methodOrPayload &&
      typeof methodOrPayload === 'object' &&
      typeof callbackOrArgs === 'function'
    ) {
      return this._rpcRequest(
        methodOrPayload as IJsonRpcRequest,
        callbackOrArgs as IBridgeRequestCallback,
      );
    }
    return this._sendSync(methodOrPayload as SendSyncJsonRpcRequest);
  }

  /**
   * Internal backwards compatibility method, used in send.
   *
   * @deprecated
   */
  protected _sendSync(payload: SendSyncJsonRpcRequest) {
    let result;
    switch (payload.method) {
      case 'stc_accounts':
        result = this.selectedAddress ? [this.selectedAddress] : [];
        break;

      case 'stc_coinbase':
        result = this.selectedAddress || null;
        break;

      case 'stc_uninstallFilter':
        void this._rpcRequest(payload, NOOP);
        result = true;
        break;

      case 'net_version':
        result = this.networkVersion || null;
        break;

      default:
        throw new Error(messages.errors.unsupportedSync(payload.method));
    }

    return this._rpcResult(result, payload);
  }

  /**
   * Constructor helper.
   * Gets experimental _starmask API as Proxy, so that we can warn consumers
   * about its experiment nature.
   */
  protected _getExperimentalApi() {
    return new Proxy(
      {
        /**
         * Determines if MetaMask is unlocked by the user.
         *
         * @returns Promise resolving to true if MetaMask is currently unlocked
         */
        isUnlocked: async () => {
          if (!this._state.initialized) {
            await new Promise<void>((resolve) => {
              this.on('_initialized', () => resolve());
            });
          }
          return this._state.isUnlocked;
        },

        /**
         * Make a batch RPC request.
         */
        requestBatch: async (requests: IJsonRpcRequest[]) => {
          if (!Array.isArray(requests)) {
            throw web3Errors.rpc.invalidRequest({
              message: 'Batch requests must be made with an array of request objects.',
              data: requests,
            });
          }
          return this._rpcRequest(requests);
        },
      },
      {
        get: (obj, prop, ...args) => {
          if (!this._sentWarnings.experimentalMethods) {
            this._log.warn(messages.warnings.experimentalMethods);
            this._sentWarnings.experimentalMethods = true;
          }
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return Reflect.get(obj, prop, ...args);
        },
      },
    );
  }

  /**
   * Upon receipt of a new chainId and networkVersion, emits corresponding
   * events and sets relevant public state.
   * Does nothing if neither the chainId nor the networkVersion are different
   * from existing values.
   *
   * @emits StcInpageProvider#chainChanged
   * @emits StcInpageProvider#networkChanged
   * @param networkInfo - An object with network info.
   * @param networkInfo.chainId - The latest chain ID.
   * @param networkInfo.networkVersion - The latest network ID.
   */
  protected _handleChainChanged({
    chainId,
    networkVersion,
  }: { chainId?: string; networkVersion?: string } = {}) {
    super._handleChainChanged({ chainId, networkVersion });

    if (networkVersion && networkVersion !== 'loading' && networkVersion !== this.networkVersion) {
      this.networkVersion = networkVersion;
      if (this._state.initialized) {
        this.emit('networkChanged', this.networkVersion);
      }
    }
  }
}
