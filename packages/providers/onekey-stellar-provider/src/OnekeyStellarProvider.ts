import type { IInpageProviderConfig } from '@onekeyfe/cross-inpage-provider-core';
import { getOrCreateExtInjectedJsBridge } from '@onekeyfe/extension-bridge-injected';
import { ProviderStellarBase } from './ProviderStellarBase';
import type { IJsonRpcRequest } from '@onekeyfe/cross-inpage-provider-types';
import type * as TypeUtils from './type-utils';

export enum PROVIDER_EVENTS {
  accountsChanged = 'accountsChanged',
  disconnect = 'disconnect',
  message_low_level = 'message_low_level',
}

type StellarProviderEventsMap = {
  [PROVIDER_EVENTS.accountsChanged]: (address: string | null) => void;
  [PROVIDER_EVENTS.disconnect]: () => void;
  [PROVIDER_EVENTS.message_low_level]: (payload: IJsonRpcRequest) => void;
};

// Stellar request method names
export enum StellarRequestMethods {
  stellar_getAddress = 'stellar_getAddress',
  stellar_signTransaction = 'stellar_signTransaction',
  stellar_signAuthEntry = 'stellar_signAuthEntry',
  stellar_signMessage = 'stellar_signMessage',
  stellar_getNetwork = 'stellar_getNetwork',
  stellar_disconnect = 'stellar_disconnect',
}

// Types for getAddress
export type GetAddressParams = {
  path?: string;
  skipRequestAccess?: boolean;
};

export type GetAddressResult = {
  address: string;
};

// Types for signTransaction
export type SignTransactionParams = {
  xdr: string;
  networkPassphrase?: string;
  address?: string;
  path?: string;
  submit?: boolean;
  submitUrl?: string;
};

export type SignTransactionResult = {
  signedTxXdr: string;
  signerAddress?: string;
};

// Types for signAuthEntry
export type SignAuthEntryParams = {
  authEntry: string;
  networkPassphrase?: string;
  address?: string;
  path?: string;
};

export type SignAuthEntryResult = {
  signedAuthEntry: string;
  signerAddress?: string;
};

// Types for signMessage
export type SignMessageParams = {
  message: string;
  networkPassphrase?: string;
  address?: string;
  path?: string;
};

export type SignMessageResult = {
  signedMessage: string;
  signerAddress?: string;
};

// Types for getNetwork
export type GetNetworkResult = {
  network: string;
  networkPassphrase: string;
};

// Stellar request interface
type StellarRequest = {
  [StellarRequestMethods.stellar_getAddress]: (params?: GetAddressParams) => Promise<GetAddressResult>;
  [StellarRequestMethods.stellar_signTransaction]: (params: SignTransactionParams) => Promise<SignTransactionResult>;
  [StellarRequestMethods.stellar_signAuthEntry]: (params: SignAuthEntryParams) => Promise<SignAuthEntryResult>;
  [StellarRequestMethods.stellar_signMessage]: (params: SignMessageParams) => Promise<SignMessageResult>;
  [StellarRequestMethods.stellar_getNetwork]: () => Promise<GetNetworkResult>;
  [StellarRequestMethods.stellar_disconnect]: () => Promise<void>;
};

// JsBridge request types
type JsBridgeRequest = {
  [K in keyof StellarRequest]: (
    params: Parameters<StellarRequest[K]>[0],
  ) => Promise<TypeUtils.WireStringified<TypeUtils.ResolvePromise<ReturnType<StellarRequest[K]>>>>;
};

type JsBridgeRequestParams<T extends keyof JsBridgeRequest> = Parameters<JsBridgeRequest[T]>[0];
type JsBridgeRequestResponse<T extends keyof JsBridgeRequest> = ReturnType<JsBridgeRequest[T]>;

// Provider interface
export interface IProviderStellar extends ProviderStellarBase {
  /**
   * Get the public key from the active account or specific path
   */
  getAddress(params?: GetAddressParams): Promise<GetAddressResult>;

  /**
   * Sign a transaction in XDR format
   */
  signTransaction(
    xdr: string,
    opts?: {
      networkPassphrase?: string;
      address?: string;
      path?: string;
      submit?: boolean;
      submitUrl?: string;
    },
  ): Promise<SignTransactionResult>;

  /**
   * Sign an AuthEntry XDR
   */
  signAuthEntry(
    authEntry: string,
    opts?: {
      networkPassphrase?: string;
      address?: string;
      path?: string;
    },
  ): Promise<SignAuthEntryResult>;

  /**
   * Sign an arbitrary message
   */
  signMessage(
    message: string,
    opts?: {
      networkPassphrase?: string;
      address?: string;
      path?: string;
    },
  ): Promise<SignMessageResult>;

  /**
   * Get the current selected network
   */
  getNetwork(): Promise<GetNetworkResult>;

  /**
   * Disconnect from the wallet
   */
  disconnect(): Promise<void>;
}

export type OneKeyStellarProviderProps = IInpageProviderConfig & {
  timeout?: number;
};

function isWalletEventMethodMatch({ method, name }: { method: string; name: string }) {
  return method === `wallet_events_${name}`;
}

export class ProviderStellar extends ProviderStellarBase implements IProviderStellar {
  private _address?: string;

  constructor(props: OneKeyStellarProviderProps) {
    super({
      ...props,
      bridge: props.bridge || getOrCreateExtInjectedJsBridge({ timeout: props.timeout }),
    });

    this._registerEvents();
  }

  private _registerEvents() {
    window.addEventListener('onekey_bridge_disconnect', () => {
      this._handleDisconnected();
    });

    this.on(PROVIDER_EVENTS.message_low_level, (payload) => {
      if (!payload) return;
      const { method, params } = payload;

      if (isWalletEventMethodMatch({ method, name: PROVIDER_EVENTS.accountsChanged })) {
        this._handleAccountChange(params as string | undefined);
      }
    });
  }

  private _callBridge<T extends keyof JsBridgeRequest>(params: {
    method: T;
    params: JsBridgeRequestParams<T>;
  }): JsBridgeRequestResponse<T> {
    return this.bridgeRequest(params) as JsBridgeRequestResponse<T>;
  }

  private _handleDisconnected(options: { emit: boolean } = { emit: true }) {
    this._address = undefined;

    if (options.emit && this.isConnectionStatusChanged('disconnected')) {
      this.connectionStatus = 'disconnected';
      this.emit(PROVIDER_EVENTS.disconnect);
    }
  }

  override isAccountsChanged(address: string | undefined) {
    if (!address) return false;
    if (!this._address) return true;

    return address !== this._address;
  }

  // trigger by bridge account change event
  private _handleAccountChange(payload: string | undefined) {
    const address = payload;
    if (this.isAccountsChanged(address)) {
      this._address = address;
      this.emit(PROVIDER_EVENTS.accountsChanged, address || null);
    }
    if (!address) {
      this._handleDisconnected();
      return;
    }
  }

  on<E extends keyof StellarProviderEventsMap>(
    event: E,
    listener: StellarProviderEventsMap[E],
  ): this {
    return super.on(event, listener);
  }

  emit<E extends keyof StellarProviderEventsMap>(
    event: E,
    ...args: Parameters<StellarProviderEventsMap[E]>
  ): boolean {
    return super.emit(event, ...args);
  }

  removeListener<E extends keyof StellarProviderEventsMap>(eventName: E, listener: StellarProviderEventsMap[E]): this {
    return super.removeListener(eventName, listener);
  }

  /**
   * Get the address from the wallet
   */
  async getAddress(params?: GetAddressParams): Promise<GetAddressResult> {
    const result = await this._callBridge({
      method: StellarRequestMethods.stellar_getAddress,
      params,
    });

    // Store the address for account change tracking
    if (result.address) {
      this._address = result.address;
    }

    return result;
  }

  /**
   * Sign a transaction
   */
  async signTransaction(
    xdr: string,
    opts?: {
      networkPassphrase?: string;
      address?: string;
      path?: string;
      submit?: boolean;
      submitUrl?: string;
    },
  ): Promise<SignTransactionResult> {
    const result = await this._callBridge({
      method: StellarRequestMethods.stellar_signTransaction,
      params: {
        xdr,
        ...opts,
      },
    });

    return result;
  }

  /**
   * Sign an AuthEntry
   */
  async signAuthEntry(
    authEntry: string,
    opts?: {
      networkPassphrase?: string;
      address?: string;
      path?: string;
    },
  ): Promise<SignAuthEntryResult> {
    const result = await this._callBridge({
      method: StellarRequestMethods.stellar_signAuthEntry,
      params: {
        authEntry,
        ...opts,
      },
    });

    return result;
  }

  /**
   * Sign a message
   */
  async signMessage(
    message: string,
    opts?: {
      networkPassphrase?: string;
      address?: string;
      path?: string;
    },
  ): Promise<SignMessageResult> {
    const result = await this._callBridge({
      method: StellarRequestMethods.stellar_signMessage,
      params: {
        message,
        ...opts,
      },
    });

    return result;
  }

  /**
   * Get the current network
   */
  async getNetwork(): Promise<GetNetworkResult> {
    const result = await this._callBridge({
      method: StellarRequestMethods.stellar_getNetwork,
      params: void 0,
    });

    return result;
  }

  /**
   * Disconnect from the wallet
   */
  async disconnect(): Promise<void> {
    await this._callBridge({
      method: StellarRequestMethods.stellar_disconnect,
      params: void 0,
    });

    this._handleDisconnected();
  }
}
