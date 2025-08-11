/* eslint-disable @typescript-eslint/no-unused-vars,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access */
import { EthereumRpcError, ethErrors } from 'eth-rpc-errors';
import dequal from 'fast-deep-equal';

import {
  appDebugLogger as debugLogger,
  IBridgeRequestCallback,
  IInpageProviderConfig,
  ProviderBase,
} from '@onekeyfe/cross-inpage-provider-core';

import { IInjectedProviderNames, IJsonRpcRequest } from '@onekeyfe/cross-inpage-provider-types';

import messages from './messages';
import {
  ConsoleLike,
  EMITTED_NOTIFICATIONS,
  logStreamDisconnectWarning,
  LOW_LEVEL_METHODS,
} from './utils';

export type UnlockStateChangedPayload = { accounts?: string[]; isUnlocked?: boolean };
export type ChainChangedPayload = { chainId?: string; networkVersion?: string };

export interface BaseProviderOptions {
  /**
   * The name of the stream used to connect to the wallet.
   */
  jsonRpcStreamName?: string;

  /**
   * The logging API to use.
   */
  logger?: ConsoleLike;

  /**
   * The maximum number of event listeners.
   */
  maxEventListeners?: number;
}

export interface RequestArguments {
  id?: number | string;
  /** The RPC method to request. */
  method: string;

  /** The params of the RPC method, if any. */
  params?: unknown[] | Record<string, unknown>;
}

export interface BaseProviderState {
  accounts: null | string[];
  isConnected: boolean;
  isUnlocked: boolean;
  initialized: boolean;
  isPermanentlyDisconnected: boolean;
}

export default class ProviderEthBase extends ProviderBase {
  protected providerName = IInjectedProviderNames.ethereum;

  public isMetaMask = true;

  protected readonly _log: ConsoleLike;

  protected _state: BaseProviderState;

  protected static _defaultState: BaseProviderState = {
    accounts: null,
    isConnected: false,
    isUnlocked: false,
    initialized: false,
    isPermanentlyDisconnected: false,
  };

  /**
   * The chain ID of the currently connected Ethereum chain.
   * See [chainId.network]{@link https://chainid.network} for more information.
   */
  public chainId: string | null;

  /**
   * The user's currently selected Ethereum address.
   * If null, MetaMask is either locked or the user has not permitted any
   * addresses to be viewed.
   */
  public selectedAddress: string | null;

  constructor(config: IInpageProviderConfig) {
    super(config);

    // TODO use debugLogger.ethereum()
    this._log = config.logger ?? window.console;
    // TODO remove
    // this.setMaxListeners(config.maxEventListeners ?? 100);

    // private state
    this._state = {
      ...ProviderEthBase._defaultState,
    };

    // public state
    this.selectedAddress = null;
    this.chainId = null;

    // bind functions (to prevent consumers from making unbound calls)
    this._handleAccountsChanged = this._handleAccountsChanged.bind(this);
    this._handleConnect = this._handleConnect.bind(this);
    this._handleChainChanged = this._handleChainChanged.bind(this);
    this._handleDisconnect = this._handleDisconnect.bind(this);
    this._handleStreamDisconnect = this._handleStreamDisconnect.bind(this);
    this._handleUnlockStateChanged = this._handleUnlockStateChanged.bind(this);
    this._rpcRequest = this._rpcRequest.bind(this);
    this.request = this.request.bind(this);

    // TODO jsBridge disconnect event
    const disconnectHandler = this._handleStreamDisconnect.bind(this, 'OneKey');

    // setup own event listeners

    // EIP-1193 connect
    this.on('connect', () => {
      this._state.isConnected = true;
    });

    // setup RPC connection
    // TODO jsBridge disconnect event
    const disconnectHandlerRpc = this._handleStreamDisconnect.bind(this, 'OneKey RpcProvider');

    // handle RPC requests via dapp-side rpc engine
    // TODO middleware like methods
    // rpcEngine.push(createIdRemapMiddleware());
    // rpcEngine.push(createErrorMiddleware(this._log));

    void this._initializeState();

    /*
    this.on('message_low_level', (payload) => {
      const { method, params } = payload as IJsonRpcRequest;
      if (method === 'metamask_accountsChanged') {
        this._handleAccountsChanged(params as unknown[]);
      } else if (method === 'metamask_unlockStateChanged') {
        this._handleUnlockStateChanged(params as UnlockStateChangedPayload);
      } else if (method === 'metamask_chainChanged') {
        this._handleChainChanged(params as ChainChangedPayload);
      } else if (EMITTED_NOTIFICATIONS.includes(method)) {
        this.emit('message', {
          type: method,
          data: params,
        });
      } else if (method === 'METAMASK_STREAM_FAILURE') {
        // TODO destroy bridge connection
        const error = new Error(messages.errors.permanentlyDisconnected());
      }
    });
    */

    // handle JSON-RPC notifications
    this.on('message_low_level', (payload) => {
      const { method, params } = payload as IJsonRpcRequest;
      if (method === LOW_LEVEL_METHODS.metamask_accountsChanged) {
        this._handleAccountsChanged(params as unknown[]);
      } else if (method === LOW_LEVEL_METHODS.metamask_unlockStateChanged) {
        this._handleUnlockStateChanged(params as UnlockStateChangedPayload);
      } else if (method === LOW_LEVEL_METHODS.metamask_chainChanged) {
        this._handleChainChanged(params as ChainChangedPayload);
      } else if (EMITTED_NOTIFICATIONS.includes(method)) {
        this.emit('message', {
          type: method,
          data: params,
        });
      } else if (method === LOW_LEVEL_METHODS.METAMASK_STREAM_FAILURE) {
        // TODO destroy bridge connection
        const error = new Error(messages.errors.permanentlyDisconnected());
      }
    });
  }

  //= ===================
  // Public Methods
  //= ===================

  /**
   * Returns whether the provider can process RPC requests.
   */
  isConnected(): boolean {
    return this._state.isConnected;
  }

  /**
   * Submits an RPC request for the given method, with the given params.
   * Resolves with the result of the method call, or rejects on error.
   *
   * @param args - The RPC request arguments.
   * @param args.method - The RPC method name.
   * @param args.params - The parameters for the RPC method.
   * @returns A Promise that resolves with the result of the RPC method,
   * or rejects if an error is encountered.
   */
  async request<T>(args: RequestArguments): Promise<T> {
    debugLogger.ethereum('request', args);

    if (!args || typeof args !== 'object' || Array.isArray(args)) {
      throw ethErrors.rpc.invalidRequest({
        message: messages.errors.invalidRequestArgs(),
        data: args,
      });
    }

    const { method, params, id } = args;

    if (!method || typeof method !== 'string' || method.length === 0) {
      // createErrorMiddleware
      // `The request 'method' must be a non-empty string.`,
      throw ethErrors.rpc.invalidRequest({
        message: messages.errors.invalidRequestMethod(),
        data: args,
      });
    }

    if (
      params !== undefined &&
      !Array.isArray(params) &&
      (typeof params !== 'object' || params === null)
    ) {
      throw ethErrors.rpc.invalidRequest({
        message: messages.errors.invalidRequestParams(),
        data: args,
      });
    }

    // TODO error logger
    //      log.error(`MetaMask - RPC Error: ${error.message}`, error);
    const res = (await this._rpcRequest({ method, params, id })) as T;
    debugLogger.ethereum('request->response', '\n', args, '\n ---> ', res);

    return res;
  }

  //= ===================
  // Private Methods
  //= ===================

  /**
   * Constructor helper.
   * Populates initial state by calling 'metamask_getProviderState' and emits
   * necessary events.
   */
  private async _initializeState() {
    try {
      const res = await this.request({
        method: 'metamask_getProviderState',
      });
      const { accounts, chainId, isUnlocked, networkVersion } = res as {
        accounts: string[];
        chainId: string;
        isUnlocked: boolean;
        networkVersion: string;
      };

      // indicate that we've connected, for EIP-1193 compliance
      this.emit('connect', { chainId });

      this._handleChainChanged({ chainId, networkVersion });
      this._handleUnlockStateChanged({ accounts, isUnlocked });
      this._handleAccountsChanged(accounts);
    } catch (error) {
      this._log.error('MetaMask: Failed to get initial state. Please report this bug.', error);
    } finally {
      this._state.initialized = true;
      this.emit('_initialized');
    }
  }

  /**
   * Internal RPC method. Forwards requests to background via the RPC engine.
   * Also remap ids inbound and outbound.
   *
   * @param payload - The RPC request object.
   * @param callback
   */
  protected async _rpcRequest(
    payload: IJsonRpcRequest | IJsonRpcRequest[],
    callback?: IBridgeRequestCallback,
  ) {
    const addPerpField = (p: IJsonRpcRequest) => {
      try {
        if (window?.$onekey?.$builtInPerpInjected?.isBuiltInPerp?.()) {
          // @ts-ignore
          p.$$isOneKeyBuiltInPerpRequest = true;
        }
      } catch (e) {
        //
      }
      return p;
    };

    if (!Array.isArray(payload)) {
      if (!payload.jsonrpc) {
        payload.jsonrpc = '2.0';
      }
      addPerpField(payload);
      const result = await this.bridgeRequest(payload, callback);

      if (payload.method === 'eth_accounts' || payload.method === 'eth_requestAccounts') {
        // handle accounts changing
        this._handleAccountsChanged((result as unknown[]) || [], payload.method === 'eth_accounts');
      }
      return result;
    }
    // TODO array payload?
    const payloadWithPerpField: IJsonRpcRequest[] = payload.map(addPerpField);
    return this.bridgeRequest(payloadWithPerpField, callback);
  }

  /**
   * When the provider becomes connected, updates internal state and emits
   * required events. Idempotent.
   *
   * @param chainId - The ID of the newly connected chain.
   * @emits MetaMaskInpageProvider#connect
   */
  protected _handleConnect(chainId: string) {
    if (!this._state.isConnected) {
      this._state.isConnected = true;
      this.emit('connect', { chainId });
      this._log.debug(messages.info.connected(chainId));
    }
  }

  /**
   * When the provider becomes disconnected, updates internal state and emits
   * required events. Idempotent with respect to the isRecoverable parameter.
   *
   * Error codes per the CloseEvent status codes as required by EIP-1193:
   * https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes
   *
   * @param isRecoverable - Whether the disconnection is recoverable.
   * @param errorMessage - A custom error message.
   * @emits MetaMaskInpageProvider#disconnect
   */
  protected _handleDisconnect(isRecoverable: boolean, errorMessage?: string) {
    if (this._state.isConnected || (!this._state.isPermanentlyDisconnected && !isRecoverable)) {
      this._state.isConnected = false;

      let error;
      if (isRecoverable) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        error = new EthereumRpcError(
          1013, // Try again later
          errorMessage || messages.errors.disconnected(),
        );
        this._log.debug(error);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        error = new EthereumRpcError(
          1011, // Internal error
          errorMessage || messages.errors.permanentlyDisconnected(),
        );
        this._log.error(error);
        this.chainId = null;
        this._state.accounts = null;
        this.selectedAddress = null;
        this._state.isUnlocked = false;
        this._state.isPermanentlyDisconnected = true;
      }

      this.emit('disconnect', error);
    }
  }

  /**
   * Called when connection is lost to critical streams.
   *
   * @emits MetamaskInpageProvider#disconnect
   */
  protected _handleStreamDisconnect(streamName: string, error: Error) {
    logStreamDisconnectWarning(this._log, streamName, error, this);
    this._handleDisconnect(false, error ? error.message : undefined);
  }

  /**
   * Upon receipt of a new chainId and networkVersion, emits corresponding
   * events and sets relevant public state.
   * Does nothing if neither the chainId nor the networkVersion are different
   * from existing values.
   *
   * @emits MetamaskInpageProvider#chainChanged
   * @param networkInfo - An object with network info.
   * @param networkInfo.chainId - The latest chain ID.
   * @param networkInfo.networkVersion - The latest network ID.
   */
  protected _handleChainChanged({ chainId, networkVersion }: ChainChangedPayload = {}) {
    if (
      !chainId ||
      typeof chainId !== 'string' ||
      !chainId.startsWith('0x') ||
      !networkVersion ||
      typeof networkVersion !== 'string'
    ) {
      this._log.error('MetaMask: Received invalid network parameters. Please report this bug.', {
        chainId,
        networkVersion,
      });
      return;
    }

    if (networkVersion === 'loading') {
      this._handleDisconnect(true);
    } else {
      this._handleConnect(chainId);

      if (this.isNetworkChanged(chainId)) {
        this.chainId = chainId;
        if (this._state.initialized) {
          this.emit('chainChanged', this.chainId);
        }
      }
    }
  }

  override isNetworkChanged(chainId: string) {
    return chainId !== this.chainId;
  }

  /**
   * Called when accounts may have changed. Diffs the new accounts value with
   * the current one, updates all state as necessary, and emits the
   * accountsChanged event.
   *
   * @param accounts - The new accounts value.
   * @param isEthAccounts - Whether the accounts value was returned by
   * a call to eth_accounts.
   */
  protected _handleAccountsChanged(accounts: unknown[], isEthAccounts = false): void {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    let _accounts = accounts;

    if (!Array.isArray(accounts)) {
      this._log.error(
        'MetaMask: Received invalid accounts parameter. Please report this bug.',
        accounts,
      );
      _accounts = [];
    }

    for (const account of accounts) {
      if (typeof account !== 'string') {
        this._log.error('MetaMask: Received non-string account. Please report this bug.', accounts);
        _accounts = [];
        break;
      }
    }

    // emit accountsChanged if anything about the accounts array has changed
    if (this.isAccountsChanged(_accounts as string[])) {
      // we should always have the correct accounts even before eth_accounts
      // returns
      if (isEthAccounts && this._state.accounts !== null) {
        this._log.error(
          `MetaMask: 'eth_accounts' unexpectedly updated accounts. Please report this bug.`,
          _accounts,
        );
      }

      this._state.accounts = _accounts as string[];

      // handle selectedAddress
      if (this.selectedAddress !== _accounts[0]) {
        this.selectedAddress = (_accounts[0] as string) || null;
      }

      // finally, after all state has been updated, emit the event
      if (this._state.initialized) {
        this.emit('accountsChanged', _accounts);
      }
    }
  }

  override isAccountsChanged(_accounts: string[]) {
    return !dequal(this._state.accounts, _accounts);
  }

  /**
   * Upon receipt of a new isUnlocked state, sets relevant public state.
   * Calls the accounts changed handler with the received accounts, or an empty
   * array.
   *
   * Does nothing if the received value is equal to the existing value.
   * There are no lock/unlock events.
   *
   * @param opts - Options bag.
   * @param opts.accounts - The exposed accounts, if any.
   * @param opts.isUnlocked - The latest isUnlocked value.
   */
  protected _handleUnlockStateChanged({ accounts, isUnlocked }: UnlockStateChangedPayload = {}) {
    if (typeof isUnlocked !== 'boolean') {
      this._log.error('MetaMask: Received invalid isUnlocked parameter. Please report this bug.');
      return;
    }

    if (isUnlocked !== this._state.isUnlocked) {
      this._state.isUnlocked = isUnlocked;
      this._handleAccountsChanged(accounts || []);
    }
  }
}
