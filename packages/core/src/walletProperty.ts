/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { WALLET_INFO_LOACAL_KEY } from './consts';

/**
 * An enumeration mapping specific blockchain provider names to their corresponding blockchain identifiers.
 *
 * These mappings are used to handle special cases where the provider name needs to be translated into a specific blockchain identifier for various operations.
 *
 */
export enum ISpecialPropertyProviderNamesReflection {
  btc = 'unisat',
  sui = 'suiWallet',
  polkadot = 'polkadot-js',
}

export function checkWalletSwitchEnable(property: string) {
  try {
    const walletInfoLocalStr = localStorage.getItem(WALLET_INFO_LOACAL_KEY);
    const walletInfoLocal = walletInfoLocalStr ? JSON.parse(walletInfoLocalStr) : null;
    if (walletInfoLocal && walletInfoLocal.walletSwitchConfig) {
      const { enable, disable } = walletInfoLocal.walletSwitchConfig;
      const enableList: string[] = enable || [];
      const disableList: string[] = disable || [];
      return (
        (enableList.includes(property) && !disableList.includes(property)) ||
        (!enableList.includes(property) && !disableList.includes(property))
      );
    }
  } catch (e) {
    console.error(e);
  }
  return true;
}

export function checkEnableDefineProperty(property: string) {
  if (property === '$onekey') return false;
  try {
    const walletInfoLocalStr = localStorage.getItem(WALLET_INFO_LOACAL_KEY);
    const walletInfoLocal = walletInfoLocalStr ? JSON.parse(walletInfoLocalStr) : null;
    return !!walletInfoLocal?.platformEnv.isExtension;
  } catch (e) {
    console.error(e);
  }
  return false;
}

export function defineWindowProperty(property: string, provider: unknown) {
  if (!checkWalletSwitchEnable(property)) return;
  const enable = checkEnableDefineProperty(property);
  const proxyProvider = new Proxy(provider as object, {
    defineProperty(target, property, attributes) {
      // skip define Prevent overwriting
      return true;
    },
  });
  try {
    if (enable) {
      Object.keys(provider as object).forEach((key) => {
        ((window as any)[property] ?? {})[key] = (proxyProvider as any)[key];
      });
      Object.defineProperty(window, property, {
        configurable: false, // prevent redefined
        get() {
          return proxyProvider;
        },
        set(val) {
          // skip set
        },
      });
    } else {
      (window as any)[property] = provider;
    }
  } catch (ex) {
    console.error(ex);
    (window as any)[property] = provider;
  }
}
