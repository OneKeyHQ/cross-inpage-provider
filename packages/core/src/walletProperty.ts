/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { WALLET_INFO_LOACAL_KEY_V5 } from './consts';
import { commonLogger } from './loggerConsole';

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

export type IPlatformType = 'native' | 'extension' | 'web' | 'desktop';

export function checkPlatformEnable(disablePlatform?: IPlatformType[]) {
  const walletInfoLocalStr = localStorage.getItem(WALLET_INFO_LOACAL_KEY_V5);
  const walletInfoLocal = walletInfoLocalStr ? JSON.parse(walletInfoLocalStr) : null;

  if (!walletInfoLocal) {
    return true;
  }
  if (disablePlatform) {
    for (const platform of disablePlatform) {
      if (platform === 'web' && walletInfoLocal?.platformEnv?.isWeb) {
        return false;
      }
      if (platform === 'desktop' && walletInfoLocal?.platformEnv?.isDesktop) {
        return false;
      }
      if (platform === 'extension' && walletInfoLocal?.platformEnv?.isExtension) {
        return false;
      }
      if (platform === 'native' && walletInfoLocal?.platformEnv?.isNative) {
        return false;
      }
    }
  }
  return true;
}

export function checkWalletSwitchEnable() {
  try {
    const walletInfoLocalStr = localStorage.getItem(WALLET_INFO_LOACAL_KEY_V5);
    const walletInfoLocal = walletInfoLocalStr ? JSON.parse(walletInfoLocalStr) : null;
    if (!walletInfoLocal) {
      return true;
    }
    if (!walletInfoLocal?.isDefaultWallet) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('OneKey is not default wallet');
      }
      return false;
    }
    if (Array.isArray(walletInfoLocal?.excludedDappList)) {
      const currentOrigin = window.location.origin;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      if (walletInfoLocal.excludedDappList.includes(currentOrigin)) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('skip inject web3 provider: ', currentOrigin);
        }
        return false;
      }
    }
    return true;
  } catch (e) {
    commonLogger.warn(e);
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
    commonLogger.warn(e);
  }
  return false;
}

export function defineWindowProperty(
  property: string,
  provider: unknown,
  options?: {
    enumerable?: boolean;
    disablePlatform?: IPlatformType[];
    alwaysInject?: boolean;
  },
) {
  if (!options?.alwaysInject) {
    if (!checkPlatformEnable(options?.disablePlatform)) return;
    if (!checkWalletSwitchEnable()) return;
  }
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
    commonLogger.error(ex);
    try {
      (window as any)[property] = provider;
    } catch (error) {
      commonLogger.warn(error);
    }
  }
}
