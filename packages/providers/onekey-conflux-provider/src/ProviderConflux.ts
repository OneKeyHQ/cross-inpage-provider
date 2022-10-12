import { IInpageProviderConfig } from '@onekeyfe/cross-inpage-provider-core';
import { getOrCreateExtInjectedJsBridge } from '@onekeyfe/extension-bridge-injected';

import { ProviderConfluxBase } from './ProviderConfluxBase';
import {
  IProviderConflux,
  DeprecatedType,
  ProviderEvents,
  ProviderEventsMap,
  ConsoleLike,
  Network,
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
        }
      }
    }

    this.emit(ProviderEvents.CHAIN_CHANGED, chainId);
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

  async enable() {
    deprecated(
      DeprecatedType.METHOD,
      '"provider.enable" is deprecated, please use "provider.request({method: "cfx_requestAccounts"})" instead',
    );
    return this.request({ method: 'cfx_requestAccounts' });
  }

  on<E extends ProviderEvents>(event: E, listener: ProviderEventsMap[E]): this {
    return super.on(event, listener);
  }

  emit<E extends ProviderEvents>(event: E, ...args: Parameters<ProviderEventsMap[E]>): boolean {
    return super.emit(event, ...args);
  }
}

export { ProviderConflux };
