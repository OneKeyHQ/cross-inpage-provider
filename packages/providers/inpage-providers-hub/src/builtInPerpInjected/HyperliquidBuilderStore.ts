import { isNumber } from 'lodash-es';
import { LocalStorageStore } from '../utils/LocalStorageStore';

const prefix = 'hyperliquid.k_config_v3.'; //builder
const storageKeys = {
  expectBuilderAddress: 'a',
  expectMaxBuilderFee: 'f',
  customSettings: 's',
};

export type IHyperliquidBuilderCustomSettings = {
  hideNavBar?: boolean;
  hideNavBarConnectButton?: boolean;
  hideNotOneKeyWalletConnectButton?: boolean;
};

export class HyperliquidBuilderStore {
  private static store = new LocalStorageStore(prefix);
  private static _expectBuilderAddress: string | undefined;
  private static _expectMaxBuilderFee: number | undefined;
  private static _customSettings: IHyperliquidBuilderCustomSettings | undefined;

  static get expectBuilderAddress(): string | undefined {
    if (this._expectBuilderAddress === undefined) {
      this._expectBuilderAddress = this.store.get<string>(storageKeys.expectBuilderAddress);
    }
    return this._expectBuilderAddress;
  }

  static set expectBuilderAddress(value: string | undefined) {
    this._expectBuilderAddress = value;
    if (value === undefined) {
      this.store.remove(storageKeys.expectBuilderAddress);
    } else {
      this.store.set(storageKeys.expectBuilderAddress, value);
    }
  }

  static get expectMaxBuilderFee(): number | undefined {
    if (this._expectMaxBuilderFee === undefined) {
      this._expectMaxBuilderFee = this.store.get<number>(storageKeys.expectMaxBuilderFee);
    }
    return this._expectMaxBuilderFee;
  }

  static set expectMaxBuilderFee(value: number | undefined) {
    this._expectMaxBuilderFee = value;
    if (value === undefined) {
      this.store.remove(storageKeys.expectMaxBuilderFee);
    } else {
      this.store.set(storageKeys.expectMaxBuilderFee, value);
    }
  }

  static get customSettings():
    | {
        hideNavBar?: boolean;
        hideNavBarConnectButton?: boolean;
        hideNotOneKeyWalletConnectButton?: boolean;
      }
    | undefined {
    if (this._customSettings === undefined) {
      this._customSettings = this.store.get<IHyperliquidBuilderCustomSettings>(
        storageKeys.customSettings,
      );
    }
    return this._customSettings;
  }

  static set customSettings(value: IHyperliquidBuilderCustomSettings | undefined) {
    this._customSettings = value;
    if (value === undefined) {
      this.store.remove(storageKeys.customSettings);
    } else {
      this.store.set(storageKeys.customSettings, value);
    }
  }

  static updateBuilderInfo(address: string, fee: number): void {
    this.expectBuilderAddress = address;
    this.expectMaxBuilderFee = fee;
  }

  static getAvailableBuilderInfo():
    | {
        address: string;
        fee: number;
      }
    | undefined {
    if (
      HyperliquidBuilderStore?.storeUpdateByOneKeyWallet &&
      HyperliquidBuilderStore?.expectBuilderAddress &&
      isNumber(HyperliquidBuilderStore?.expectMaxBuilderFee) &&
      HyperliquidBuilderStore?.expectMaxBuilderFee >= 0
    ) {
      return {
        address: HyperliquidBuilderStore?.expectBuilderAddress?.toLowerCase?.(),
        fee: HyperliquidBuilderStore?.expectMaxBuilderFee,
      };
    }
    return undefined;
  }

  static flush(): void {
    this.store.flush();
  }

  static storeUpdateByOneKeyWallet = false;
}
