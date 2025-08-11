import { LocalStorageStore } from '../utils/LocalStorageStore';

const prefix = 'hyperliquid.k_config_v3.'; //builder
const expectBuilderAddressKey = 'a';
const expectMaxBuilderFeeKey = 'v';

// HyperliquidBuilderStore 封装类
export class HyperliquidBuilderStore {
  private static store = new LocalStorageStore(prefix);
  private static _expectBuilderAddress: string | undefined;
  private static _expectMaxBuilderFee: number | undefined;

  // expectBuilderAddress 的 getter/setter
  static get expectBuilderAddress(): string | undefined {
    if (this._expectBuilderAddress === undefined) {
      this._expectBuilderAddress = this.store.get<string>(expectBuilderAddressKey);
    }
    return this._expectBuilderAddress;
  }

  static set expectBuilderAddress(value: string | undefined) {
    this._expectBuilderAddress = value;
    if (value === undefined) {
      this.store.remove(expectBuilderAddressKey);
    } else {
      this.store.set(expectBuilderAddressKey, value);
    }
  }

  // expectMaxBuilderFee 的 getter/setter
  static get expectMaxBuilderFee(): number | undefined {
    if (this._expectMaxBuilderFee === undefined) {
      this._expectMaxBuilderFee = this.store.get<number>(expectMaxBuilderFeeKey);
    }
    return this._expectMaxBuilderFee;
  }

  static set expectMaxBuilderFee(value: number | undefined) {
    this._expectMaxBuilderFee = value;
    if (value === undefined) {
      this.store.remove(expectMaxBuilderFeeKey);
    } else {
      this.store.set(expectMaxBuilderFeeKey, value);
    }
  }

  // 批量更新
  static updateBuilderInfo(address: string, fee: number): void {
    this.expectBuilderAddress = address;
    this.expectMaxBuilderFee = fee;
  }

  // 立即刷新到 localStorage
  static flush(): void {
    this.store.flush();
  }
}
