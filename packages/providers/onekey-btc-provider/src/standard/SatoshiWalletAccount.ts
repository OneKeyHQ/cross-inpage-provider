import { BITCOIN_CHAINS } from '@exodus/bitcoin-wallet-standard-chains';
import {  type BitcoinAddressPurpose } from '@exodus/bitcoin-wallet-standard-features';
import type { WalletAccount } from '@wallet-standard/base';

const chains = BITCOIN_CHAINS;
const features = [] as const;

export class SatoshiWalletAccount implements WalletAccount {
  readonly _purpose: BitcoinAddressPurpose;
  readonly _address: WalletAccount['address'];
  readonly _publicKey: WalletAccount['publicKey'];
  readonly _chains: WalletAccount['chains'];
  readonly _features: WalletAccount['features'];
  readonly _label: WalletAccount['label'];
  readonly _icon: WalletAccount['icon'];

  get purpose() {
    return this._purpose;
  }

  get address() {
    return this._address;
  }

  get publicKey() {
    return this._publicKey.slice();
  }

  get chains() {
    return this._chains.slice();
  }

  get features() {
    return this._features.slice();
  }

  get label() {
    return this._label;
  }

  get icon() {
    return this._icon;
  }

  constructor({
    purpose,
    address,
    publicKey,
    label,
    icon,
  }: { purpose: BitcoinAddressPurpose } & Omit<WalletAccount, 'chains' | 'features'>) {
    this._purpose = purpose;
    this._address = address;
    this._publicKey = publicKey;
    this._chains = chains;
    this._features = features;
    this._label = label;
    this._icon = icon;
  }
}
