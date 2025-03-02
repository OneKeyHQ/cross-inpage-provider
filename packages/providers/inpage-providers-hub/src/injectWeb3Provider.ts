/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { JsBridgeBase } from '@onekeyfe/cross-inpage-provider-core';
import { ProviderEthereum, shimWeb3, registerEIP6963Provider } from '@onekeyfe/onekey-eth-provider';
import { ProviderPrivate } from '@onekeyfe/onekey-private-provider';
import { ProviderSolana, registerSolanaWallet, WalletIcon } from '@onekeyfe/onekey-solana-provider';
import {
  ProviderAptos,
  ProviderAptosMartian,
  registerAptosWallet,
} from '@onekeyfe/onekey-aptos-provider';
import { ProviderConflux } from '@onekeyfe/onekey-conflux-provider';
import { ProviderAlph, registerAlephiumProvider } from '@onekeyfe/onekey-alph-provider';
import { ProviderTron } from '@onekeyfe/onekey-tron-provider';
import { ProviderCardano, defineWindowCardanoProperty } from '@onekeyfe/onekey-cardano-provider';
import { ProviderCosmos, BBNProviderCosmos } from '@onekeyfe/onekey-cosmos-provider';
import { ProviderPolkadot, registerPolkadot } from '@onekeyfe/onekey-polkadot-provider';
import {
  defineWindowProperty,
  checkWalletSwitchEnable,
} from '@onekeyfe/cross-inpage-provider-core';
import { ProviderSui, registerSuiWallet } from '@onekeyfe/onekey-sui-provider';
import { ProviderBfc, registerBfcWallet } from '@onekeyfe/onekey-bfc-provider';
import { ProviderWebln } from '@onekeyfe/onekey-webln-provider';
import { ProviderScdo } from '@onekeyfe/onekey-scdo-provider';
import { createTonProviderOpenMask, ProviderTon } from '@onekeyfe/onekey-ton-provider';
import { ProviderNostr } from '@onekeyfe/onekey-nostr-provider';
import { ProviderBtc, ProviderBtcWallet } from '@onekeyfe/onekey-btc-provider';
import { ProviderAlgo } from '@onekeyfe/onekey-algo-provider';
import { ProviderNeo, NEOLineN3, emitNeoReadyEvent } from '@onekeyfe/onekey-neo-provider';
import { hackAllConnectButtons } from './connectButtonHack';
import { detectWebsiteRiskLevel, listenPageFocus } from './detectRiskWebsite';
import { injectFloatingButton } from './floatingButton';
import { WALLET_CONNECT_INFO } from './connectButtonHack/consts';

export type IWindowOneKeyHub = {
  debugLogger?: any;
  jsBridge?: JsBridgeBase;
  ethereum?: ProviderEthereum;
  solana?: ProviderSolana;
  phantom?: { solana?: ProviderSolana };
  aptos?: ProviderAptos;
  petra?: ProviderAptos;
  martian?: ProviderAptosMartian;
  suiWallet?: ProviderSui;
  bfcWallet?: ProviderBfc;
  cardano?: ProviderCardano;
  keplr?: ProviderCosmos;
  webln?: ProviderWebln;
  nostr?: ProviderNostr;
  ton?: ProviderTon;
  unisat?: ProviderBtc;
  btcwallet?: ProviderBtcWallet;
  alephium?: ProviderAlph;
  scdo?: ProviderScdo;
  NEOLineN3?: NEOLineN3; 
  NEOLine?: NEOLineN3;
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

function injectWeb3Provider({
  showFloatingButton = false,
}: { showFloatingButton?: boolean } = {}): unknown {
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

  const bfc = new ProviderBfc({
    bridge,
  });

  const cardano = new ProviderCardano({
    bridge,
  });

  const alephium = new ProviderAlph({
    bridge,
  });

  const tonconnect = new ProviderTon({
    bridge,
  });

  const cosmos = new ProviderCosmos({
    bridge,
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const bbnCosmos = new BBNProviderCosmos(cosmos, {
    logo: WALLET_CONNECT_INFO.onekey.icon,
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

  const scdo = new ProviderScdo({ bridge });
  
  const neo = new ProviderNeo({ bridge });
  NEOLineN3.instance = neo;

  // providerHub
  const $onekey = {
    ...window.$onekey,
    jsBridge: bridge,
    $private,
    ethereum,
    solana,
    // starcoin,
    aptos: martian,
    conflux,
    tron,
    sollet: null,
    sui,
    bfc,
    tonconnect,
    cardano,
    alephium,
    cosmos,
    bbnCosmos,
    scdo,
    webln,
    nostr,
    btc,
    btcwallet: btcWallet,
    algorand,
    neo: NEOLineN3,
  };

  defineWindowProperty('$onekey', $onekey, { enumerable: true, alwaysInject: true });

  defineWindowProperty('ethereum', ethereum);
  // OneKey Ethereum EIP6963 Provider
  registerEIP6963Provider({
    image: WALLET_CONNECT_INFO.onekey.icon,
    provider: ethereum,
  });

  // Override MetaMask EIP6963 Provider
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
  defineWindowProperty('phantom', { solana, ethereum });
  defineWindowProperty('aptos', martian);
  defineWindowProperty('petra', martian, { enumerable: true });
  defineWindowProperty('conflux', conflux);
  defineWindowProperty('alephium', alephium);
  defineWindowProperty('alephiumProviders', {
    alephium,
  });
  registerAlephiumProvider(alephium);
  defineWindowProperty('tronLink', tron);
  defineWindowProperty('suiWallet', sui);
  defineWindowProperty('bfcWallet', bfc);
  defineWindowProperty('onekeyTonWallet', {
    tonconnect,
  });
  defineWindowProperty('openmask', {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    tonconnect: createTonProviderOpenMask(tonconnect),
  });
  defineWindowProperty('unisat', btc);
  defineWindowProperty('scdo', scdo);
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

  // cosmos babylon
  if (checkWalletSwitchEnable()) {
    defineWindowProperty('bbnwallet', bbnCosmos);
  }

  // Lightning Network
  defineWindowProperty('webln', webln);
  defineWindowProperty('nostr', nostr);

  // NEO N3
  defineWindowProperty('NEOLineN3', NEOLineN3);
  defineWindowProperty('NEOLine', NEOLineN3);
  emitNeoReadyEvent();

  // ** shim or inject real web3
  //
  // if (!window.web3) {
  //   // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-argument
  //   window.web3 = new Web3(ethereum as any);
  // }
  shimWeb3(ethereum);

  // TODO use initializeInpageProvider.ts
  window.dispatchEvent(new Event('ethereum#initialized'));

  // OneKey Solana Standard Wallet
  registerSolanaWallet(solana, {
    icon: WALLET_CONNECT_INFO.onekey.icon as WalletIcon,
  });

  // OneKey Sui Standard Wallet
  registerSuiWallet(sui, {
    logo: WALLET_CONNECT_INFO.onekey.icon,
  });

  // OneKey Aptos Standard Wallet
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  registerAptosWallet(martian, {
    name: WALLET_CONNECT_INFO.onekey.text,
    logo: WALLET_CONNECT_INFO.onekey.icon as WalletIcon,
  });

  // Override Petra Aptos Standard Wallet
  if (checkWalletSwitchEnable()) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    registerAptosWallet(martian, {
      name: 'Martian',
      logo: WALLET_CONNECT_INFO.martian.icon as WalletIcon,
      url: 'https://chrome.google.com/webstore/detail/martian-wallet/efbglgofoippbgcjepnhiblaibcnclgk',
    });
  }

  if (checkWalletSwitchEnable()) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    registerAptosWallet(martian, {
      name: 'Pontem Wallet',
      logo: WALLET_CONNECT_INFO.pontem.icon as WalletIcon,
      url: 'https://pontem.network/pontem-wallet',
    });
  }

  // Override the SuiWallet Standard Wallet
  if (checkWalletSwitchEnable()) {
    registerSuiWallet(sui, {
      name: 'Sui Wallet',
      logo: WALLET_CONNECT_INFO.onekey.icon,
    });
  }

  // OneKey BFC Standard Wallet
  registerBfcWallet(bfc, {
    logo: WALLET_CONNECT_INFO.onekey.icon,
  });

  // OneKey Polkadot Standard Wallet
  registerPolkadot(polkadot);

  // Override Polkadot Standard Wallet
  if (checkWalletSwitchEnable()) {
    registerPolkadot(polkadot, 'polkadot-js', '0.44.1');
  }
  setTimeout(() => {
    void detectWebsiteRiskLevel();
    if (showFloatingButton) {
      void injectFloatingButton();
    }
    void hackAllConnectButtons();
    void listenPageFocus();
  }, 1000);

  return $onekey;
}
export { injectWeb3Provider };
