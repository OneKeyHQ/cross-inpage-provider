/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { JsBridgeBase } from '@onekeyfe/cross-inpage-provider-core';
import { ProviderEthereum, shimWeb3, registerEIP6963Provider } from '@onekeyfe/onekey-eth-provider';
import { ProviderPrivate } from '@onekeyfe/onekey-private-provider';
import { ProviderSolana, registerSolanaWallet, WalletIcon } from '@onekeyfe/onekey-solana-provider';
// import { ProviderStarcoin } from '@onekeyfe/onekey-starcoin-provider';
import { ProviderAptos, ProviderAptosMartian } from '@onekeyfe/onekey-aptos-provider';
import { ProviderConflux } from '@onekeyfe/onekey-conflux-provider';
import { ProviderTron } from '@onekeyfe/onekey-tron-provider';
import { ProviderCardano, defineWindowCardanoProperty } from '@onekeyfe/onekey-cardano-provider';
// import { ProviderPrivateExternalAccount } from '@onekeyfe/onekey-private-external-account-provider';
import { ProviderCosmos } from '@onekeyfe/onekey-cosmos-provider';
import { ProviderPolkadot, registerPolkadot } from '@onekeyfe/onekey-polkadot-provider';
import {
  defineWindowProperty,
  checkWalletSwitchEnable,
} from '@onekeyfe/cross-inpage-provider-core';
import { ProviderSui, registerSuiWallet } from '@onekeyfe/onekey-sui-provider';
import { ProviderWebln } from '@onekeyfe/onekey-webln-provider';
// import { ProviderScdo } from '@onekeyfe/onekey-scdo-provider';
// import { ProviderTon } from '@onekeyfe/onekey-ton-provider';
import { ProviderNostr } from '@onekeyfe/onekey-nostr-provider';
import { ProviderBtc, ProviderBtcWallet } from '@onekeyfe/onekey-btc-provider';
import { ProviderAlgo } from '@onekeyfe/onekey-algo-provider';
import { hackAllConnectButtons } from './connectButtonHack';
import { detectWebsiteRiskLevel } from './detectRiskWebsite';
import { WALLET_CONNECT_INFO } from './connectButtonHack/consts';
// import Web3 from 'web3'; // cause build error

export type IWindowOneKeyHub = {
  debugLogger?: any;
  jsBridge?: JsBridgeBase;
  ethereum?: ProviderEthereum;
  solana?: ProviderSolana;
  phantom?: { solana?: ProviderSolana };
  // starcoin?: any;
  aptos?: ProviderAptos;
  petra?: ProviderAptos;
  martian?: ProviderAptosMartian;
  suiWallet?: ProviderSui;
  cardano?: ProviderCardano;
  keplr?: ProviderCosmos;
  webln?: ProviderWebln;
  nostr?: ProviderNostr;
  // ton?: ProviderTon;
  unisat?: ProviderBtc;
  btcwallet?: ProviderBtcWallet;
  // scdo?: ProviderScdo;
  $private?: ProviderPrivate;
  $walletInfo?: {
    buildNumber: string;
    disableExt?: boolean;
    isLegacy: boolean;
    isDefaultWallet?: boolean;
    excludedDappList: string[];
    platform: string;
    version: string;
    platformEnv: {
      isExtension: boolean;
      isDesktop: boolean;
      isNative: boolean;
    };
  };
};

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

  // const starcoin = new ProviderStarcoin({
  //   bridge,
  // });

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
    bridge,
  });

  // const tonconnect = new ProviderTon({
  //   bridge,
  // });

  const cosmos = new ProviderCosmos({
    bridge,
  });

  const polkadot = new ProviderPolkadot({
    bridge,
  });

  const webln = new ProviderWebln({
    bridge,
  });

  const nostr = new ProviderNostr({
    bridge,
  });

  const btc = new ProviderBtc({ bridge });
  const btcWallet = new ProviderBtcWallet({ bridge });

  const algorand = new ProviderAlgo({ bridge });

  // const scdo = new ProviderScdo({ bridge });

  // const $privateExternalAccount = new ProviderPrivateExternalAccount({ bridge });

  // providerHub
  const $onekey = {
    ...window.$onekey,
    jsBridge: bridge,
    $private,
    // $privateExternalAccount,
    ethereum,
    solana,
    // starcoin,
    aptos: martian,
    conflux,
    tron,
    sollet: null,
    sui,
    // tonconnect,
    cardano,
    cosmos,
    // scdo,
    webln,
    nostr,
    btc,
    btcwallet: btcWallet,
    algorand,
  };

  defineWindowProperty('$onekey', $onekey, { enumerable: true, alwaysInject: true });

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
  registerEIP6963Provider({
    image: WALLET_CONNECT_INFO.onekey.icon,
    provider: ethereum,
  });

  if (checkWalletSwitchEnable()) {
    registerEIP6963Provider({
      uuid: '7677b54f-3486-46e2-4e37-bf8747814f',
      name: 'MetaMask',
      rdns: 'io.metamask',
      image: WALLET_CONNECT_INFO.metamask.icon,
      provider: ethereum,
    });
  }

  defineWindowProperty('solana', solana);
  defineWindowProperty('phantom', { solana });
  // defineWindowProperty('starcoin', starcoin);
  defineWindowProperty('aptos', martian);
  defineWindowProperty('petra', martian, { enumerable: true });
  defineWindowProperty('martian', martianProxy, { enumerable: true });
  defineWindowProperty('conflux', conflux);
  defineWindowProperty('tronLink', tron);
  defineWindowProperty('suiWallet', sui);
  // defineWindowProperty('onekeyTonWallet', {
  //   tonconnect,
  // });
  // defineWindowProperty('tonkeeper', {
  //   tonconnect,
  // });
  defineWindowProperty('unisat', btc);
  // defineWindowProperty('scdo', scdo);
  defineWindowProperty('algorand', algorand);
  defineWindowProperty('exodus', {
    algorand,
  });

  // Cardano chain provider injection is handled independently.
  if (checkWalletSwitchEnable()) {
    defineWindowCardanoProperty('cardano', cardano);
  }

  // cosmos keplr
  defineWindowProperty('keplr', cosmos);
  defineWindowProperty('getOfflineSigner', cosmos.getOfflineSigner.bind(cosmos));
  defineWindowProperty('getOfflineSignerOnlyAmino', cosmos.getOfflineSignerOnlyAmino.bind(cosmos));
  defineWindowProperty('getOfflineSignerAuto', cosmos.getOfflineSignerAuto.bind(cosmos));

  // Lightning Network
  defineWindowProperty('webln', webln);
  defineWindowProperty('nostr', nostr);

  // ** shim or inject real web3
  //
  // if (!window.web3) {
  //   // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-argument
  //   window.web3 = new Web3(ethereum as any);
  // }
  shimWeb3(ethereum);

  // TODO use initializeInpageProvider.ts
  window.dispatchEvent(new Event('ethereum#initialized'));

  // Solana Standard Wallet
  if (checkWalletSwitchEnable()) {
    registerSolanaWallet(solana, {
      icon: WALLET_CONNECT_INFO.onekey.icon as WalletIcon,
    });
  }

  // Sui Standard Wallet
  if (checkWalletSwitchEnable()) {
    registerSuiWallet(sui, {
      logo: WALLET_CONNECT_INFO.onekey.icon,
    });
  }

  // Override the SuiWallet Standard Wallet
  if (checkWalletSwitchEnable()) {
    registerSuiWallet(sui, {
      name: 'Sui Wallet',
      logo: WALLET_CONNECT_INFO.onekey.icon,
    });
  }

  if (checkWalletSwitchEnable()) {
    registerPolkadot(polkadot);
  }

  if (checkWalletSwitchEnable()) {
    registerPolkadot(polkadot, 'polkadot-js', '0.44.1');
  }
  setTimeout(() => {
    void detectWebsiteRiskLevel();
    void hackAllConnectButtons();
  }, 1000);
  return $onekey;
}
export { injectWeb3Provider };
