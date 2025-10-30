/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  checkWalletSwitchEnable,
  defineWindowProperty,
  JsBridgeBase,
  isOneKeyWebsite
} from '@onekeyfe/cross-inpage-provider-core';
import { ProviderAlgo } from '@onekeyfe/onekey-algo-provider';
import { ProviderAlph, registerAlephiumProvider } from '@onekeyfe/onekey-alph-provider';
import {
  ProviderAptos,
  ProviderAptosMartian,
  registerAptosWallet,
} from '@onekeyfe/onekey-aptos-provider';
import { ProviderBfc, registerBfcWallet } from '@onekeyfe/onekey-bfc-provider';
import { ProviderBtc, ProviderBtcWallet } from '@onekeyfe/onekey-btc-provider';
import { defineWindowCardanoProperty, ProviderCardano } from '@onekeyfe/onekey-cardano-provider';
import { ProviderConflux } from '@onekeyfe/onekey-conflux-provider';
import { BBNProviderCosmos, ProviderCosmos } from '@onekeyfe/onekey-cosmos-provider';
import {
  METAMASK_UUID,
  MetaMaskSDK,
  ProviderEthereum,
  registerEIP6963Provider,
  shimWeb3,
} from '@onekeyfe/onekey-eth-provider';
import { emitNeoReadyEvent, NEOLineN3, ProviderNeo } from '@onekeyfe/onekey-neo-provider';
import { ProviderNostr } from '@onekeyfe/onekey-nostr-provider';
import { ProviderPolkadot, registerPolkadot } from '@onekeyfe/onekey-polkadot-provider';
import { ProviderPrivate } from '@onekeyfe/onekey-private-provider';
import { ProviderScdo } from '@onekeyfe/onekey-scdo-provider';
import { ProviderSolana, registerSolanaWallet, WalletIcon } from '@onekeyfe/onekey-solana-provider';
import { ProviderSui, registerSuiWallet } from '@onekeyfe/onekey-sui-provider';
import { createTonProviderOpenMask, ProviderTon } from '@onekeyfe/onekey-ton-provider';
import { ProviderTron, registerTIP6963Provider } from '@onekeyfe/onekey-tron-provider';
import { ProviderWebln } from '@onekeyfe/onekey-webln-provider';
import builtInPerpInjected from './builtInPerpInjected';
import { hackAllConnectButtons } from './connectButtonHack';
import { WALLET_CONNECT_INFO } from './connectButtonHack/consts';
import { detectWebsiteRiskLevel, listenPageFocus } from './detectRiskWebsite';
import { injectFloatingButton } from './floatingButton';
import hyperLiquidOneKeyWalletApi from './builtInPerpInjected/hyperLiquidOneKeyWalletApi';

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

  const builtInPerpInjectedInstance = builtInPerpInjected.createInstance();
  if (builtInPerpInjectedInstance && window?.$onekey) {
    // @ts-ignore
    window.$onekey.$builtInPerpInjected = builtInPerpInjectedInstance;
  }

  const ethereum = new ProviderEthereum({
    bridge,
  });

  void hyperLiquidOneKeyWalletApi.initHyperliquidBuilderFeeConfig(ethereum);

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

  if (!isOneKeyWebsite()) {
    defineWindowProperty('ethereum', ethereum);
  }
  // OneKey Ethereum EIP6963 Provider
  registerEIP6963Provider({
    image: WALLET_CONNECT_INFO.onekey.icon,
    provider: ethereum,
  });

  // Override MetaMask EIP6963 Provider
  if (checkWalletSwitchEnable() && !isOneKeyWebsite()) {
    registerEIP6963Provider({
      uuid: METAMASK_UUID,
      name: 'MetaMask',
      rdns: 'io.metamask',
      image: WALLET_CONNECT_INFO.metamask.icon,
      provider: ethereum,
    });
    defineWindowProperty('mmsdk', new MetaMaskSDK(ethereum));
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
  defineWindowProperty('tronOfTronLink', tron);
  // OneKey Ethereum EIP6963 Provider
  registerTIP6963Provider({
    image: WALLET_CONNECT_INFO.onekey.icon,
    provider: tron,
  });
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

  if (!['core.allbridge.io'].includes(window.location.hostname)) {
    defineWindowProperty('exodus', {
      algorand,
      ethereum,
    });
  }

  // Cardano chain provider injection is handled independently.
  if (checkWalletSwitchEnable()) {
    defineWindowCardanoProperty('cardano', cardano);
  }

  // cosmos keplr
  defineWindowProperty('keplr', cosmos);
  (window as any).keplrRequestMetaIdSupport = true; // support keplr request meta id
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

  registerSolanaWallet(solana, {
    icon: WALLET_CONNECT_INFO.solflare.icon as WalletIcon,
    name: 'Solflare',
  });

  registerSolanaWallet(solana, {
    icon: WALLET_CONNECT_INFO.backpack.icon as WalletIcon,
    name: 'Backpack',
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
      name: 'Petra',
      logo: WALLET_CONNECT_INFO.petra.icon as WalletIcon,
      url: 'https://chromewebstore.google.com/detail/petra-aptos-wallet/ejjladinnckdgjemekebdpeokbikhfci',
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

  if (checkWalletSwitchEnable()) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    registerSuiWallet(sui, {
      name: 'Slush',
      logo: WALLET_CONNECT_INFO.slush.icon as WalletIcon,
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
