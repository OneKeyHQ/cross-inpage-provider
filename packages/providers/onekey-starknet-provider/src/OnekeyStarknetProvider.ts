import type { IInpageProviderConfig } from '@onekeyfe/cross-inpage-provider-core';
import type { IJsonRpcRequest } from '@onekeyfe/cross-inpage-provider-types';
import { getOrCreateExtInjectedJsBridge } from '@onekeyfe/extension-bridge-injected';
import { ProviderStarknetBase } from './ProviderStarknetBase';

export enum STARKNET_PROVIDER_EVENTS {
  accountsChanged = 'accountsChanged',
  networkChanged = 'networkChanged',
  message_low_level = 'message_low_level',
}

export type IStarknetWalletEventMap = {
  accountsChanged: (accounts?: string[]) => void;
  networkChanged: (chainId?: string, accounts?: string[]) => void;
  message_low_level: (payload: IJsonRpcRequest) => void;
};

export type IStarknetRequestCall = {
  type: string;
  params?: unknown;
  method?: string;
};

export type IStarknetWalletIcon =
  | string
  | {
      dark: string;
      light: string;
    };

export type IProviderStarknetConfig = IInpageProviderConfig & {
  icon?: IStarknetWalletIcon;
  timeout?: number;
};

const DEFAULT_ONEKEY_ICON =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHJ4PSIxNiIgZmlsbD0iIzAwQjgxMiIvPjxwYXRoIGQ9Ik0xNiA3TDkgMTMuNVYyNUgyM1YxMy41TDE2IDdaIiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==';

/**
 * Starknet Wallet API v4 (get-starknet-core) compatible window provider.
 * Exposed as `window.starknet_onekey` (enumerable) and `window.$onekey.starknet`.
 */
export class ProviderStarknet extends ProviderStarknetBase {
  public readonly id = 'onekey';

  public readonly name = 'OneKey';

  public readonly version = '1.0.0';

  public readonly icon: IStarknetWalletIcon;

  public readonly isOneKey = true;

  // Store wallet-event listeners in a Map instead of EventEmitter3's own
  // properties so `off()` works even when accessed through `defineWindowProperty`'s
  // defineProperty-blocking Proxy in extension injection mode.
  private readonly _walletListeners = new Map<
    'accountsChanged' | 'networkChanged',
    Set<(...args: any[]) => void>
  >();

  constructor(props: IProviderStarknetConfig) {
    super({
      ...props,
      bridge: props.bridge || getOrCreateExtInjectedJsBridge({ timeout: props.timeout }),
    });
    this.icon = props.icon || {
      dark: DEFAULT_ONEKEY_ICON,
      light: DEFAULT_ONEKEY_ICON,
    };
    this._registerEvents();
  }

  private _registerEvents() {
    window.addEventListener('onekey_bridge_disconnect', () => {
      this._handleAccountsChanged([]);
    });

    super.on('message_low_level', (payload: IJsonRpcRequest) => {
      const { method, params } = payload;
      if (method === 'wallet_events_accountsChanged') {
        const accounts = Array.isArray(params)
          ? (params as string[])
          : typeof params === 'string' && params
            ? [params]
            : [];
        this._handleAccountsChanged(accounts);
      } else if (method === 'wallet_events_networkChanged') {
        const data = (params ?? {}) as { chainId?: string; accounts?: string[] };
        this._handleNetworkChanged(data.chainId, data.accounts);
      }
    });
  }

  private _handleAccountsChanged(accounts: string[]) {
    this.emit('accountsChanged', accounts);
  }

  private _handleNetworkChanged(chainId?: string, accounts?: string[]) {
    this.emit('networkChanged', chainId, accounts);
  }

  public async request<T = unknown>(call: IStarknetRequestCall): Promise<T> {
    const method = call?.type || call?.method;
    if (!method || typeof method !== 'string') {
      throw new Error('Starknet provider request requires a `type` string');
    }
    return this.bridgeRequest({
      method,
      params: call.params,
    }) as Promise<T>;
  }

  override on<E extends keyof IStarknetWalletEventMap>(
    event: E,
    listener: IStarknetWalletEventMap[E],
  ): this {
    if (event === 'accountsChanged' || event === 'networkChanged') {
      let set = this._walletListeners.get(event);
      if (!set) {
        set = new Set();
        this._walletListeners.set(event, set);
      }
      set.add(listener as (...args: any[]) => void);
      return this;
    }
    return super.on(event, listener);
  }

  override off<E extends keyof IStarknetWalletEventMap>(
    event: E,
    listener: IStarknetWalletEventMap[E],
  ): this {
    if (event === 'accountsChanged' || event === 'networkChanged') {
      this._walletListeners.get(event)?.delete(listener as (...args: any[]) => void);
      return this;
    }
    return super.off(event, listener);
  }

  override emit<E extends keyof IStarknetWalletEventMap>(
    event: E,
    ...args: Parameters<IStarknetWalletEventMap[E]>
  ): boolean {
    if (event === 'accountsChanged' || event === 'networkChanged') {
      const listeners = this._walletListeners.get(event);
      if (!listeners || listeners.size === 0) {
        return false;
      }
      Array.from(listeners).forEach((fn) => fn(...args));
      return true;
    }
    return super.emit(event, ...args);
  }
}
