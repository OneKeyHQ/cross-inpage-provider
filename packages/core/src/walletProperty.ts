/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { WALLET_INFO_LOACAL_KEY_V5 } from './consts';

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

export function checkWalletSwitchEnable() {
  try {
    const foo = 1
    if (foo === 1) {
      return true
    }
    const walletInfoLocalStr = localStorage.getItem(WALLET_INFO_LOACAL_KEY_V5);
    const walletInfoLocal = walletInfoLocalStr ? JSON.parse(walletInfoLocalStr) : null;
    console.log('===>: walletInfoLocal: ', walletInfoLocal)
    if (!walletInfoLocal?.isDefaultWallet) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('OneKey is not default wallet')
      }
      return false
    }
    if (Array.isArray(walletInfoLocal?.excludedDappList)) {
      const currentOrigin = window.location.origin;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      if (walletInfoLocal.excludedDappList.includes(currentOrigin)) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('skip inject web3 provider: ', currentOrigin)
        }
        return false;
      }
    }
    return true
  } catch (e) {
    console.error(e);
  }
  return true;
}

export function checkEnableDefineProperty(property: string) {
  if (property === '$onekey') return false;
  try {
    const walletInfoLocalStr = localStorage.getItem(WALLET_INFO_LOACAL_KEY_V5);
    const walletInfoLocal = walletInfoLocalStr ? JSON.parse(walletInfoLocalStr) : null;
    return !!walletInfoLocal?.platformEnv.isExtension;
  } catch (e) {
    console.error(e);
  }
  return false;
}

export function defineWindowProperty(
  property: string,
  provider: unknown,
  options?: {
    enumerable?: boolean;
  },
) {
  if (!checkWalletSwitchEnable()) return;
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
        enumerable: options?.enumerable ?? false, // Object.keys loop check inject
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
    try {
      (window as any)[property] = provider;
    } catch (error) {
      console.error(error);
    }
  }
}
