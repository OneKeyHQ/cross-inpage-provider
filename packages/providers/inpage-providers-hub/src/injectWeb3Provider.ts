/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { JsBridgeBase, ProviderBase } from '@onekeyfe/cross-inpage-provider-core';
import { IInjectedProviderNames, IJsonRpcRequest } from '@onekeyfe/cross-inpage-provider-types';
import { ProviderEthereum, shimWeb3 } from '@onekeyfe/onekey-eth-provider';
import { ProviderPrivate } from '@onekeyfe/onekey-private-provider';
import { ProviderSolana } from '@onekeyfe/onekey-solana-provider';
import { ProviderStarcoin } from '@onekeyfe/onekey-starcoin-provider';
import { ProviderAptos, ProviderAptosMartian } from '@onekeyfe/onekey-aptos-provider';
import { ProviderConflux } from '@onekeyfe/onekey-conflux-provider';
import { ProviderTron } from '@onekeyfe/onekey-tron-provider';
import { ProviderCardano } from '@onekeyfe/onekey-cardano-provider';
import { ProviderCosmos } from '@onekeyfe/onekey-cosmos-provider';
import { consts } from '@onekeyfe/cross-inpage-provider-core';
import { ProviderSui, registerSuiWallet } from '@onekeyfe/onekey-sui-provider';
import './connectButtonHack';
// import Web3 from 'web3'; // cause build error

const { WALLET_INFO_LOACAL_KEY } = consts;

export type IWindowOneKeyHub = {
  debugLogger?: any;
  jsBridge?: JsBridgeBase;
  ethereum?: ProviderEthereum;
  solana?: ProviderSolana;
  phantom?: { solana?: ProviderSolana };
  starcoin?: any;
  aptos?: ProviderAptos;
  martian?: ProviderAptosMartian;
  suiWallet?: ProviderSui;
  cardano?: ProviderCardano;
  keplr?: ProviderCosmos;
  $private?: ProviderPrivate;
  $walletInfo?: {
    buildNumber: string;
    isLegacy: boolean;
    disableExt?: boolean;
    platform: string;
    version: string;
    platformEnv: {
      isExtension: boolean;
      isDesktop: boolean;
      isNative: boolean;
    };
  };
};

function checkEnableDefineProperty() {
  try {
    const walletInfoLocalStr = localStorage.getItem(WALLET_INFO_LOACAL_KEY);
    const walletInfoLocal = walletInfoLocalStr ? JSON.parse(walletInfoLocalStr) : null;
    return !!walletInfoLocal?.platformEnv.isExtension;
  } catch (e) {
    console.error(e);
  }
  return false;
}

function defineWindowProperty(property: string, provider: unknown) {
  const enable = checkEnableDefineProperty();
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

function injectWeb3Provider(): unknown {
  if (!window?.$onekey?.jsBridge) {
    throw new Error('OneKey jsBridge not found.');
  }

  const bridge: JsBridgeBase = window?.$onekey?.jsBridge;

  const ethereum = new ProviderEthereum({
    bridge,
  });
  const $private = new ProviderPrivate({
    bridge,
  });
  const solana = new ProviderSolana({
    bridge,
  });

  const starcoin = new ProviderStarcoin({
    bridge,
  });

  const martian = new ProviderAptosMartian({
    bridge,
  });

  const conflux = new ProviderConflux({
    bridge,
  });

  const tron = new ProviderTron({
    bridge,
  });

  const sui = new ProviderSui({
    bridge,
  });

  const cardano = new ProviderCardano({
    bridge
  })
  
  const cosmos = new ProviderCosmos({
    bridge
  })

  // providerHub
  const $onekey = {
    ...window.$onekey,
    jsBridge: bridge,
    $private,
    ethereum,
    solana,
    starcoin,
    aptos: martian,
    conflux,
    tron,
    sollet: null,
    sui,
    cardano,
    cosmos
  };

  defineWindowProperty('$onekey', $onekey);

  try {
    const walletInfoLocalStr = localStorage.getItem(WALLET_INFO_LOACAL_KEY);
    const walletInfoLocal = walletInfoLocalStr ? JSON.parse(walletInfoLocalStr) : null;
    if (walletInfoLocal && walletInfoLocal.platformEnv.isExtension && walletInfoLocal.disableExt) {
      // disable onekey ext stop inject
      return;
    }
  } catch (e) {
    console.error(e);
  }

  const martianProxy = new Proxy(martian, {
    get: (target, property, ...args) => {
      if (property === 'aptosProviderType') {
        return 'martian';
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return Reflect.get(target, property, ...args);
    },
  });

  defineWindowProperty('ethereum', ethereum);
  defineWindowProperty('solana', solana);
  defineWindowProperty('phantom', { solana });
  defineWindowProperty('starcoin', starcoin);
  defineWindowProperty('aptos', martian);
  defineWindowProperty('martian', martianProxy);
  defineWindowProperty('conflux', conflux);
  defineWindowProperty('tronLink', tron);
  defineWindowProperty('suiWallet', sui);
  defineWindowProperty('cardano', cardano);

  // cosmos keplr
  defineWindowProperty('keplr', cosmos);
  defineWindowProperty('getOfflineSigner', cosmos.getOfflineSigner.bind(cosmos));
  defineWindowProperty('getOfflineSignerOnlyAmino', cosmos.getOfflineSignerOnlyAmino.bind(cosmos));
  defineWindowProperty('getOfflineSignerAuto', cosmos.getOfflineSignerAuto.bind(cosmos));

  // ** shim or inject real web3
  //
  // if (!window.web3) {
  //   // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-argument
  //   window.web3 = new Web3(ethereum as any);
  // }
  shimWeb3(ethereum);

  // TODO use initializeInpageProvider.ts
  window.dispatchEvent(new Event('ethereum#initialized'));

  registerSuiWallet(sui);

  return $onekey;
}
export { injectWeb3Provider };
