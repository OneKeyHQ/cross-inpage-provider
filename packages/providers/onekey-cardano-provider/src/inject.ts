/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import type { ProviderCardano } from './ProviderCardano';

const PROXY_WALLETS = ['nami', 'yoroi'] as const;

type ProxyWalletName = typeof PROXY_WALLETS[number];

const proxyWalletConfigs: Record<ProxyWalletName, { name: string }> = {
  nami: { name: 'Nami' },
  yoroi: { name: 'yoroi' },
};

/**
 * Define window.cardano property
 * - Always injects OneKey wallet
 * - Injects proxy wallets (Nami, etc.) only when registerProxyWallets is true
 */
export function defineWindowCardanoProperty(
  property: string,
  provider: ProviderCardano,
  options?: { registerProxyWallets?: boolean },
) {
  const walletInfo = provider.walletInfo();
  const protectedKeys: string[] = ['onekey'];

  // Always register OneKey wallet
  (provider as any).onekey = walletInfo;

  // Register proxy wallets on the provider instance if needed
  if (options?.registerProxyWallets) {
    PROXY_WALLETS.forEach((walletKey) => {
      const config = proxyWalletConfigs[walletKey];
      (provider as any)[walletKey] = {
        ...walletInfo,
        name: config.name,
      };
      protectedKeys.push(walletKey);
    });
  }

  const proxyProvider = new Proxy(provider as object, {
    defineProperty(target, prop, attributes) {
      if (protectedKeys.includes(prop as string)) {
        // skip define to prevent overwriting
        return true;
      }
      return Reflect.defineProperty(target, prop, attributes);
    },
  });

  Object.keys(provider as object).forEach((key) => {
    ((window as any)[property] ?? {})[key] = (proxyProvider as any)[key];
  });

  Object.defineProperty(window, property, {
    configurable: false, // prevent redefined
    get() {
      return proxyProvider;
    },
    set() {
      // skip set
    },
  });
}
