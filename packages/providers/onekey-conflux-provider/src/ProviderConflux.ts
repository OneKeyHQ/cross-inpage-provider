import { IInpageProviderConfig } from '@onekeyfe/cross-inpage-provider-core';
import { getOrCreateExtInjectedJsBridge } from '@onekeyfe/extension-bridge-injected';
import { web3Errors } from '@onekeyfe/cross-inpage-provider-errors';

import { ProviderConfluxBase } from './ProviderConfluxBase';
import {
  IProviderConflux,
  DeprecatedType,
  ProviderEvents,
  ProviderEventsMap,
  ConsoleLike,
  Network,
  RequestArguments,
} from './types';
import { deprecated, isWalletEventMethodMatch } from './utils';
type OneKeyConfluxProviderProps = IInpageProviderConfig & {
  timeout?: number;
};

class ProviderConflux extends ProviderConfluxBase implements IProviderConflux {
  public readonly isConfluxPortal = true;
  public readonly isFluent = true;
  public readonly isOneKey = true;

  private _isConnected = false;
  private _initialized = false;

  private _chainId = '';
  private _networkVersion = '';
  private _selectedAddress = '';

  private readonly _log: ConsoleLike;

  constructor(props: OneKeyConfluxProviderProps) {
    super({
      ...props,
      bridge: props.bridge || getOrCreateExtInjectedJsBridge({ timeout: props.timeout }),
    });

    this._log = props.logger ?? window.console;

    this._registerEvents();
    void this._initializeState();
  }

  private async _initializeState() {
    try {
      const res = await this.request({
        method: 'cfx_getProviderState',
      });
      const { chainId, networkId } = res as {
        chainId: string;
        networkId: string;
      };
      this.emit(ProviderEvents.CONNECT, { chainId, networkId });
    } catch (error) {
      this._log.error('OneKey: Failed to get initial state. Please report this bug.', error);
    } finally {
      this._initialized = true;
    }
  }

  private _registerEvents() {
    window.addEventListener('onekey_bridge_disconnect', () => {
      this._handleDisconnected();
    });

    this.on(ProviderEvents.MESSAGE_LOW_LEVEL, (payload) => {
      const { method, params } = payload;

      if (isWalletEventMethodMatch(method, ProviderEvents.ACCOUNTS_CHANGED)) {
        this._handleAccountsChanged(params as string[]);
      }

      if (isWalletEventMethodMatch(method, ProviderEvents.CHAIN_CHANGED)) {
        this._handleChainChanged(params as Network);
      }
    });

    this.on(ProviderEvents.CONNECT, () => {
      this._isConnected = true;

      // DEPRECATED
      {
        this.request<string>({ method: 'cfx_chainId' })
          .then((result) => {
            this._chainId = result;
            const networkId = parseInt(result, 16);
            this._networkVersion = networkId.toString(10);
          })
          .catch(() => {
            this._chainId = '';
            this._networkVersion = '';
          });
        this.request<string[]>({ method: 'cfx_accounts' })
          .then((result) => {
            if (!result) this._selectedAddress = '';
            else this._selectedAddress = result[0];
          })
          .catch(() => (this._selectedAddress = ''));
        this.on(ProviderEvents.CHAIN_CHANGED, (chainId: string) => {
          this._chainId = chainId;
          const networkId = parseInt(chainId, 16);
          this._networkVersion = networkId.toString(10);
        });
        this.on(ProviderEvents.ACCOUNTS_CHANGED, (accounts: string[]) => {
          this._selectedAddress = accounts[0];
        });
      }
    });
  }

  private _handleAccountsChanged(accounts: string[]) {
    if (this._initialized) {
      this.emit(ProviderEvents.ACCOUNTS_CHANGED, accounts);
    }
  }

  private _handleChainChanged({ chainId, networkId }: Network = {}) {
    if (
      !chainId ||
      typeof chainId !== 'string' ||
      !chainId.startsWith('0x') ||
      !networkId ||
      typeof networkId !== 'string'
    ) {
      this._log.error('Onekey: Received invalid network parameters. Please report this bug.', {
        chainId,
        networkId,
      });
      return;
    }

    if (networkId === 'loading') {
      this._handleDisconnected();
    } else {
      this._handleConnected({ chainId, networkId });
      if (chainId !== this._chainId) {
        this._chainId = chainId;
        if (this._initialized) {
          this.emit(ProviderEvents.CHAIN_CHANGED, chainId);

          // DEPRECATED
          {
            this.emit(ProviderEvents.NETWORK_CHANGED, networkId);
            this.emit(ProviderEvents.CHAIN_ID_CHANGE, chainId);
          }
        }
      }
    }
  }

  private _handleConnected(network: Network) {
    if (!this._isConnected) {
      this._isConnected = true;
      this.emit(ProviderEvents.CONNECT, network);
    }
  }

  private _handleDisconnected() {
    if (this._isConnected) {
      this._isConnected = false;
      this.emit(ProviderEvents.DISCONNECT);
    }
  }

  isConnected() {
    return this._isConnected;
  }

  async request<T>(args: RequestArguments): Promise<T> {
    const { method, params } = args;

    if (!method || typeof method !== 'string' || method.length === 0) {
      throw web3Errors.rpc.methodNotFound();
    }

    if (
      params !== undefined &&
      !Array.isArray(params) &&
      (typeof params !== 'object' || params === null)
    ) {
      throw web3Errors.rpc.invalidParams();
    }

    if (args.method.startsWith('eth_')) {
      args.method = args.method.replace('eth_', 'cfx_');
    }

    const resp = await this.bridgeRequest(args);

    return resp as T;
  }

  on<E extends ProviderEvents>(event: E, listener: ProviderEventsMap[E]): this {
    return super.on(event, listener);
  }

  off<E extends ProviderEvents>(event: E, listener: ProviderEventsMap[E]): this {
    return super.off(event, listener);
  }

  emit<E extends ProviderEvents>(event: E, ...args: Parameters<ProviderEventsMap[E]>): boolean {
    return super.emit(event, ...args);
  }

  // DEPRECATED -----------------------

  get chainId() {
    deprecated(
      DeprecatedType.PROPERTY,
      '"provider.chainId" is deprecated, please use "provider.request({method: "cfx_chainId"})" instead',
    );
    return this._chainId;
  }

  get networkVersion() {
    deprecated(
      DeprecatedType.PROPERTY,
      '"provider.networkVersion" is deprecated, please use "provider.request({method: "net_version"})" instead',
    );
    return this._networkVersion;
  }

  get selectedAddress() {
    deprecated(
      DeprecatedType.PROPERTY,
      '"provider.selectedAddress" is deprecated, please use "provider.request({method: "cfx_accounts"})" instead',
    );
    return this._selectedAddress || null;
  }

  async enable() {
    deprecated(
      DeprecatedType.METHOD,
      '"provider.enable" is deprecated, please use "provider.request({method: "cfx_requestAccounts"})" instead',
    );
    return this.request({ method: 'cfx_requestAccounts' });
  }

  sendAsync(
    request: RequestArguments,
    callback: (err: Error | null | string, resp?: unknown) => void,
  ) {
    deprecated(
      DeprecatedType.METHOD,
      '"provider.sendAsync" is deprecated, please use "provider.request" instead',
    );
    if (typeof callback !== 'function') throw new Error('Invalid callback, not a function');

    this.request(request)
      .then((resp) => callback(null, resp))
      .catch(callback);
  }

  async send<T>(args: RequestArguments): Promise<T> {
    deprecated(
      DeprecatedType.METHOD,
      '"provider.send" is deprecated, please use "provider.request" instead',
    );

    const resp = await this.request(args);
    return resp as T;
  }
}

export { ProviderConflux };
