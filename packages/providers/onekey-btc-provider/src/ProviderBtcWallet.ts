import { getOrCreateExtInjectedJsBridge } from "@onekeyfe/extension-bridge-injected";
import { ProviderBtc } from "./ProviderBtc";
import {
  Fees,
  IProviderBtcWallet,
  OneKeyBtcProviderProps,
  ProviderMethods,
  UTXO,
  BalanceInfo,
} from "./types";

// For Babylon method
class ProviderBtcWallet extends ProviderBtc implements IProviderBtcWallet {
  constructor(props: OneKeyBtcProviderProps) {
    super({
      ...props,
      bridge:
        props.bridge ||
        getOrCreateExtInjectedJsBridge({ timeout: props.timeout }),
    });
    this._state.isBtcWalletProvider = true;
  }

  async connectWallet(): Promise<this> {
    await this.requestAccounts();
    return this
  }

  async signPsbt(
    psbtHex: string,
    options: { autoFinalized: boolean; isBtcWalletProvider: boolean } = {
      autoFinalized: true,
      isBtcWalletProvider: true,
    }
  ) {
    return this._request<string>({
      method: ProviderMethods.SIGN_PSBT,
      params: {
        psbtHex,
        options,
      },
    });
  }

  async signPsbts(
    psbtHexs: string[],
    options: { autoFinalized: boolean; isBtcWalletProvider: boolean } = {
      autoFinalized: true,
      isBtcWalletProvider: true,
    }
  ) {
    return this._request<string[]>({
      method: ProviderMethods.SIGN_PSBTS,
      params: {
        psbtHexs,
        options,
      },
    });
  }

  getWalletProviderName(): Promise<string> {
    this._state.isBtcWalletProvider = true;
    return Promise.resolve("OneKey");
  }

  async getAddress(): Promise<string> {
    this._state.isBtcWalletProvider = true;
    const addresses = await this.requestAccounts();
    return addresses?.[0] ?? 0;
  }

  getPublicKeyHex(): Promise<string> {
    return this.getPublicKey();
  }

  async getBalance(): Promise<BalanceInfo | number> {
    const result = (await this._request<number>({
      method: ProviderMethods.GET_BALANCE,
    })) as unknown as BalanceInfo;
		return result?.confirmed ?? 0;
  }

  signMessageBIP322(message: string): Promise<string> {
    return this.signMessage(message, "bip322-simple");
  }

  getNetworkFees(): Promise<Fees> {
    this._state.isBtcWalletProvider = true;
    return this._request<Fees>({
      method: ProviderMethods.GET_NETWORK_FEES,
    });
  }

  getUtxos(address: string, amount: number): Promise<UTXO[]> {
    return this._request<UTXO[]>({
      method: ProviderMethods.GET_UTXOS,
      params: {
        address,
        amount,
      },
    });
  }
}

export { ProviderBtcWallet };

export { IProviderBtcWallet };
