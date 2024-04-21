import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO, WALLET_NAMES } from '../consts';
import { findIconAndNameDirectly } from './findIconAndName';
import { findWalletIconByParent, replaceIcon } from './imgUtils';
import { findIconAndNameInShadowRoot } from './shadowRoot';
import { FindResultType, Selector } from './type';
import { getConnectWalletModalByTitle, getWalletListByBtn, isVisible } from './utils';
import { findWalletTextByParent } from './textUtils';
import domUtils from '../utils/utilsDomNodes';

export const basicWalletInfo = {
  [WALLET_NAMES.metamask]: {
    updatedIcon: WALLET_CONNECT_INFO.metamask.icon,
    updatedName: WALLET_CONNECT_INFO.metamask.text,
    name: /^meta\s*mask$/i,
  },
  [WALLET_NAMES.walletconnect]: {
    updatedIcon: WALLET_CONNECT_INFO.walletconnect.icon,
    updatedName: WALLET_CONNECT_INFO.walletconnect.text,
    name: /^wallet\s*connect$/i,
  },
  [WALLET_NAMES.suiwallet]: {
    updatedIcon: WALLET_CONNECT_INFO.suiwallet.icon,
    updatedName: WALLET_CONNECT_INFO.suiwallet.text,
    name: /^(sui|Sui\s?Wallet)$/i,
  },
  [WALLET_NAMES.phantom]: {
    updatedIcon: WALLET_CONNECT_INFO.phantom.icon,
    updatedName: WALLET_CONNECT_INFO.phantom.text,
    name: /^phantom$/i,
  },
  [WALLET_NAMES.unisat]: {
    updatedIcon: WALLET_CONNECT_INFO.unisat.icon,
    updatedName: WALLET_CONNECT_INFO.unisat.text,
    name: /^(unisat|Unisat Wallet)$/i,
  },
  [WALLET_NAMES.tronlink]: {
    updatedIcon: WALLET_CONNECT_INFO.tronlink.icon,
    updatedName: WALLET_CONNECT_INFO.tronlink.text,
    name: /^tronlink$/i,
  },
  [WALLET_NAMES.petra]: {
    updatedIcon: WALLET_CONNECT_INFO.petra.icon,
    updatedName: WALLET_CONNECT_INFO.petra.text,
    name: /^Petra$/i,
  },
  [WALLET_NAMES.keplr]: {
    updatedIcon: WALLET_CONNECT_INFO.keplr.icon,
    updatedName: WALLET_CONNECT_INFO.keplr.text,
    name: /^(Keplr|Keplr Mobile)$/i,
  },
  [WALLET_NAMES.polkadot]: {
    updatedIcon: WALLET_CONNECT_INFO.polkadot.icon,
    updatedName: WALLET_CONNECT_INFO.polkadot.text,
    name: /^(Polkadot|polkadot\.js)$/i,
  },
  [WALLET_NAMES.martian]: {
    updatedIcon: WALLET_CONNECT_INFO.martian.icon,
    updatedName: WALLET_CONNECT_INFO.martian.text,
    name: /^Martian$/i,
  },
} as const;

/**
 *  used to the following conditions:
 *    - wallet icon and name both exists
 *    - only one icon and only one name element
 *
 * wallet icon and name locate strategy:
 *  step1: if icon and name elements have uniq and stable class name ,
 *     - then use function `findIconAndName()` to return them directly
 *  step2: else use `container` to locate the name and icon automatically
 */

export type WalletInfo = {
  updatedIcon: string;
  updatedName: string;
  /**
   * it's better to  match the start and the end character at the same time
   */
  name: RegExp;

  /**
   * 1. the common ancestor selector of wallet icon and name element
   * 2. get the container element by document.querySelector(not document.querySelectorAll)
   * 3. tradeoff
   *    3.1. if the selector is ID selector(or any unique and stable selector,like '.connect-wallet-modal')
   *      - The closer the selector is to the wallet button, the more likely to get element.
   *          - because only one element will be choosen
   *      - but the closer the selector is to the wallet button, the more difficult to maintain .
   *      - there is no difference between the accuracy that mean it will not choose the wrong element.
   *          - because only one element will be choosen
   *    3.2. if the selector is not a unique or stable selector, like '.modal'
   *      - The farther away from the wallet button, the more likely to get the wrong element.
   *          - beacuase '.modal' will choose other modal elements which are not connect wallet modal
   * 4. choose strategy :
   *    step1. choose the wallet button by unique and stable selector(id selector,uniq class etc) if possible
   *    step2. choose the wallet button list container by unique and stable selector(id selector,uniq class etc) if possible
   *    step3. choose the connect wallet modal by title [getConnectWalletModalByTitle()]
   * 5. the container must be a selector or a function for it should be called when mutation happens
   */
  container?: Selector | (() => HTMLElement | null);

  /**
   *  custom method used when
   *  1. icon and name have a uniq selector(id selector,uniq class etc)
   *  2. other special cases,like shadowRoot
   * **/
  findIconAndName?: (this: null, wallet: WalletInfo) => FindResultType | null;

  updateIcon?: (this: void, img: HTMLElement, iconStr: string) => HTMLImageElement;
  updateName?: (this: void, textNode: Text, text: string) => void;

  /**
   * used when there is only one icon or name element(not both) and other special cases
   */
  update?: (this: void, wallet: WalletInfo) => HTMLImageElement | null;
};
export type SitesInfo = {
  urls: string[];
  walletsForProvider: {
    [k in IInjectedProviderNames]?: WalletInfo[];
  };

  mutationObserverOptions?: MutationObserverInit;
  /**
   * path for connect wallet modal used for testing
   */
  testPath?: string[] | { mobile?: string[]; desktop?: string[] };
  only?: boolean;
  skip?: boolean | { mobile?: boolean; desktop?: boolean };
};

export const sitesConfig: SitesInfo[] = [
  {
    urls: ['app.turbos.finance'],
    testPath: [':text("I accept the")', ':text("Continue")', ':text("Connect Wallet")'],
    walletsForProvider: {
      [IInjectedProviderNames.sui]: [
        {
          ...basicWalletInfo['suiwallet'],
          container: "div[role='dialog'] .rc-dialog-body > ul",
        },
      ],
    },
  },
  {
    urls: ['app.defisaver.com'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          findIconAndName({ name }) {
            return findIconAndNameDirectly(
              '.button-option.MetaMask > svg',
              '.button-option.MetaMask .connect-wallet-button-name',
              name,
            );
          },
        },
        {
          ...basicWalletInfo['walletconnect'],
          findIconAndName({ name }) {
            return findIconAndNameDirectly(
              '.button-option.WalletConnect > svg',
              '.button-option.WalletConnect .connect-wallet-button-name',
              name,
            );
          },
        },
      ],
    },
  },
  {
    urls: ['haedal.xyz'],
    testPath: [':text("Stake Now")', ':text("Connect Wallet")'],
    walletsForProvider: {
      [IInjectedProviderNames.sui]: [
        {
          ...basicWalletInfo['suiwallet'],
          container: "div[role='dialog'] .wkit-select__container",
        },
      ],
    },
  },

  {
    urls: ['trade.bluefin.io'],
    walletsForProvider: {
      [IInjectedProviderNames.sui]: [
        {
          ...basicWalletInfo['suiwallet'],
          name: /^Connect Sui Wallet$/,
          container: () => getWalletListByBtn("div[role='dialog'] [data-testid='connect-wallet']"),
          updateIcon: (originnalNode: HTMLElement, iconSrc: string) => {
            const img = replaceIcon(originnalNode, iconSrc);
            img.style.marginRight = '12px';
            return img;
          },
        },
      ],
    },
  },
  {
    urls: ['omnilending.omnibtc.finance'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: "div[role='dialog'] .ant-modal-content .wallets-inner",
        },
      ],
      [IInjectedProviderNames.sui]: [
        {
          ...basicWalletInfo['suiwallet'],
          container: "div[role='dialog'] [class*='WalletListWrapper']",
        },
      ],
    },
  },
  {
    urls: ['app.venus.io'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: () =>
            getConnectWalletModalByTitle('div.MuiModal-root .venus-modal', 'Connect a wallet'),
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: () =>
            getConnectWalletModalByTitle('div.MuiModal-root .venus-modal', 'Connect a wallet'),
        },
      ],
    },
  },
  {
    urls: ['app.uncx.network'],
    testPath: [':text("Connect")'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: () => getWalletListByBtn("div[role='dialog'] .v-card .c-list"),
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: () => getWalletListByBtn("div[role='dialog'] .v-card .c-list"),
        },
      ],
    },
  },
  {
    urls: ['app.benqi.fi'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: '#metamask',
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: '#wallet-connect',
        },
      ],
    },
  },
  {
    urls: ['manta.layerbank.finance'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: () => getConnectWalletModalByTitle('div.MuiModal-root', 'Connect Wallet'),
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: () => getConnectWalletModalByTitle('div.MuiModal-root', 'Connect Wallet'),
        },
      ],
    },
  },
  {
    urls: ['app.orbitlending.io'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: 'button[data-testid="rk-wallet-option-metaMask"]',
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: 'button[data-testid="rk-wallet-option-walletConnect"]',
        },
      ],
    },
  },
  {
    urls: ['app.stakewise.io'],
    testPath: [':text("Connect")'],
    skip: {
      mobile: true, //NOTE:没有入口?
    },
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: '[data-testid="metaMask-connector-button"]',
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: '[data-testid="walletConnect-connector-button"]',
        },
      ],
    },
  },

  {
    urls: ['aerodrome.finance'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['walletconnect'],
          findIconAndName({ name }) {
            return findIconAndNameDirectly(
              '.bg-connect button[type="button"] img[src*="connect-walletConnect.svg"]',
              'auto-search-text',
              name,
            );
          },
        },
      ],
    },
  },
  //TODO: 全是shadow root
  // {
  //   urls: ['lista.org'],
  //   walletsForProvider: {
  //     [IInjectedProviderNames.ethereum]: [
  //       {
  //         ...basicWalletInfo['metamask'],
  //         container: 'div.MuiModal-root[role="presentation"] [class*="walletGroup"]',
  //       },
  //       {
  //         ...basicWalletInfo['walletconnect'],
  //         container: 'div.MuiModal-root[role="presentation"] [class*="walletGroup"] ',
  //       },
  //     ],
  //   },
  // },

  //shadow root
  {
    urls: ['app.prismafinance.com'],
    skip: {
      mobile: true, //WARN:没有入口?
    },
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: '.modal .outer-container div.wallets-container ',
          findIconAndName: ({ container, name }) => {
            return findIconAndNameInShadowRoot('onboard-v2', container as string, name);
          },
          updateIcon(icon, iconSrc) {
            const res = replaceIcon(icon, iconSrc);
            res.style.width = '32px';
            res.style.height = '32px';
            res.style.maxWidth = '32px';
            res.style.maxHeight = '32px';
            return res;
          },
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: '.modal .outer-container div.wallets-container ',
          findIconAndName: ({ container, name }) => {
            return findIconAndNameInShadowRoot('onboard-v2', container as string, name);
          },
          updateIcon(icon, iconSrc) {
            const res = replaceIcon(icon, iconSrc);
            res.style.width = '32px';
            res.style.height = '32px';
            res.style.maxWidth = '32px';
            res.style.maxHeight = '32px';
            return res;
          },
        },
      ],
    },
  },
  {
    urls: ['vvs.finance'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: '#wallet-connect-metamask',
        },
      ],
    },
  },
  {
    urls: ['raydium.io'],
    testPath: [
      ':text("Launch App")',
      ':text("I have read")',
      ':text("Agree and Continue")',
      ':text("Connect Wallet")',
    ],

    walletsForProvider: {
      [IInjectedProviderNames.solana]: [
        {
          ...basicWalletInfo['phantom'],
          container: () =>
            getConnectWalletModalByTitle(
              ['div.fixed[role="dialog"]', 'div.Drawer.fixed'],
              'Connect your wallet to Raydium',
            ),
        },
      ],
    },
  },
  {
    urls: ['01.xyz'],
    testPath: [':text("Connect")', ':text("Continue")'],
    skip: {
      mobile: true, //WARN:没有入口?
    },
    walletsForProvider: {
      [IInjectedProviderNames.solana]: [
        {
          ...basicWalletInfo['phantom'],
          container: () => getConnectWalletModalByTitle('div.fixed', 'Select Wallet'),
        },
      ],
    },
  },
  {
    urls: ['francium.io'],
    testPath: {
      desktop: [':text("Launch App")', ':text("Connect Wallet")'],
      mobile: [':text("Launch App")', 'button.wallet-connect'],
    },

    walletsForProvider: {
      [IInjectedProviderNames.solana]: [
        {
          ...basicWalletInfo['phantom'],
          container: '.wallet-modal .connect-wallet-list',
        },
      ],
    },
  },

  {
    urls: ['defi.instadapp.io'],
    testPath: [':text("Connect")'],
    skip: {
      mobile: true, //没有入口
    },
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: '#WEB3_CONNECT_MODAL_ID .web3modal-modal-card',
        },
        {
          ...basicWalletInfo['walletconnect'],
          name: /^WalletConnect v2$/,
          container: '#WEB3_CONNECT_MODAL_ID .web3modal-modal-card',
        },
      ],
    },
  },
  {
    urls: ['crosschain.bifi.finance'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          findIconAndName({ name }) {
            return findIconAndNameDirectly(
              '.MuiPaper-root.MuiPaper-elevation a img[src*="icon-metamask"]',
              (icon: HTMLElement) => icon.parentElement?.parentElement,
              name,
            );
          },
        },
        {
          ...basicWalletInfo['walletconnect'],
          findIconAndName({ name }) {
            return findIconAndNameDirectly(
              '.MuiPaper-root.MuiPaper-elevation a img[src*="icon-walletconnect"]',
              (icon: HTMLElement) => icon.parentElement?.parentElement,
              name,
            );
          },
        },
      ],
    },
  },
  {
    urls: ['bitstable.finance'],
    testPath: [':text("Launch App")', ':text("Connect Wallet")', ':text("USDT")'],
    skip: true,
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: () => getConnectWalletModalByTitle('div[role="dialog"]', 'Connect Wallet'),
        },
      ],
      [IInjectedProviderNames.btc]: [
        {
          ...basicWalletInfo['unisat'],
          findIconAndName({ name }) {
            return findIconAndNameDirectly(
              '.MuiStack-root button img[alt="Unisat"]',
              (icon: HTMLElement) => icon.parentElement?.parentElement?.parentElement,
              name,
            );
          },
        },
      ],
    },
  },
  {
    urls: ['merlinchain.io'],
    walletsForProvider: {
      [IInjectedProviderNames.btc]: [
        {
          ...basicWalletInfo['unisat'],
          container: () => {
            return getConnectWalletModalByTitle(
              'div.fixed[role="dialog"][id*="radix-"]',
              'Connect Wallet',
              (e) => {
                return (
                  window.getComputedStyle(e).pointerEvents != 'none' &&
                  e.innerText.includes('BTC wallets')
                );
              },
            );
          },
        },
      ],
    },
  },
  {
    urls: ['app.justlend.org'],
    walletsForProvider: {
      [IInjectedProviderNames.btc]: [
        {
          ...basicWalletInfo['tronlink'],
          container: () => {
            return getConnectWalletModalByTitle(
              'div.connect-modal-v2.entry-modal-v2',
              'Connect Wallet',
            );
          },
        },
      ],
    },
  },
  {
    urls: ['sun.io'],
    skip: {
      mobile: true, //WARN: it seems not supported by the site
    },

    walletsForProvider: {
      [IInjectedProviderNames.btc]: [
        {
          ...basicWalletInfo['tronlink'],
          container: () => {
            return getConnectWalletModalByTitle('div.wallet-modal', 'Connect Wallet');
          },
        },
      ],
    },
  },
  {
    urls: ['www.team.finance'],
    testPath: {
      desktop: [':text("Connect Wallet")'],
      mobile: ['main > nav section.z-10.block', ':text("Connect Wallet")'],
    },
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: () => {
            return getConnectWalletModalByTitle('.fixed[role="dialog"]', 'Select wallet');
          },
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: () => {
            return getConnectWalletModalByTitle('.fixed[role="dialog"]', 'Select wallet');
          },
        },
      ],
    },
  },
  {
    urls: ['app.thala.fi'],
    testPath: [':text("I agree")', ':text("Connect")'],
    walletsForProvider: {
      [IInjectedProviderNames.aptos]: [
        {
          ...basicWalletInfo['petra'],
          container: () => {
            return getConnectWalletModalByTitle('div.chakra-modal__body', 'Welcome to Thala');
          },
        },
      ],
    },
  },
  {
    urls: ['app.kinza.finance'],
    testPath: {
      desktop: [':text("Connect Wallet")'],
      mobile: ['div.ant-app svg[class*="_menu_icon"]', ':text("Connect Wallet")'],
    },
    skip: {
      mobile: true, //WARN:没有连接钱包弹窗，点击链接钱包后会自动连接默认钱包
    },
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: 'button[data-testid="rk-wallet-option-metaMask"]',
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: 'button[data-testid="rk-wallet-option-walletConnect"]',
        },
      ],
    },
  },
  {
    urls: ['app.osmosis.zone'],

    walletsForProvider: {
      [IInjectedProviderNames.cosmos]: [
        {
          ...basicWalletInfo['keplr'],
          name: /^(Keplr|Keplr Mobile)$/i,
          findIconAndName({ name }) {
            return findIconAndNameDirectly(
              '.ReactModalPortal button img[alt="Wallet logo"][src*="keplr"]',
              (icon: HTMLElement) => icon.parentElement,
              name,
            );
          },
        },
      ],
    },
  },
  {
    urls: ['app.gearbox.fi'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: 'button[data-testid="wallet-select-dialog-wallet-metamask"]',
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: 'button[data-testid="wallet-select-dialog-wallet-walletconnect"]',
        },
      ],
    },
  },
  {
    urls: ['blur.io'],
    testPath: {
      mobile: [':text("Connect")', ':text("Connect")'],
      desktop: [':text("Connect Wallet")', ':text("Connect Wallet")'],
    },
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: 'button[id="METAMASK"]',
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: 'button[id="WALLETCONNECT"]',
        },
      ],
    },
  },
  {
    urls: ['app.stride.zone'],

    walletsForProvider: {
      [IInjectedProviderNames.cosmos]: [
        {
          ...basicWalletInfo['keplr'],
          name: /^(Keplr|Keplr Mobile)$/i,
          container: () => {
            return getConnectWalletModalByTitle('div[role="dialog"]', 'Select a wallet');
          },
        },
      ],
    },
  },
  {
    urls: ['app.manta.network'],
    skip: {
      mobile: true, //WARN: mobile is not supported by the site
    },
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          findIconAndName({ name }) {
            return findIconAndNameDirectly(
              '.relative.rounded-2xl.text-default svg.rounded-full',
              (icon: HTMLElement) => icon.parentElement,
              name,
            );
          },
        },
      ],
      [IInjectedProviderNames.polkadot]: [
        {
          ...basicWalletInfo['polkadot'],
          findIconAndName: ({ name }) => {
            return findIconAndNameDirectly(
              '.relative.rounded-2xl.text-default img[alt="Polkadotjs Logo"]',
              (icon: HTMLElement) => icon.parentElement,
              name,
            );
          },
        },
      ],
    },
  },
  {
    urls: ['www.metapool.app'],
    testPath: ['.chakra-modal__body', ':text("Start staking")', ':text("Connect your Wallet")'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: 'button[data-testid="rk-wallet-option-metaMask"]',
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: 'button[data-testid="rk-wallet-option-walletConnect"]',
        },
      ],
    },
  },
  {
    urls: ['app.arrakis.fi'],
    testPath: [':text("For Users")', ':text("Connect Wallet")'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: 'button[data-testid="rk-wallet-option-metaMask"]',
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: 'button[data-testid="rk-wallet-option-walletConnect"]',
        },
      ],
    },
  },
  {
    urls: ['tectonic.finance'],
    testPath: {
      desktop: [':text("Enter App")', ':text("Connect Wallet")'],
      mobile: [':text("Enter App")', 'nav button > svg', ':text("Connect Wallet")'],
    },
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: () =>
            getConnectWalletModalByTitle(
              ['div.fixed[role="dialog"]', '#headlessui-dialog-1'],
              'Connect Wallet',
            ),
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: () => getConnectWalletModalByTitle('#headlessui-dialog-1', 'Connect Wallet'),
        },
      ],
    },
  },
  {
    urls: ['quickswap.exchange'],
    testPath: [
      ':nth-match(div.MuiBox-root input[type="checkbox"],1)',
      ':nth-match(div.MuiBox-root input[type="checkbox"],2)',
      ':text-is("Confirm")',
      ':text-is("Connect Wallet")',
    ],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          findIconAndName({ name }) {
            return findIconAndNameDirectly(
              '#connect-METAMASK img',
              '#connect-METAMASK div.optionHeader',
              name,
            );
          },
        },
        {
          ...basicWalletInfo['walletconnect'],
          findIconAndName({ name }) {
            return findIconAndNameDirectly(
              '#connect-WALLET_CONNECT img',
              '#connect-WALLET_CONNECT div.optionHeader',
              name,
            );
          },
        },
      ],
    },
  },
  {
    urls: ['www.saucerswap.finance'],
    skip: true, //TODO:暂时不支持滚动
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: () =>
            getConnectWalletModalByTitle('div.MuiPaper-root[role="dialog"]', 'Pair Wallet'),
        },
      ],
    },
  },
  {
    urls: ['fin.kujira.network'],
    testPath: ['.modal__header svg', ':text("Connect Wallet")'],
    walletsForProvider: {
      [IInjectedProviderNames.cosmos]: [
        {
          ...basicWalletInfo['keplr'],
          update({ updatedIcon }) {
            const icon = document.querySelector<HTMLImageElement>(
              'div.wallet__connections > div.wrap > button:nth-child(2) svg', //NOTE:no better selector
            );
            return icon ? replaceIcon(icon, updatedIcon) : null;
          },
        },
      ],
    },
  },
  {
    urls: ['stake.amnis.finance'],
    walletsForProvider: {
      [IInjectedProviderNames.aptos]: [
        {
          ...basicWalletInfo['petra'],
          container: () =>
            getConnectWalletModalByTitle('div.ant-modal[role="dialog"]', 'Welcome to Amnis'),
        },
        {
          ...basicWalletInfo['martian'],
          container: () =>
            getConnectWalletModalByTitle('div.ant-modal[role="dialog"]', 'Welcome to Amnis'),
        },
      ],
    },
  },
  {
    urls: ['app.astroport.fi'],
    testPath: [
      'p:text("I have read and understood")',
      'p:text("I acknowledge")',
      'button:text("Confirm")',
      'button:text("Accept All Cookies")',
      'button:text("No")',
      ':text("Connect Wallet")',
    ],

    walletsForProvider: {
      [IInjectedProviderNames.cosmos]: [
        {
          ...basicWalletInfo['keplr'],
          name: /^(Keplr|Keplr Mobile)$/,
          container: () =>
            getConnectWalletModalByTitle('div[role="dialog"].fixed', 'Select Wallet'),
        },
      ],
    },
  },
  {
    urls: ['go.liquidloans.io'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: () =>
            document.querySelector('div[role="dialog"][aria-labelledby="rk_connect_title"]'), // for rk_connect_title is unique
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: () =>
            document.querySelector('div[role="dialog"][aria-labelledby="rk_connect_title"]'), /// for rk_connect_title is unique
        },
      ],
    },
  },
  {
    urls: ['bifrost.app'],

    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          findIconAndName({ name }) {
            const modal = getConnectWalletModalByTitle(
              'div.chakra-modal__content-container',
              'Connect Wallet',
            );
            return (
              modal &&
              findIconAndNameDirectly(
                'img[alt="MetaMask"]',
                (icon) => icon.parentElement?.parentElement,
                name,
                modal,
              )
            );
          },
        },
        {
          ...basicWalletInfo['walletconnect'],
          findIconAndName({ name }) {
            const modal = getConnectWalletModalByTitle(
              'div.chakra-modal__content-container',
              'Connect Wallet',
            );
            return (
              modal &&
              findIconAndNameDirectly(
                'img[alt="WalletConnect"]',
                (icon) => icon.parentElement?.parentElement,
                name,
                modal,
              )
            );
          },
        },
      ],
      [IInjectedProviderNames.polkadot]: [
        {
          ...basicWalletInfo['polkadot'],
          name: /^polkadot\.js$/i,
          container: () =>
            getConnectWalletModalByTitle('div.chakra-modal__content-container', 'Connect Wallet'),
        },
      ],
    },
  },
  {
    urls: ['app.kava.io'],

    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          findIconAndName({ name }) {
            const modal = getConnectWalletModalByTitle(
              '[data-testid="connectModal"]',
              'Connect Your Wallet',
            );
            return (
              modal &&
              findIconAndNameDirectly(
                'svg[aria-label="metamask-icon"]',
                (icon) => icon.parentElement,
                name,
                modal,
              )
            );
          },
        },
      ],
    },
  },
  {
    urls: ['www.ankr.com'],
    testPath: [':text("Sign in")', ':text("Continue with ETH Wallet")'],
    skip: {
      mobile: true, //WARN: mobile is not supported by the site .
    },
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: () =>
            getConnectWalletModalByTitle('div[role="dialog"]', 'Continue with Ethereum Wallet'),
        },
      ],
    },
  },
  {
    urls: ['dapp.chainge.finance'],
    skip: {
      mobile: true, //WARN: mobile is not supported by the site
    },
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: () => getConnectWalletModalByTitle('div[style*="right:"]', 'Connect a wallet'),
        },
      ],
    },
  },
  {
    urls: ['app.bancor.network'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: () => getConnectWalletModalByTitle('div[role="dialog"]', 'Connect Wallet'),
        },
      ],
    },
  },
  {
    urls: ['app.carbondefi.xyz'],
    testPath: ['button:text("Accept All Cookies")', 'button:text("Connect Wallet")'],
    skip: true, //TODO:bug:未触发弹窗
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          findIconAndName({ name }) {
            const modal = getConnectWalletModalByTitle(
              'div[data-testid="modal-container"]',
              'Connect Wallet',
            );
            return (
              modal &&
              findIconAndNameDirectly(
                'img[src*="assets/metamask"]',
                (icon) => icon.parentElement,
                name,
                modal,
              )
            );
          },
        },
        {
          ...basicWalletInfo['walletconnect'],
          findIconAndName({ name }) {
            const modal = getConnectWalletModalByTitle(
              'div[data-testid="modal-container"]',
              'Connect Wallet',
            );
            const text = modal && findWalletTextByParent(modal, name, []);
            const icon =
              text && text.parentElement?.parentElement
                ? findWalletIconByParent(text.parentElement.parentElement, [])
                : null;
            return (
              text &&
              icon && {
                iconNode: icon,
                textNode: text,
              }
            );
          },
        },
      ],
    },
  },
  {
    urls: ['app.alexlab.co'],
    testPath: [':text("Accept")', ':text("Connect stacks wallet")'],

    walletsForProvider: {
      [IInjectedProviderNames.btc]: [
        {
          ...basicWalletInfo['unisat'],
          container: () => getConnectWalletModalByTitle('div.fixed > .absolute', 'Bitcoin Chain'),
        },
      ],
    },
  },
  {
    urls: ['www.benddao.xyz'],
    testPath: ['button.sc-bdvvtL.oDzIq'],
    skip: true, //TODO:bug: onekey injected provider 没有运行
    walletsForProvider: {
      [IInjectedProviderNames.btc]: [
        {
          ...basicWalletInfo['unisat'], //WARN:已经下线了
          container: 'button#unisat-btc',
        },
      ],
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: 'button#metamask',
        },
      ],
    },
  },
  {
    urls: ['pro.apex.exchange'],
    skip: {
      mobile: true, //TODO: not supported by the site
    },
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: '.x-dialog-view .step-choose-wallet .step-wallets',
        },
      ],
    },
  },
  {
    urls: ['app.aevo.xyz'],

    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: () => getConnectWalletModalByTitle('div#connectWallet', 'Select Your Wallet'),
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: () => getConnectWalletModalByTitle('div#connectWallet', 'Select Your Wallet'),
        },
      ],
    },
  },
  {
    urls: ['www.stfil.io'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          findIconAndName({ name }) {
            const modal = document.querySelector<HTMLElement>('div.connectWalletModel');
            const text = modal && findWalletTextByParent(modal, name, []);
            const icon = text?.parentElement?.parentElement?.parentElement?.querySelector(
              'img[src*="metamask"]',
            ) as HTMLElement | null;
            return (
              text &&
              icon && {
                textNode: text,
                iconNode: icon,
              }
            );
          },
        },
        {
          ...basicWalletInfo['walletconnect'],
          findIconAndName({ name }) {
            return findIconAndNameDirectly(
              'div.connectWalletModel img[src*="walletconnect"]',
              (e) => e.parentElement?.parentElement,
              name,
            );
          },
        },
      ],
    },
  },
  {
    urls: ['www.stakedao.org'],

    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          update({ updatedIcon }) {
            const modal = domUtils.findTextNode('div.MuiContainer-root', 'Connect Wallet') as Text;
            const icon = modal?.parentElement?.parentElement?.querySelector<HTMLImageElement>(
              'img[alt="metamask wallet logo"][src*="metamask.svg"]',
            );
            return icon ? replaceIcon(icon, updatedIcon) : null;
          },
        },
        {
          ...basicWalletInfo['walletconnect'],
          update({ updatedIcon }) {
            const modal = domUtils.findTextNode('div.MuiContainer-root', 'Connect Wallet') as Text;
            const icon = modal?.parentElement?.parentElement?.querySelector<HTMLImageElement>(
              'img[alt="walletconnect wallet logo"][src*="walletconnect.svg"]',
            );
            return icon ? replaceIcon(icon, updatedIcon) : null;
          },
        },
      ],
    },
  },
  {
    urls: ['app.sommelier.finance'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          findIconAndName(wallet) {
            return findIconAndNameDirectly(
              '[id*="popover-body"] img[src*="metamask.svg"][alt="wallet logo"]',
              'auto-search-text',
              wallet.name,
            );
          },
        },
      ],
    },
  },
  {
    urls: ['www.tokensets.com'],
    testPath: [':text("Sign in")'],
    skip: {
      mobile: true, //WARN: 没有连接钱包弹窗
    },
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: () => getConnectWalletModalByTitle('div.ui.page.modals', 'Sign In'),
        },
      ],
    },
  },
  // {
  //   urls: ['syncswap.xyz'],
  //   testPath: [':text("Sign in")'],
  //   skip: {
  //     mobile: true, //WARN: 没有连接钱包弹窗
  //   },
  //   walletsForProvider: {
  //     [IInjectedProviderNames.ethereum]: [
  //       {
  //         ...basicWalletInfo['walletconnect'],
  //         container: () => getConnectWalletModalByTitle('div.ui.page.modals', 'Sign In'),
  //       },
  //     ],
  //   },
  // },
  {
    urls: ['app.init.capital'],
    testPath: [':text("Do not show")', ':text("Continue")', ':text("Connect Wallet")'],
    skip: true, //TODO:点不动

    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: 'button[data-testid="rk-wallet-option-metaMask"]',
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: 'button[data-testid="rk-wallet-option-walletConnect"]',
        },
      ],
    },
  },
  {
    urls: ['www.dx.app'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: 'button[data-testid="rk-wallet-option-metaMask"]',
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: 'button[data-testid="rk-wallet-option-walletConnect"]',
        },
      ],
    },
  },
  {
    urls: ['www.inverse.finance'],
    testPath: [':text("Enter App")', ':text("Connect")'],
    mutationObserverOptions: {
      childList: true,
      subtree: true,
      attributes: true,
    },
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          findIconAndName(wallet) {
            return findIconAndNameDirectly(
              () =>
                Array.from(
                  document.querySelectorAll<HTMLElement>(
                    'section[id*="popover-content"] img[src*="Metamask.png"]',
                  ),
                ).filter((e) => isVisible(e))?.[0],
              'auto-search-text',
              wallet.name,
            );
          },
        },
      ],
    },
  },
  {
    urls: ['moonwell.fi'],
    testPath: [':text("Launch App")', ':text("Connect Wallet")'],

    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          findIconAndName(wallet) {
            const modal = getConnectWalletModalByTitle(
              'div[id*="headlessui-dialog-panel"]',
              'Connect a wallet',
            );
            return (
              modal &&
              findIconAndNameDirectly(
                'img[src*="metamask"]',
                'auto-search-text',
                wallet.name,
                modal,
              )
            );
          },
        },
        {
          ...basicWalletInfo['walletconnect'],
          findIconAndName(wallet) {
            const modal = getConnectWalletModalByTitle(
              'div[id*="headlessui-dialog-panel"]',
              'Connect a wallet',
            );
            return (
              modal &&
              findIconAndNameDirectly(
                'img[src*="walletconnect"]',
                'auto-search-text',
                wallet.name,
                modal,
              )
            );
          },
        },
      ],
    },
  },
  {
    urls: ['sovryn.app'],
    testPath: [':text("Get started")', ':text("Browser Wallet")'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: '[data-layout-id="dapp-onboard-metamask"]',
        },
      ],
    },
  },
  {
    urls: ['dapp.moneyonchain.com'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          findIconAndName({ name }) {
            const modal = getConnectWalletModalByTitle(
              '#rlogin-connect-modal',
              'Connect your wallet',
            );
            return (
              modal &&
              findIconAndNameDirectly('img[alt="MetaMask"]', 'auto-search-text', name, modal)
            );
          },
        },
        {
          ...basicWalletInfo['walletconnect'],
          findIconAndName({ name }) {
            const modal = getConnectWalletModalByTitle(
              '#rlogin-connect-modal',
              'Connect your wallet',
            );
            return (
              modal &&
              findIconAndNameDirectly('img[alt="WalletConnect"]', 'auto-search-text', name, modal)
            );
          },
        },
      ],
    },
  },
  {
    urls: ['app.extrafi.io'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: 'button[data-testid="rk-wallet-option-metaMask"]',
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: 'button[data-testid="rk-wallet-option-walletConnect"]',
        },
      ],
    },
  },
  //TODO:放在弹窗iframe内的。
  // {
  //   urls: ['app.degate.com'],
  //   walletsForProvider: {
  //     [IInjectedProviderNames.ethereum]: [
  //       {
  //         ...basicWalletInfo['metamask'],
  //         findIconAndName(wallet) {
  //           const modal = getConnectWalletModalByTitle(
  //             'section.mantine-Modal-content',
  //             'Connect Wallet',
  //           );
  //           return (
  //             modal &&
  //             findIconAndNameDirectly(
  //               'img[src*="metamask"]',
  //               (icon) => icon.parentElement?.parentElement,
  //               wallet.name,
  //               modal,
  //             )
  //           );
  //         },
  //       },
  //       {
  //         ...basicWalletInfo['walletconnect'],
  //         findIconAndName(wallet) {
  //           const modal = getConnectWalletModalByTitle('section.mantine-Modal-content', 'Connect Wallet');
  //           return (
  //             modal &&
  //             findIconAndNameDirectly(
  //               'img[src*="walletConnect"]',
  //               (icon) => icon.parentElement?.parentElement,
  //               wallet.name,
  //               modal,
  //             )
  //           );
  //         },
  //       },
  //     ],
  //   },
  // },
  {
    urls: ['tranchess.com'],
    testPath: {
      desktop: [':text("Liquid Staking")', ':text("Ethereum")', ':text("Connect Wallet")'],
      mobile: ['button.header--mobile-menu-toggle', ':text("Connect Wallet")'],
    },
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: 'div.wallet-provider-modal--item.meta-mask',
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: 'div.wallet-provider-modal--item.wallet-connect',
        },
      ],
    },
  },
  {
    urls: ['app.alpacafinance.org'],
    testPath: [':text("Connect to Wallet")'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          findIconAndName(wallet) {
            const modal = getConnectWalletModalByTitle('div.ant-modal-content', 'Select a wallet');
            return (
              modal &&
              findIconAndNameDirectly(
                'img[src*="metamask"]',
                'auto-search-text',
                wallet.name,
                modal,
              )
            );
          },
        },
        {
          ...basicWalletInfo['walletconnect'],
          findIconAndName({ name }) {
            const modal = getConnectWalletModalByTitle('div.ant-modal-content', 'Select a wallet');
            return (
              modal &&
              findIconAndNameDirectly(
                'img[src*="wallet-connect.svg"]',
                'auto-search-text',
                name,
                modal,
              )
            );
          },
        },
      ],
    },
  },
  {
    urls: ['app-v2.alpacafinance.org'],
    testPath: [':text("Connect Wallet")'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          findIconAndName(wallet) {
            const modal = getConnectWalletModalByTitle(
              'div.chakra-modal__content-container',
              'Select a wallet',
            );
            return (
              modal &&
              findIconAndNameDirectly('img[alt="MetaMask"]', 'auto-search-text', wallet.name, modal)
            );
          },
        },
        {
          ...basicWalletInfo['walletconnect'],
          findIconAndName({ name }) {
            const modal = getConnectWalletModalByTitle(
              'div.chakra-modal__content-container',
              'Select a wallet',
            );
            return (
              modal &&
              findIconAndNameDirectly('img[alt="WalletConnect"]', 'auto-search-text', name, modal)
            );
          },
        },
      ],
    },
  },
  {
    urls: ['exchange.idex.io'],
    testPath: {
      desktop: [':text("Get Started")', ':text("Connect Wallet")'],
      mobile: [':text("Get Started")', ':text("Connect")'],
    },
    mutationObserverOptions: {
      childList: true,
      subtree: true,
      attributes: true,
    },
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: 'ul[class*="UnlockCore__ListWrap"]',
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: 'ul[class*="UnlockCore__ListWrap"]',
        },
      ],
    },
  },
  {
    urls: ['app.aura.finance'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: 'button[data-testid="rk-wallet-option-metaMask"]',
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: 'button[data-testid="rk-wallet-option-walletConnect"]',
        },
      ],
    },
  },
  {
    urls: ['app.frax.finance'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: 'button[data-testid="rk-wallet-option-metaMask"]',
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: 'button[data-testid="rk-wallet-option-walletConnect"]',
        },
      ],
    },
  },
  {
    urls: ['beets.fi'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: 'button[data-testid="rk-wallet-option-metaMask"]',
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: 'button[data-testid="rk-wallet-option-walletConnect"]',
        },
      ],
    },
  },
  {
    urls: ['app.gmx.io'],

    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container:
            ':is(button[data-testid="rk-wallet-option-io.metamask"],button[data-testid="rk-wallet-option-metaMask"])',
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: 'button[data-testid="rk-wallet-option-walletConnect"]',
        },
      ],
    },
  },
  {
    urls: ['link3.to'],

    skip: {
      mobile: true, //WARN: mobile is not supported by the site
    },
    testPath: [':text("Login")', ':text("Connect Wallet")'],

    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container:
            ':is(button[data-testid="rk-wallet-option-metaMask"],button[data-testid="rk-wallet-option-io.metamask"])',
        },
        // {
        //   ...basicWalletInfo['walletconnect'],
        //   container: 'button[data-testid="rk-wallet-option-walletConnect"]',
        // },
      ],
    },
  },
  {
    urls: ['app.mento.org'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: 'button[data-testid="rk-wallet-option-metaMask"]',
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: 'button[data-testid="rk-wallet-option-walletConnect"]',
        },
      ],
    },
  },
  {
    urls: ['synapseprotocol.com'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: 'button[data-testid="rk-wallet-option-metaMask"]',
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: 'button[data-testid="rk-wallet-option-walletConnect"]',
        },
      ],
    },
  },
];
