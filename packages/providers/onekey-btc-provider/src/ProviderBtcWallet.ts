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

// Sign options accepted on the btcwallet channel. Callers (e.g. Babylon's
// wallet-connector) may pass extra UniSat-compatible fields such as
// `toSignInputs`; they are forwarded to the wallet untouched.
type BtcWalletSignPsbtOptions = {
  autoFinalized?: boolean;
  isBtcWalletProvider?: boolean;
  [key: string]: unknown;
};

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

  // `isBtcWalletProvider: true` marks requests from this channel so the wallet
  // can recognize pre-signed alternative transactions (e.g. Babylon payout /
  // recovery psbts spending the same outpoint, never broadcast together). It
  // used to live only in the parameter DEFAULT, so any caller passing its own
  // options (Babylon's wallet-connector does) silently dropped the flag.
  // Always merge it in instead.
  async signPsbt(psbtHex: string, options?: BtcWalletSignPsbtOptions) {
    return this._request<string>({
      method: ProviderMethods.SIGN_PSBT,
      params: {
        psbtHex,
        options: { autoFinalized: true, ...options, isBtcWalletProvider: true },
      },
    });
  }

  async signPsbts(
    psbtHexs: string[],
    options?: BtcWalletSignPsbtOptions | BtcWalletSignPsbtOptions[]
  ) {
    // UniSat-compatible callers pass one options entry per psbt; merge the
    // flag into every entry (missing entries still get the flag, and keep
    // `autoFinalized` undefined so wallet-side defaults stay unchanged).
    const mergedOptions = Array.isArray(options)
      ? psbtHexs.map((_, index) => ({
          ...options[index],
          isBtcWalletProvider: true,
        }))
      : { autoFinalized: true, ...options, isBtcWalletProvider: true };
    return this._request<string[]>({
      method: ProviderMethods.SIGN_PSBTS,
      params: {
        psbtHexs,
        options: mergedOptions,
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
		return Number(result?.confirmed ?? 0);
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

  getBTCTipHeight(): Promise<number> {
    return this._request<number>({
      method: ProviderMethods.GET_BTC_TIP_HEIGHT,
      params: undefined,
    });
  }
}

export { ProviderBtcWallet };

export { IProviderBtcWallet };
