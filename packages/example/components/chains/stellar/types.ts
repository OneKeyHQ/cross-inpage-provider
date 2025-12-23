// Stellar Provider API types
export type GetAddressParams = {
  path?: string;
  skipRequestAccess?: boolean;
};

export type GetAddressResult = {
  address: string;
};

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

export type GetNetworkResult = {
  network: string;
  networkPassphrase: string;
};

// Hana Wallet style params
export type HanaSignTransactionParams = {
  xdr: string;
  accountToSign?: string;
  networkPassphrase?: string;
};

export type HanaSignAuthEntryParams = {
  xdr: string;
  accountToSign?: string;
};

export type HanaSignMessageParams = {
  message: string;
  accountToSign?: string;
};

export interface IProviderApi {
  isOneKey?: boolean;

  /**
   * Get the public key from the active account or specific path (OneKey style)
   */
  getAddress?(params?: GetAddressParams): Promise<GetAddressResult>;

  /**
   * Get the public key (Hana Wallet style)
   */
  getPublicKey?(): Promise<string>;

  /**
   * Sign a transaction in XDR format
   * Supports both OneKey style (2 params) and Hana style (1 object param)
   */
  signTransaction(
    xdrOrParams: string | HanaSignTransactionParams,
    opts?: {
      networkPassphrase?: string;
      address?: string;
      path?: string;
      submit?: boolean;
      submitUrl?: string;
    },
  ): Promise<SignTransactionResult | string>;

  /**
   * Sign an AuthEntry XDR
   * Supports both OneKey style (2 params) and Hana style (1 object param)
   */
  signAuthEntry(
    authEntryOrParams: string | HanaSignAuthEntryParams,
    opts?: {
      networkPassphrase?: string;
      address?: string;
      path?: string;
    },
  ): Promise<SignAuthEntryResult | string>;

  /**
   * Sign an arbitrary message
   * Supports both OneKey style (2 params) and Hana style (1 object param)
   */
  signMessage(
    messageOrParams: string | HanaSignMessageParams,
    opts?: {
      networkPassphrase?: string;
      address?: string;
      path?: string;
    },
  ): Promise<SignMessageResult | string>;

  /**
   * Get the current selected network (optional, may not be supported by all wallets)
   */
  getNetwork?(): Promise<GetNetworkResult>;

  /**
   * Disconnect from the wallet
   */
  disconnect(): Promise<void>;

  /**
   * Event listener methods
   */
  on(event: 'accountsChanged', listener: (address: string | null) => void): void;
  on(event: 'disconnect', listener: () => void): void;
  removeListener(event: 'accountsChanged', listener: (address: string | null) => void): void;
  removeListener(event: 'disconnect', listener: () => void): void;
}

export interface IProviderInfo {
  uuid: string;
  name: string;
  inject?: string; // window.$onekey.stellar
}
