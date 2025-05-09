import { type ProviderEthereum } from '../ProviderEthereum';

export class MetaMaskSDK {
  constructor(provider: ProviderEthereum) {
    this.activeProvider = provider;
  }

  public activeProvider: ProviderEthereum;
  public _initialized = false;

  public getProvider() {
    return this.activeProvider;
  }

  public isInitialized() {
    return false
  }

  public init() {
    return;
  }
}
