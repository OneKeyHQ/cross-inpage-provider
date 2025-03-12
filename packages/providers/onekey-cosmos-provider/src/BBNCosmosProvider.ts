/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable tsdoc/syntax */
import { ProviderCosmos } from './OnekeyCosmosProvider';
import { OfflineAminoSigner, OfflineDirectSigner } from './types';

export interface IProviderBBNCosmos {
  /**
   * Connects to the wallet and returns the instance of the wallet provider.
   * @returns A promise that resolves to an instance of the wrapper wallet provider.
   * @throws An error if the wallet is not installed or if connection fails.
   */
  connectWallet(): Promise<void>;

  /**
   * Gets the address of the connected wallet.
   * @returns A promise that resolves to the address of the connected wallet.
   */
  getAddress(): Promise<string>;

  /**
   * Gets the public key of the connected wallet.
   * @returns A promise that resolves to the public key of the connected wallet.
   */
  getPublicKeyHex(): Promise<string>;

  /**
   * Gets the name of the wallet provider.
   * @returns A promise that resolves to the name of the wallet provider.
   */
  getWalletProviderName(): Promise<string>;

  /**
   * Gets the icon of the wallet provider.
   * @returns A promise that resolves to the icon of the wallet provider.
   */
  getWalletProviderIcon(): Promise<string>;

  /**
   * Retrieves an offline signer that supports both Amino and Direct signing methods.
   * This signer is used for signing transactions offline before broadcasting them to the network.
   *
   * @returns {Promise<OfflineAminoSigner & OfflineDirectSigner>} A promise that resolves to a signer supporting both Amino and Direct signing
   * @throws {Error} If wallet connection is not established or signer cannot be retrieved
   */
  getOfflineSigner(): Promise<OfflineAminoSigner & OfflineDirectSigner>;

  /**
   * Retrieves an offline signer that supports either Amino or Direct signing methods.
   * This is required for compatibility with older wallets and hardware wallets (like Ledger) that do not support both signing methods.
   * This signer is used for signing transactions offline before broadcasting them to the network.
   *
   * @returns {Promise<OfflineAminoSigner & OfflineDirectSigner>} A promise that resolves to a signer supporting either Amino or Direct signing
   * @throws {Error} If wallet connection is not established or signer cannot be retrieved
   */
  getOfflineSignerAuto?(): Promise<OfflineAminoSigner | OfflineDirectSigner>;
}

export class BBNProviderCosmos implements IProviderBBNCosmos {
  _provider: ProviderCosmos;
  _state: {
    chainId?: string;
    logo?: string;
  } = {};

  constructor(provider: ProviderCosmos, walletInfo: { logo: string }) {
    this._provider = provider;
    this._state = {
      logo: walletInfo.logo,
    };
  }

  async connectWallet(): Promise<void> {
    const chainId = await this._provider.babylonConnectWallet();
    this._state.chainId = chainId;
  }

  async getAddress(): Promise<string> {
    const account = await this._provider.babylonGetKey();
    if (!account) {
      throw new Error('No account found');
    }
    return Promise.resolve(account.bech32Address);
  }

  async getPublicKeyHex(): Promise<string> {
    const account = await this._provider.babylonGetKey();
    if (!account) {
      throw new Error('No account found');
    }
    return Promise.resolve(Buffer.from(account.pubKey).toString('hex'));
  }

  getWalletProviderName(): Promise<string> {
    return Promise.resolve('OneKey');
  }

  getWalletProviderIcon(): Promise<string> {
    return Promise.resolve(this._state.logo ?? '');
  }

  getOfflineSigner(): Promise<OfflineAminoSigner & OfflineDirectSigner> {
    if (!this._state.chainId) {
      throw new Error('Need connect wallet first');
    }
    return Promise.resolve(this._provider.getOfflineSigner(this._state.chainId));
  }

  async getOfflineSignerAuto(): Promise<OfflineAminoSigner | OfflineDirectSigner> {
    if (!this._state.chainId) {
      throw new Error('Need connect wallet first');
    }
    const key = await this._provider.getKey(this._state.chainId);
    if (key.isNanoLedger) {
      return this._provider.getOfflineSignerOnlyAmino(this._state.chainId);
    }
    return Promise.resolve(this._provider.getOfflineSigner(this._state.chainId));
  }
}
