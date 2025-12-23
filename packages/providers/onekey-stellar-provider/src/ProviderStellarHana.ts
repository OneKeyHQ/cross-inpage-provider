import type { ProviderStellar } from './OnekeyStellarProvider';

// Hana wallet interface types
export type SignTransactionProps = {
  xdr: string;
  accountToSign?: string;
  networkPassphrase?: string;
};

export type SignBlobProps = {
  blob: string;
  accountToSign?: string;
};

export type SignAuthEntryProps = {
  xdr: string;
  accountToSign?: string;
};

export type SignMessageProps = {
  message: string;
  accountToSign?: string;
};

/**
 * Hana Wallet compatible wrapper for ProviderStellar
 * Adapts OneKey Stellar Provider to match Hana wallet's interface
 */
export class ProviderStellarHana {
  constructor(private provider: ProviderStellar) {}

  /**
   * Get the public key of the current account
   * @returns Promise<string> - The public key/address
   */
  async getPublicKey(): Promise<string> {
    const result = await this.provider.getAddress();
    return result.address;
  }

  /**
   * Sign a transaction in XDR format
   * @param params - Transaction signing parameters
   * @returns Promise<string> - The signed transaction XDR
   */
  async signTransaction({ xdr, accountToSign, networkPassphrase }: SignTransactionProps): Promise<string> {
    const result = await this.provider.signTransaction(xdr, {
      address: accountToSign,
      networkPassphrase,
    });
    return result.signedTxXdr;
  }

  /**
   * Sign a blob (arbitrary data)
   * Note: This is implemented using signMessage as ProviderStellar doesn't have a separate blob signing method
   * @param params - Blob signing parameters
   * @returns Promise<string> - The signed blob
   */
  async signBlob({ blob, accountToSign }: SignBlobProps): Promise<string> {
    const result = await this.provider.signMessage(blob, {
      address: accountToSign,
    });
    return result.signedMessage;
  }

  /**
   * Sign an AuthEntry in XDR format
   * @param params - AuthEntry signing parameters
   * @returns Promise<string> - The signed AuthEntry XDR
   */
  async signAuthEntry({ xdr, accountToSign }: SignAuthEntryProps): Promise<string> {
    const result = await this.provider.signAuthEntry(xdr, {
      address: accountToSign,
    });
    return result.signedAuthEntry;
  }

  /**
   * Sign an arbitrary message
   * @param params - Message signing parameters
   * @returns Promise<string> - The signed message
   */
  async signMessage({ message, accountToSign }: SignMessageProps): Promise<string> {
    const result = await this.provider.signMessage(message, {
      address: accountToSign,
    });
    return result.signedMessage;
  }

  /**
   * Get the current network configuration
   * @returns Promise<{network: string, networkPassphrase: string}>
   */
  async getNetwork() {
    return this.provider.getNetwork();
  }

  /**
   * Disconnect from the wallet
   */
  async disconnect(): Promise<void> {
    return this.provider.disconnect();
  }
}
