import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO, WALLET_NAMES } from '../consts';
import { findIconAndNameByName, findIconAndNameByIcon } from './findIconAndName';
import {
  findWalletIconByParent,
  isWalletIconLessEqualThan,
  isWalletIconSizeMatch,
  replaceIcon,
} from './imgUtils';
import { findIconAndNameInShadowRoot } from './shadowRoot';
import { ConstraintFn, FindResultType, Selector } from './type';
import {
  getConnectWalletModalByTitle,
  getMaxWithOfText,
  getWalletListByBtn,
  isClickable,
  isVisible,
} from './utils';
import {
  findWalletTextByParent,
  makeTextAlignCenter,
  makeTextAlignLeft,
  makeTextEllipse,
  makeTextWrap,
  replaceText,
} from './textUtils';
import domUtils from '../utils/utilsDomNodes';
import { text } from 'stream/consumers';

type FrameLocator = {
  locator: (selector: string) => Locator;
};
type Locator = {
  count: () => Promise<number>;
  contentFrame: () => FrameLocator;
  first: () => Locator;
  click: () => Promise<void>;
};
type Page = {
  locator: (selector: string) => Locator;
  evaluate: (fn: (...args: any[]) => any) => Promise<any>;
};

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
    name: /^(Petra|Petra Wallet)$/i,
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
    name: /^Martian|Martian Wallet$/i,
  },
  [WALLET_NAMES.nami]: {
    updatedIcon: WALLET_CONNECT_INFO.nami.icon,
    updatedName: WALLET_CONNECT_INFO.nami.text,
    name: /^(Nami Wallet|Nami)$/i,
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
  updateName?: (this: void, textNode: Text, text: string) => Text;
  afterUpdate?: (this: void, textNode: Text, img: HTMLImageElement) => void;

  /**
   * used when there is only one icon or name element(not both) and other special cases
   */
  update?: (this: void, wallet: WalletInfo) => HTMLImageElement | null;

  /**
   * skip testing
   */
  skip?: boolean | ((page: Page) => Promise<boolean>) | { mobile?: boolean; desktop?: boolean };
};
export type SitesInfo = {
  urls: string[];
  walletsForProvider: {
    [k in IInjectedProviderNames]?: WalletInfo[];
  };

  mutationObserverOptions?: MutationObserverInit;
  constraintMap?: {
    text: ConstraintFn[];
    icon: ConstraintFn[];
  };
  /**
   * path for connect wallet modal used for testing
   */
  testPath?: string[] | { mobile?: string[]; desktop?: string[] } | ((page: Page) => Promise<void>);
  testUrls?: string[];
  only?: boolean;
  skip?: boolean | { mobile?: boolean; desktop?: boolean };
};
const onekeySelectorInRowbowkit = 'button[data-testid="rk-wallet-option-so.onekey.app.wallet"]';
function hasOnekeyWallet(ele: HTMLElement | Document = document) {
  return !!ele.querySelector(onekeySelectorInRowbowkit);
}
const metamaskForRainbowKit: WalletInfo = {
  ...basicWalletInfo['metamask'],
  skip: async (page: Page) => (await page.locator(onekeySelectorInRowbowkit).count()) > 0,
  container: () => {
    if (hasOnekeyWallet()) {
      return null;
    }
    return document.querySelector('button[data-testid="rk-wallet-option-metaMask"]');
  },
  afterUpdate(textNode) {
    if (textNode.parentElement) {
      textNode.parentElement.style.whiteSpace = 'normal';
    }
  },
};

const walletConnectForRainbowKit: WalletInfo = {
  ...basicWalletInfo[WALLET_NAMES.walletconnect],
  skip: async (page: Page) => (await page.locator(onekeySelectorInRowbowkit).count()) > 0,
  container: () => {
    if (hasOnekeyWallet()) {
      return null;
    }
    return document.querySelector('button[data-testid="rk-wallet-option-walletConnect"]');
  },
  afterUpdate(textNode) {
    if (textNode.parentElement) {
      textNode.parentElement.style.whiteSpace = 'normal';
    }
  },
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
    testPath: ['button:text("ACCEPT")'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          findIconAndName({ name }) {
            return findIconAndNameByIcon('.button-option.MetaMask > svg', 'auto-search-text', name);
          },
        },
        {
          ...basicWalletInfo['walletconnect'],
          findIconAndName({ name }) {
            return findIconAndNameByIcon(
              '.button-option.WalletConnect > svg',
              'auto-search-text',
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
    testPath: [':text("View your")', ':text("Connect Account")'],
    walletsForProvider: {
      [IInjectedProviderNames.sui]: [
        {
          ...basicWalletInfo['suiwallet'],
          name: /Sui Wallet$/,
          container: () => {
            const modal = getConnectWalletModalByTitle('div.connect-wallet', 'Connect Account');
            const button = modal?.querySelector('[data-testid="connect-wallet"]');
            return button ? button.parentElement : null;
          },

          afterUpdate: (text, img) => {
            img.style.marginRight = '12px';
          },
        },
      ],
    },
  },
  {
    urls: ['omnilending.omnibtc.finance'],
    testPath: ['button:text("Connect Wallet")'],
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
    testPath: ['button:has-text("Connect")'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: () => getWalletListByBtn("div[role='dialog'] .v-card .c-list"),
          skip: { mobile: true },
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: () => getWalletListByBtn("div[role='dialog'] .v-card .c-list"),
          afterUpdate(textNode, img) {
            img.style.height = 'auto';
          },
        },
      ],
    },
  },
  {
    urls: ['app.benqi.fi'],
    testPath: ['button:text("Connect Wallet")[class*="ActionButton__Button"]'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: '#metamask',
          afterUpdate(textNode, img) {
            textNode.parentElement && (textNode.parentElement.style.textAlign = 'left');
          },
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: '#wallet-connect',
          afterUpdate(textNode, img) {
            textNode.parentElement && (textNode.parentElement.style.textAlign = 'left');
          },
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
      [IInjectedProviderNames.ethereum]: [metamaskForRainbowKit, walletConnectForRainbowKit],
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
            return findIconAndNameByIcon(
              '.bg-connect button[type="button"] img[src*="connect-walletConnect.svg"]',
              'auto-search-text',
              name,
            );
          },
        },
      ],
    },
  },

  //shadow root
  {
    urls: ['app.prismafinance.com'],
    skip: {
      mobile: true,
    },
    only: true,
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
  // {
  //   urls: ['raydium.io'],
  //   testPath: [
  //     ':text("Launch App")',
  //     ':text("I have read")',
  //     ':text("Agree and Continue")',
  //     ':text("Connect Wallet")',
  //   ],

  //   walletsForProvider: {
  //     [IInjectedProviderNames.solana]: [
  //       {
  //         ...basicWalletInfo['phantom'],
  //         container: () =>
  //           getConnectWalletModalByTitle(
  //             ['div.fixed[role="dialog"]', 'div.Drawer.fixed'],
  //             'Connect your wallet to Raydium',
  //           ),
  //       },
  //     ],
  //   },
  // },
  {
    urls: ['01.xyz'],
    testPath: [':text("Connect")', ':text("Continue")'],
    skip: {
      mobile: true,
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
    urls: ['crosschain.bifi.finance'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          findIconAndName({ name }) {
            return findIconAndNameByIcon(
              '.MuiPaper-root.MuiPaper-elevation a img[src*="icon-metamask"]',
              (icon: HTMLElement) => icon.parentElement?.parentElement,
              name,
            );
          },
        },
        {
          ...basicWalletInfo['walletconnect'],
          findIconAndName({ name }) {
            return findIconAndNameByIcon(
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
            return findIconAndNameByIcon(
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
    skip: { mobile: true },
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
          afterUpdate(textNode, img) {
            textNode.parentElement && makeTextEllipse(textNode.parentElement);
          },
        },
      ],
    },
  },
  {
    urls: ['app.justlend.org'],
    mutationObserverOptions: {
      childList: true,
      subtree: true,
      attributes: true,
    },
    walletsForProvider: {
      [IInjectedProviderNames.tron]: [
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
      [IInjectedProviderNames.tron]: [
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
          afterUpdate(textNode, img) {
            textNode.parentElement && (textNode.parentElement.style.textAlign = 'left');
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
      [IInjectedProviderNames.ethereum]: [metamaskForRainbowKit, walletConnectForRainbowKit],
    },
  },
  {
    urls: ['app.osmosis.zone'],

    walletsForProvider: {
      [IInjectedProviderNames.cosmos]: [
        {
          ...basicWalletInfo['keplr'],
          name: /^Keplr$/i,
          container: () => {
            return getConnectWalletModalByTitle('div[role="dialog"]', 'Connect wallet');
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
    constraintMap: { icon: [], text: [] },
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: () =>
            getConnectWalletModalByTitle('.relative.rounded-2xl.text-default', 'Connect Wallet'),
        },
      ],
      [IInjectedProviderNames.polkadot]: [
        {
          ...basicWalletInfo['polkadot'],
          findIconAndName: ({ name }) => {
            return findIconAndNameByIcon(
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
    testPath: {
      desktop: ['.chakra-modal__body', ':text("Start staking")', ':text("Connect your Wallet")'],
      mobile: [':text("Connect")'],
    },
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [metamaskForRainbowKit, walletConnectForRainbowKit],
    },
  },
  {
    urls: ['app.arrakis.fi'],
    testPath: [':text("For Users")', ':text("Connect Wallet")'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [metamaskForRainbowKit, walletConnectForRainbowKit],
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
    urls: ['www.saucerswap.finance'],
    testPath: [
      ':text("Connect Wallet")',
      ':text("read to the end.")',
      'input.PrivateSwitchBase-input',
      'button:has-text("OK")',
    ],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: () =>
            getConnectWalletModalByTitle('div.MuiPaper-root[role="dialog"]', 'Connect Wallet'),
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
              findIconAndNameByIcon(
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
              findIconAndNameByIcon(
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
              findIconAndNameByIcon(
                'svg[aria-label="metamask-icon"]',
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
    urls: ['www.ankr.com'],
    testUrls: ['www.ankr.com/staking/stake/'],
    testPath: {
      mobile: ['header button.MuiButtonBase-root', ':text("Connect wallet")'],
      desktop: [':text("Connect wallet")'],
    },
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: () =>
            getConnectWalletModalByTitle('div[role="dialog"]', 'Connect wallet to continue'),
        },
      ],
    },
  },
  {
    urls: ['dapp.chainge.finance'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: () =>
            getConnectWalletModalByTitle('div[style*="opacity: 1"]', 'Connect your wallet'),
          afterUpdate(textNode, img) {
            textNode.parentElement && (textNode.parentElement.style.textAlign = 'center');
          },
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
    testPath: ['button:has-text("Accept All Cookies")', 'header button:has-text("Connect Wallet")'],

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
              findIconAndNameByIcon('img[src*="assets/metamask"]', 'auto-search-text', name, modal)
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
            return (
              modal &&
              findIconAndNameByName(modal, name, 'auto-search-icon', {
                text: [],
                icon: [isWalletIconLessEqualThan],
              })
            );
          },
        },
      ],
    },
  },
  {
    urls: ['app.alexlab.co'],
    testPath: [':text("Accept")', '[role="button"]:text("Connect Wallet")'],
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
    walletsForProvider: {
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
      mobile: true, // not supported by the site
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
            return findIconAndNameByIcon(
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
            return findIconAndNameByIcon(
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

  {
    urls: ['app.init.capital'],
    testPath: ['button:has-text("Continue")', ':text("Connect Wallet")'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [metamaskForRainbowKit, walletConnectForRainbowKit],
    },
  },
  {
    urls: ['www.dx.app'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [metamaskForRainbowKit, walletConnectForRainbowKit],
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
            return findIconAndNameByIcon(
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
              findIconAndNameByIcon('img[src*="metamask"]', 'auto-search-text', wallet.name, modal)
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
              findIconAndNameByIcon(
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
              modal && findIconAndNameByIcon('img[alt="MetaMask"]', 'auto-search-text', name, modal)
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
              findIconAndNameByIcon('img[alt="WalletConnect"]', 'auto-search-text', name, modal)
            );
          },
        },
      ],
    },
  },
  {
    urls: ['app.extrafi.io'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [metamaskForRainbowKit, walletConnectForRainbowKit],
    },
  },
  {
    urls: ['app.degate.com'],
    testPath: async (page: Page) => {
      const frame = page.locator('iframe').contentFrame();
      await frame?.locator('button:has-text("Connect Wallet")')?.first()?.click();
    },
    testUrls: ['app.degate.com/trade/USDC/ETH'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          findIconAndName(wallet) {
            const modal = getConnectWalletModalByTitle(
              'section.mantine-Modal-content',
              'Connect Wallet',
            );
            return (
              modal &&
              findIconAndNameByIcon(
                'img[src*="metamask"]',
                (icon) => icon.parentElement?.parentElement,
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
              'section.mantine-Modal-content',
              'Connect Wallet',
            );
            return (
              modal &&
              findIconAndNameByIcon(
                'img[src*="walletConnect"]',
                (icon) => icon.parentElement?.parentElement,
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
              findIconAndNameByIcon('img[src*="metamask"]', 'auto-search-text', wallet.name, modal)
            );
          },
        },
        {
          ...basicWalletInfo['walletconnect'],
          findIconAndName({ name }) {
            const modal = getConnectWalletModalByTitle('div.ant-modal-content', 'Select a wallet');
            return (
              modal &&
              findIconAndNameByIcon(
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
              findIconAndNameByIcon('img[alt="MetaMask"]', 'auto-search-text', wallet.name, modal)
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
              findIconAndNameByIcon('img[alt="WalletConnect"]', 'auto-search-text', name, modal)
            );
          },
        },
      ],
    },
  },
  {
    urls: ['exchange.idex.io'], //not existed?
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
      [IInjectedProviderNames.ethereum]: [metamaskForRainbowKit, walletConnectForRainbowKit],
    },
  },
  {
    urls: ['app.frax.finance'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [metamaskForRainbowKit, walletConnectForRainbowKit],
    },
  },
  {
    urls: ['beets.fi'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [metamaskForRainbowKit, walletConnectForRainbowKit],
    },
  },
  {
    urls: ['app.gmx.io'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [metamaskForRainbowKit, walletConnectForRainbowKit],
    },
  },
  {
    urls: ['link3.to'],
    skip: {
      mobile: true, //WARN: mobile is not supported by the site
    },
    testPath: [':text("Login")', ':text("Connect Wallet")'],

    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [metamaskForRainbowKit],
    },
  },
  {
    urls: ['app.mento.org'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [metamaskForRainbowKit, walletConnectForRainbowKit],
    },
  },
  {
    urls: ['synapseprotocol.com'],
    testPath: {
      mobile: ['button[data-test-id="mobile-navbar-button"]', ':text("Connect Wallet")'],
      desktop: [':text("Connect Wallet")'],
    },
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [metamaskForRainbowKit, walletConnectForRainbowKit],
    },
  },

  {
    urls: ['app.hydroprotocol.finance'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          findIconAndName({ name }) {
            return findIconAndNameByIcon(
              'img[src*="metamask"][alt="Metamask"]',
              'auto-search-text',
              name,
            );
          },
        },
      ],
      [IInjectedProviderNames.cosmos]: [
        {
          ...basicWalletInfo['keplr'],
          findIconAndName({ name }) {
            return findIconAndNameByIcon(
              'img[src*="keplr"][alt="Keplr"]',
              'auto-search-text',
              name,
            );
          },
        },
      ],
    },
  },
  {
    urls: ['biswap.org'],
    testPath: ['button.closeModal', ':text("Later")', 'button:text("Connect Wallet")'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: 'button#wallet-connect-metamask',
          afterUpdate(textNode, updatedName) {
            textNode.parentElement && makeTextEllipse(textNode.parentElement);
          },
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: 'button#wallet-connect-walletconnect',
          afterUpdate(textNode, updatedName) {
            textNode.parentElement && makeTextEllipse(textNode.parentElement);
          },
        },
      ],
    },
  },
  {
    urls: ['app.pangolin.exchange'],
    testPath: ['#connect-wallet'],
    skip: { mobile: true },

    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          findIconAndName({ name }) {
            return findIconAndNameByIcon(
              'img[alt="Metamask Logo"][title="Metamask"]',
              'auto-search-text',
              name,
            );
          },
        },
        {
          ...basicWalletInfo['walletconnect'],
          findIconAndName({ name }) {
            return findIconAndNameByIcon(
              'img[alt="WalletConnect Logo"][title="WalletConnect"]',
              'auto-search-text',
              name,
            );
          },
        },
      ],
    },
  },
  {
    urls: ['lybra.finance'],
    testPath: {
      desktop: [':text("Launch App")', ':text("Connect Wallet")'],
      mobile: [
        '[class*="header_menuIcon"][src*="menu"]',
        ':text("Launch App")',
        ':text("Connect Wallet")',
      ],
    },
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [metamaskForRainbowKit, walletConnectForRainbowKit],
    },
  },

  {
    urls: ['app.wagmi.com'],
    constraintMap: { icon: [isWalletIconLessEqualThan], text: [] },
    only: true,
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: '#wallet-dropdown-scroll-wrapper',
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: '#wallet-dropdown-scroll-wrapper',
          afterUpdate(textNode, img) {
            textNode.parentElement && (textNode.parentElement.style.textAlign = 'left');
          },
        },
      ],
    },
  },
  {
    urls: ['app.ease.org'],
    testPath: [':text("NOT NOW")', ':text("CONNECT")'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          findIconAndName({ name }) {
            const modal = getConnectWalletModalByTitle(
              '#headlessui-portal-root',
              'Connect your Wallet',
            );
            return (
              modal &&
              findIconAndNameByIcon(
                'img[src*="metamask.svg"][alt="MetaMask"]',
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
    urls: ['www.theidols.io'],
    skip: {
      mobile: true, //no connect wallet modal
    },
    testUrls: ['www.theidols.io/marketplace'],

    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: '#WEB3_CONNECT_MODAL_ID .web3modal-modal-container',
        },
      ],
    },
  },
  {
    urls: ['netswap.io'],
    skip: {
      mobile: true, //没弹窗
    },
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: '#connect-METAMASK',
        },
      ],
    },
  },
  {
    urls: ['rosswap.com'],
    constraintMap: { icon: [isWalletIconLessEqualThan], text: [] },
    only: true,
    skip: {
      mobile: true, //no connect wallet modal
    },
    // skip:
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: '#connect-METAMASK',
        },
      ],
    },
  },
  {
    urls: ['maiadao.io'],
    constraintMap: { icon: [isWalletIconLessEqualThan], text: [] },
    only: true,
    skip: {
      mobile: true, //no connect wallet modal
    },
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: '#connect-METAMASK',
        },
      ],
    },
  },
  {
    urls: ['diva.shamirlabs.org'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [metamaskForRainbowKit],
    },
  },
  {
    urls: ['www.convexfinance.com'],
    skip: true, //no icon
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          update({ updatedName, name }) {
            const modal = document.querySelector('#wallet-info-dropdown ul') as HTMLElement;
            const textNode = findWalletTextByParent(modal, name, [isClickable]);
            const newTextNode = textNode && replaceText(textNode, updatedName);
            newTextNode?.parentElement && makeTextEllipse(newTextNode?.parentElement);
            return null;
          },
        },
      ],
    },
  },
  {
    urls: ['www.staderlabs.com'],
    testUrls: ['www.staderlabs.com/eth/stake/'],
    constraintMap: { icon: [isWalletIconLessEqualThan], text: [] },
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [metamaskForRainbowKit, walletConnectForRainbowKit],
    },
  },
  {
    urls: ['stake.solblaze.org'],
    testPath: [':text("Agree")', ':text("Connect Wallet")'],
    testUrls: ['stake.solblaze.org/app'],
    walletsForProvider: {
      [IInjectedProviderNames.solana]: [
        {
          ...basicWalletInfo['phantom'],
          container: '#connect_modal',
          afterUpdate(text) {
            if (text.parentElement?.parentElement) {
              text.parentElement.parentElement.style.whiteSpace = 'noWrap';
              makeTextEllipse(text.parentElement, { maxWidth: 'min(18vw,107px)' });
            }
          },
        },
      ],
    },
  },
  {
    urls: ['buzz.bsquared.network'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: () => getConnectWalletModalByTitle('.modalContent', 'Connect Wallet'),
        },
      ],
      [IInjectedProviderNames.btc]: [
        {
          ...basicWalletInfo['unisat'],
          findIconAndName({ name }) {
            const modal = getConnectWalletModalByTitle('.modalContent', 'Connect Wallet');
            return (
              modal &&
              findIconAndNameByIcon('img[src*="layout/unisat.png"]', 'auto-search-text', name)
            );
          },
        },
      ],
    },
  },
  {
    urls: ['task.bsquared.network'],
    skip: { mobile: true }, //warn:mobile is not supported by the site

    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: () =>
            getConnectWalletModalByTitle('.ReactModal__Content', 'Please Connect A Wallet'),
        },
      ],
      [IInjectedProviderNames.btc]: [
        {
          ...basicWalletInfo['unisat'],
          container: () =>
            getConnectWalletModalByTitle('.ReactModal__Content', 'Please Connect A Wallet'),
        },
      ],
    },
  },
  {
    urls: ['juststable.tronscan.org'],
    testPath: [':text("Enter")'],
    skip: true,
    walletsForProvider: {
      [IInjectedProviderNames.tron]: [
        {
          ...basicWalletInfo['tronlink'],
          update({ name, updatedName, updatedIcon }) {
            const button = document.querySelector<HTMLButtonElement>(
              'button.ant-btn.tronlinkLogin',
            );
            const text = button && findWalletTextByParent(button, name, []);
            text && replaceText(text, updatedName);
            button && (button.style.backgroundImage = `url(${updatedIcon})`);
            return null;
          },
        },
      ],
    },
  },
  {
    urls: ['app.cetus.zone'],
    testPath: ['div.radio', 'button:has-text("Continue")', 'button:has-text("Connect Wallet")'],
    walletsForProvider: {
      [IInjectedProviderNames.aptos]: [
        {
          ...basicWalletInfo['martian'],
          container: 'div.ant-modal.wallet-modal',
        },
        //petra不存在
        // {
        //   ...basicWalletInfo['petra'],
        //   container: 'div.ant-modal.wallet-modal',
        // },
      ],
      [IInjectedProviderNames.sui]: [
        {
          ...basicWalletInfo['suiwallet'],
          name: /^Sui Wallet$/i,
          container: 'div.ant-modal.wallet-modal',
        },
      ],
    },
  },

  {
    urls: ['app.radiant.capital'],
    testPath: [':text("Continue")', ':text("Connect Wallet")'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        // {
        //   ...basicWalletInfo['metamask'],
        // },
        {
          container: '.connect-wallet-modal',
          ...basicWalletInfo['walletconnect'],
          afterUpdate(textNode, img) {
            img.style.height = '40px';
            img.style.width = '40px';
          },
        },
      ],
    },
  },
  {
    //mobile version is redirected to app-mobile.ariesmarkets.xyz. check next item
    urls: ['app.ariesmarkets.xyz'],
    testUrls: ['app.ariesmarkets.xyz/lending'],

    constraintMap: { icon: [isWalletIconLessEqualThan], text: [] },
    only: true,
    walletsForProvider: {
      [IInjectedProviderNames.aptos]: [
        {
          ...basicWalletInfo['petra'],
          container: () => getConnectWalletModalByTitle('div.mantine-Paper-root', 'Select Wallet'),
        },
      ],
    },
  },
  {
    urls: ['app-mobile.ariesmarkets.xyz'],
    constraintMap: { icon: [isWalletIconLessEqualThan], text: [] },
    only: true,
    walletsForProvider: {
      [IInjectedProviderNames.aptos]: [
        {
          ...basicWalletInfo['petra'],
          findIconAndName({ name }) {
            const mobileTitle =
              (domUtils.findTextNode('#root', 'Select Wallet', 'first') as Text) || null;
            const modal =
              mobileTitle?.parentElement?.parentElement?.parentElement?.parentElement || null;
            if (!modal) {
              return null;
            }
            //there is multiple wallet icons, so we need to find the correct one manually
            const text = domUtils.findTextNode(modal, name, 'first') as Text;
            const imgs = Array.from(
              text.parentElement?.parentElement?.parentElement?.querySelectorAll<HTMLImageElement>(
                'div[style*="background-image"]',
              ) || [],
            );
            if (imgs.length > 1 || imgs.length === 0) {
              return null;
            }
            const img = imgs[0];
            if (!text || !img) {
              return null;
            }
            return {
              iconNode: img,
              textNode: text,
            };
          },
        },
      ],
    },
  },
  {
    urls: ['app.indigoprotocol.io'],
    // testPath: [':text("I agree")', ':text("Connect")'],
    constraintMap: { icon: [], text: [] },
    walletsForProvider: {
      [IInjectedProviderNames.cardano]: [
        {
          ...basicWalletInfo['nami'],
          container: () => {
            return getConnectWalletModalByTitle('#modal-connect-wallet', 'Connect Wallet');
          },
        },
      ],
    },
  },

  {
    urls: ['app.minswap.org'],
    testPath: {
      desktop: [':text("Connect Wallet")'],
      mobile: ['header.flex > button>svg', ':text("Connect Wallet")'],
    },
    skip: true, //temp skip

    walletsForProvider: {
      [IInjectedProviderNames.cardano]: [
        {
          ...basicWalletInfo['nami'],
          findIconAndName({ name }) {
            const modal = getConnectWalletModalByTitle(
              'div.dialog-connect-wallet',
              'Connect wallet',
            );
            return (
              modal &&
              findIconAndNameByIcon(
                'img[src*="nami.svg"][alt="Nami"]',
                'auto-search-text',
                name,
                modal,
                { text: [], icon: [] },
                6,
              )
            );
          },
        },
      ],
    },
  },
  {
    urls: ['pancakeswap.finance', 'www.pancakeswap.finance'],
    skip: {
      mobile: true, //temp skip for lack walletconnect
    },
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          findIconAndName({ name }) {
            const modal = getConnectWalletModalByTitle('#portal-root', 'Connect Wallet');
            return (
              modal &&
              findIconAndNameByIcon(
                'img[src*="wallets/metamask.png"]',
                'auto-search-text',
                name,
                modal,
                { text: [], icon: [] },
                5,
              )
            );
          },
        },
        {
          ...basicWalletInfo['walletconnect'],
          findIconAndName({ name }) {
            const modal = getConnectWalletModalByTitle('#portal-root', 'Connect Wallet');
            return (
              modal &&
              findIconAndNameByIcon(
                'img[src*="wallets/walletconnect.png"]',
                'auto-search-text',
                name,
                modal,
                { text: [], icon: [] },
                5,
              )
            );
          },
        },
      ],
    },
  },
  {
    urls: ['www.nucleon.space'],
    testUrls: ['www.nucleon.space/#/data/stake'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: () => getConnectWalletModalByTitle('div.ant-modal-content', 'Select a Wallet'),
          afterUpdate(textNode, icon) {
            icon.style.height = '28px';
            icon.style.width = 'auto';
          },
        },
      ],
    },
  },
  {
    urls: ['agni.finance'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          findIconAndName({ name }) {
            const modal =
              getConnectWalletModalByTitle('div.inside', 'Connect Wallet') ||
              getConnectWalletModalByTitle('div[role="dialog"]', 'Start by connecting with one');
            return (
              modal &&
              findIconAndNameByIcon('img[src*="metamask.png"]', 'auto-search-text', name, modal)
            );
          },
        },
      ],
    },
  },
  {
    urls: ['liquidswap.com'],

    testPath: [
      ':text("I accept the")',
      ':text("Continue")',
      ':text("Connect Wallet")',
      ':text("Other Wallets")',
    ],
    walletsForProvider: {
      [IInjectedProviderNames.aptos]: [
        {
          ...basicWalletInfo['petra'],
          findIconAndName({ name }) {
            const modal = getConnectWalletModalByTitle('div.p-dialog', 'Connect a Wallet');
            return (
              modal &&
              findIconAndNameByIcon('img[alt="Petra Wallet"]', 'auto-search-text', name, modal)
            );
          },
        },
        {
          ...basicWalletInfo['martian'],
          findIconAndName({ name }) {
            const modal = getConnectWalletModalByTitle('div.p-dialog', 'Connect a Wallet');
            return (
              modal &&
              findIconAndNameByIcon('img[alt="Martian Wallet"]', 'auto-search-text', name, modal)
            );
          },
        },
      ],
    },
  },
  // {
  //   urls: ['stbt.matrixdock.com'],

  //   walletsForProvider: {
  //     [IInjectedProviderNames.ethereum]: [
  //       {
  //         ...basicWalletInfo['metamask'],
  //         findIconAndName({ name }) {
  //           const modal = getConnectWalletModalByTitle('div.inside', 'Connect Wallet');
  //           return (
  //             modal &&
  //             findIconAndNameDirectly('img[src*="metamask.png"]', 'auto-search-text', name, modal)
  //           );
  //         },
  //       },
  //     ],
  //   },
  // },
  {
    urls: ['spooky.fi'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: 'div[data-testid="wallet-modal"]',
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: 'div[data-testid="wallet-modal"]',
          skip: { mobile: true },
        },
      ],
    },
  },
  {
    urls: ['usyc.hashnote.com'],
    testPath: [':text("Connect your wallet")'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          findIconAndName({ name }) {
            const shadowRoot = document.querySelector(
              'div[data-testid="dynamic-modal-shadow"]',
            )?.shadowRoot;
            if (!shadowRoot) {
              return null;
            }
            const parent = shadowRoot.querySelector('div.wallet-list__container');
            return (
              parent &&
              findIconAndNameByIcon(
                'img[data-testid="wallet-icon-metamask"]',
                'auto-search-text',
                name,
                parent as HTMLElement,
              )
            );
          },
        },
      ],
    },
  },
  {
    urls: ['polygon.tangible.store'],
    testPath: {
      mobile: ['header button img'],
      desktop: [':text("Connect")'],
    },
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          findIconAndName({ name }) {
            const modal = getConnectWalletModalByTitle('div[role="dialog"]', 'Connect wallet');
            return (
              modal &&
              findIconAndNameByIcon(
                'img[src*="metamask.svg"][alt="MetaMask icon"]',
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
    urls: ['apps.acala.network'],
    walletsForProvider: {
      [IInjectedProviderNames.polkadot]: [
        {
          ...basicWalletInfo['polkadot'],
          findIconAndName() {
            const modal = getConnectWalletModalByTitle('div[role="dialog"]', 'Connect Wallet');
            return (
              modal &&
              findIconAndNameByIcon(
                'img[alt="Polkadotjs Logo"]',
                'auto-search-text',
                /^Polkadot/,
                modal,
              )
            );
          },
        },
      ],
    },
  },
  {
    urls: ['app.rhino.fi'],
    testPath: [':text("Allow All")', ':text("connect wallet")'],
    constraintMap: { icon: [], text: [] },
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: '#metamask',
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: '#walletConnect',
        },
      ],
    },
  },
  {
    urls: ['app.zero.button.finance'],
    testPath: { mobile: ['header button svg', ':text("Connect")'], desktop: [':text("Connect")'] },

    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: 'ul.bn-onboard-modal-select-wallets',
        },
      ],
    },
  },
  {
    urls: ['blast.io'],
    testUrls: ['blast.io/zh-CN/bridge'],
    testPath: async (page) => {
      await page.locator(':text("Check your")').click();
      await page.evaluate(function () {
        document.querySelector('body')?.click();
      });
      await page.locator(":text('连接钱包')").click();
    },
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: 'div[aria-label="选择要连接的钱包"]',
        },
      ],
    },
  },
  {
    urls: ['app.ichi.org'],
    testPath: ['button:text("Connect Wallet")'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [metamaskForRainbowKit, walletConnectForRainbowKit],
    },
  },
  {
    urls: ['klayswap.com'],
    testPath: ['button:text("Confirm")', ':text("Connect Wallet")'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: 'div.SelectWalletModal',
          afterUpdate(textNode, icon) {
            if (textNode.parentElement) {
              makeTextEllipse(textNode.parentElement, { width: '100%' });
              textNode.parentElement.style.flexShrink = '0';
              // textNode.parentElement.style.width = '100%';
            }
            icon.style.height = 'auto';
          },
        },
      ],
    },
  },
  {
    urls: ['dojo.trading'],

    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          findIconAndName({ name }) {
            const modal = getConnectWalletModalByTitle('div[role="dialog"]', 'Connect Wallet');
            return (
              modal &&
              findIconAndNameByIcon(
                'img[src*="metamask.svg"][alt="Metamask"]',
                'auto-search-text',
                name,
                modal,
              )
            );
          },
          afterUpdate(textNode, icon) {
            icon.style.marginRight = '12px';
          },
        },
      ],
      [IInjectedProviderNames.cosmos]: [
        {
          ...basicWalletInfo['keplr'],
          findIconAndName({ name }) {
            const modal = getConnectWalletModalByTitle('div[role="dialog"]', 'Connect Wallet');
            return (
              modal &&
              findIconAndNameByIcon(
                'img[src*="keplr.svg"][alt="Keplr"]',
                'auto-search-text',
                name,
                modal,
              )
            );
          },
          afterUpdate(textNode, icon) {
            icon.style.marginRight = '12px';
          },
        },
      ],
    },
  },
  {
    urls: ['gains.trade'],
    testUrls: ['gains.trade/trading#BTC-USD'],
    testPath: ['button:has-text("Agree")', ':text("Connect Wallet")'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [metamaskForRainbowKit],
    },
  },
  {
    urls: ['dhedge.org'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          findIconAndName(wallet) {
            const modal = getConnectWalletModalByTitle(
              '#headlessui-portal-root div[role="dialog"]',
              'Choose Network',
            );
            return (
              modal &&
              findIconAndNameByIcon(
                'img[src*="metamask"][alt="MetaMask logo"]',
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
              '#headlessui-portal-root div[role="dialog"]',
              'Choose Network',
            );
            return (
              modal &&
              findIconAndNameByIcon(
                'img[src*="wallet_connect"][alt="WalletConnect logo"]',
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
    urls: ['app.milkyway.zone'],
    skip: { mobile: true }, //WARN: mobile is not supported by the site
    walletsForProvider: {
      [IInjectedProviderNames.cosmos]: [
        {
          ...basicWalletInfo['keplr'],
          name: /^(Keplr|Keplr Mobile)$/i,
          container: 'div[aria-label="wallet list"][role="list"]',
        },
      ],
    },
  },
  {
    urls: ['neopin.io'],
    // skip: {
    // mobile: true, //WARN: mobile is not supported by the site
    // },
    skip: true,
    // testPath: ['#__next :text("Accept All")', ':text("Connect Wallet")'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: () => getConnectWalletModalByTitle('#modal-root', 'Connect Wallet'),
        },
      ],
    },
  },
  {
    urls: ['orby.network'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          findIconAndName({ name }) {
            const modal = getConnectWalletModalByTitle(
              '.chakra-portal div.chakra-modal__content-container',
              'Please select your wallet:',
            );
            return (
              modal && findIconAndNameByIcon('img[alt="MetaMask"]', 'auto-search-text', name, modal)
            );
          },
        },
      ],
    },
  },
  {
    urls: ['tokenlon.im'],
    testUrls: ['tokenlon.im/instant'],
    testPath: [':text("Try it now")', ':text("Connect Wallet")'],
    skip: {
      mobile: true, //WARN: metamask is not supported by the mobile site
    },
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          findIconAndName({ name }) {
            const modal = getConnectWalletModalByTitle('div.connect-options', 'Select Wallet');
            return (
              modal &&
              findIconAndNameByIcon('img.logo[alt="MetaMask"]', 'auto-search-text', name, modal)
            );
          },
        },
        {
          ...basicWalletInfo['walletconnect'],
          findIconAndName({ name }) {
            const modal = getConnectWalletModalByTitle('div.connect-options', 'Select Wallet');
            return (
              modal &&
              findIconAndNameByIcon(
                'img.logo[alt="WalletConnect"]',
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
    urls: ['app.unitus.finance'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          findIconAndName({ name }) {
            const modals = (domUtils.findTextNode('#root', 'Connect Wallet', 'all') as Text[])
              .map((e) => e?.parentElement?.parentElement)
              .filter(Boolean);
            const modal = modals?.[modals.length - 1] as HTMLElement;
            return modal
              ? findIconAndNameByIcon(
                  'img[src*="wallet-MetaMask"]',
                  'auto-search-text',
                  name,
                  modal,
                )
              : null;
          },
        },
      ],
    },
  },
  {
    urls: ['app.shadeprotocol.io'],
    testPath: {
      mobile: [
        '.main-nav-mobile .hamburger',
        '.proceed-cta-checkbox input',
        'button:text("Proceed")',
        ':text("Connect Wallet")',
      ],
      desktop: ['.proceed-cta-checkbox input', 'button:text("Proceed")', ':text("Connect Wallet")'],
    },
    skip: { mobile: true }, //input click not work

    constraintMap: { icon: [isWalletIconLessEqualThan], text: [] },
    only: true,
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: () =>
            getConnectWalletModalByTitle('div.modal-connect-wallet', 'Connect Wallet'),
        },
      ],
      [IInjectedProviderNames.cosmos]: [
        {
          ...basicWalletInfo['keplr'],
          container: () =>
            getConnectWalletModalByTitle('div.modal-connect-wallet', 'Connect Wallet'),
        },
      ],
    },
  },
  {
    urls: ['app.mai.finance'],
    skip: { mobile: true }, //it seems mobile is not supported
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: 'button#connect-METAMASK',
        },
      ],
    },
  },
  {
    urls: ['smardex.io'],
    testUrls: ['smardex.io/swap'],
    testPath: {
      mobile: ['nav button.btn-outline'],
      desktop: [':text("Connect Wallet")'],
    },
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [metamaskForRainbowKit, walletConnectForRainbowKit],
    },
  },
  {
    urls: ['stake.link'],
    testUrls: ['stake.link/ethereum'],

    testPath: {
      mobile: ['button[data-testid="rk-connect-button"]'],
      desktop: [':text("Connect Wallet")'],
    },
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [metamaskForRainbowKit, walletConnectForRainbowKit],
    },
  },
  {
    urls: ['jpegd.io'],
    testUrls: ['jpegd.io/vaults'],
    testPath: {
      desktop: ['button:has-text("I agree")', ':text("Connect Wallet")'],
      mobile: [
        'button:has-text("I agree")',
        'div.ei7w3c12.MuiBox-root svg',
        ':text("Connect Wallet")',
      ],
    },
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          name: / Metamask$/,
          // container: 'div[role="presentation"].MuiModal-root',
          findIconAndName({ name }) {
            const modal = document.querySelector('div[role="presentation"].MuiModal-root');
            return modal
              ? findIconAndNameByIcon(
                  'img[src*="static/media/1.eb7cbbcbf"]',
                  'auto-search-text',
                  name,
                  modal as HTMLElement,
                )
              : null;
          },
        },
        {
          ...basicWalletInfo['walletconnect'],
          findIconAndName({ name }) {
            const modal = document.querySelector('div[role="presentation"].MuiModal-root');
            return modal
              ? findIconAndNameByIcon(
                  'img[src*="static/media/2.cb9826961cbcd25676"]',
                  'auto-search-text',
                  name,
                  modal as HTMLElement,
                )
              : null;
          },
        },
      ],
    },
  },
  {
    urls: ['fi.woo.org'],
    testUrls: ['fi.woo.org/swap'],
    mutationObserverOptions: {
      childList: true,
      subtree: true,
      attributes: true,
    },
    only: true,
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: '.modal .outer-container div.wallets-container ',
          findIconAndName: ({ container, name }) => {
            return findIconAndNameInShadowRoot('onboard-v2', container as string, name);
          },
          afterUpdate(textNode, img) {
            img.style.width = '32px';
            img.style.height = '32px';
            img.style.maxWidth = '32px';
            img.style.maxHeight = '32px';
          },
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: '.modal .outer-container div.wallets-container ',
          findIconAndName: ({ container, name }) => {
            return findIconAndNameInShadowRoot('onboard-v2', container as string, name);
          },
          afterUpdate(textNode, img) {
            img.style.width = '32px';
            img.style.height = '32px';
            img.style.maxWidth = '32px';
            img.style.maxHeight = '32px';
          },
        },
      ],
    },
  },
  {
    urls: ['notional.finance'],
    testUrls: ['notional.finance/portfolio/mainnet/overview'],

    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],

          findIconAndName({ name }) {
            const modal = getConnectWalletModalByTitle(
              'div.MuiDrawer-paper.MuiDrawer-paperAnchorRight',
              'CONNECT A WALLET',
            );
            if (!modal) {
              return null;
            }
            const text = findWalletTextByParent(modal, name, []);
            const img = text?.parentElement?.parentElement?.querySelector('img');
            return img && text
              ? {
                  textNode: text,
                  iconNode: img,
                }
              : null;
          },
          afterUpdate(textNode, img) {
            if (textNode.parentElement) {
              textNode.parentElement.style.overflow = 'visible';
            }
          },
        },
        {
          ...basicWalletInfo['walletconnect'],
          findIconAndName({ name }) {
            const modal = getConnectWalletModalByTitle(
              'div.MuiDrawer-paper.MuiDrawer-paperAnchorRight',
              'CONNECT A WALLET',
            );
            if (!modal) {
              return null;
            }
            const text = findWalletTextByParent(modal, name, []);
            const img = text?.parentElement?.parentElement?.querySelector('img');
            return img && text
              ? {
                  textNode: text,
                  iconNode: img,
                }
              : null;
          },
          afterUpdate(textNode, img) {
            if (textNode.parentElement) {
              textNode.parentElement.style.overflow = 'visible';
            }
          },
        },
      ],
    },
  },
  {
    urls: ['shibaswap.com'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: 'button#connect-0',
          skip: { mobile: true }, //mobile is not supported by the site
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: 'button#connect-1',
        },
      ],
    },
  },
  {
    urls: ['app.kuma.bond'],
    testPath: [
      ':text("connect")',
      ':text("Disclaimer")',
      'button[id*="headlessui-switch"]',
      'button:text("Next")',
    ],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [metamaskForRainbowKit, walletConnectForRainbowKit],
    },
  },
  {
    urls: ['par.mimo.capital'],

    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          findIconAndName({ name }) {
            const modal = getConnectWalletModalByTitle(
              'section.chakra-modal__content[role="dialog"]',
              'Connect to a wallet',
            );
            return (
              modal &&
              findIconAndNameByIcon(
                'img[src*="metamask-icon"][alt="Icon"]',
                'auto-search-text',
                name,
                modal,
              )
            );
          },
          afterUpdate(textNode, iconNode) {
            iconNode.style.aspectRatio = '1';
            iconNode.style.minWidth = '32px';
          },
        },
        {
          ...basicWalletInfo['walletconnect'],
          findIconAndName({ name }) {
            const modal = getConnectWalletModalByTitle(
              'section.chakra-modal__content[role="dialog"]',
              'Connect to a wallet',
            );
            return (
              modal &&
              findIconAndNameByIcon(
                'img[src*="wallet-connect-icon"][alt="Icon"]',
                'auto-search-text',
                name,
                modal,
              )
            );
          },
          afterUpdate(textNode, iconNode) {
            iconNode.style.aspectRatio = '1';
            iconNode.style.minWidth = '32px';
            const { defaultVal } = getMaxWithOfText(textNode, iconNode);
            textNode.parentElement &&
              makeTextEllipse(textNode.parentElement, {
                maxWidth: defaultVal,
              });
          },
        },
      ],
    },
  },
  {
    urls: ['www.mev.io'],
    testUrls: ['www.mev.io/stake'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [metamaskForRainbowKit, walletConnectForRainbowKit],
    },
  },
  {
    urls: ['dapp.rifonchain.com'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: '#rlogin-connect-modal',
        },
      ],
    },
  },
  {
    urls: ['v2.sturdy.finance'],
    skip: { mobile: true }, //there is no entry for connect wallet

    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: () => getConnectWalletModalByTitle('div[role="dialog"]', 'Connect a wallet'),
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: () => getConnectWalletModalByTitle('div[role="dialog"]', 'Connect a wallet'),
        },
      ],
    },
  },
  {
    urls: ['blast.wasabi.xyz'],
    testPath: [':text("STAKE NOW")', ':text("CONNECT WALLET")'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [metamaskForRainbowKit, walletConnectForRainbowKit],
    },
  },
  {
    urls: ['app.cellana.finance'],

    walletsForProvider: {
      [IInjectedProviderNames.aptos]: [
        {
          ...basicWalletInfo['petra'],
          name: /^Petra Wallet$/,
          container: () =>
            getConnectWalletModalByTitle('div.ant-modal[role="dialog"]', 'Connect a wallet'),
        },
      ],
    },
  },
  {
    urls: ['www.vaultka.com'],
    testPath: {
      mobile: [':text("Connect")'],
      desktop: [':text("Coming Soon")', ':text("Connect Wallet")'],
    },
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [metamaskForRainbowKit, walletConnectForRainbowKit],
    },
  },
  {
    urls: ['hmx.org'],
    testUrls: ['hmx.org/blast/trade/eth-usd'],
    testPath: {
      desktop: ['button:has-text("Accept & Continue")', ':text("Connect Wallet")'],
      mobile: ['button:has-text("Accept & Continue")', ':text("Connect Wallet")'],
    },
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          findIconAndName(wallet) {
            const modal = getConnectWalletModalByTitle('div[role="dialog"]', 'Connect Wallet');
            return (
              modal &&
              findIconAndNameByIcon(
                'img[src*="metamask"][alt="MetaMask"]',
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
            const modal = getConnectWalletModalByTitle('div[role="dialog"]', 'Connect Wallet');
            return (
              modal &&
              findIconAndNameByIcon(
                'img[src*="wallet-connect"][alt="Wallet Connect"]',
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
    urls: ['app.mav.xyz'],
    testUrls: ['app.mav.xyz'],
    only: true,
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: 'section.fixed',
          findIconAndName: ({ container, name }) => {
            return findIconAndNameInShadowRoot('onboard-v2', container as string, name);
          },
        },
        {
          ...basicWalletInfo['walletconnect'],
          container: 'section.fixed',
          findIconAndName: ({ container, name }) => {
            return findIconAndNameInShadowRoot('onboard-v2', container as string, name);
          },
        },
      ],
    },
  },
  {
    urls: ['app.vesper.finance'],
    constraintMap: { icon: [isWalletIconLessEqualThan], text: [] },
    only: true,
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: () =>
            getConnectWalletModalByTitle('div.fixed div.rounded-lg', 'Connect Wallet'),
        },
      ],
    },
  },
  {
    urls: ['ferroprotocol.com'],
    testPath: {
      mobile: ['header [data-testid="settingsMenuBtn"]', ':text("Connect")'],
      desktop: [':text("Connect")'],
    },
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          findIconAndName(wallet) {
            const modal = getConnectWalletModalByTitle('div[role="dialog"]', 'Connect Wallet');
            return (
              modal &&
              findIconAndNameByIcon(
                'img[src*="metamask"][alt="MetaMask"]',
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
    urls: ['oraidex.io'],
    skip: { mobile: true },
    walletsForProvider: {
      [IInjectedProviderNames.cosmos]: [
        {
          ...basicWalletInfo['keplr'],
          container: () => getConnectWalletModalByTitle('div[role="dialog"]', 'Connect to OraiDEX'),
        },
      ],
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: () => getConnectWalletModalByTitle('div[role="dialog"]', 'Connect to OraiDEX'),
        },
      ],
    },
  },
  {
    urls: ['sft.network'],
    testUrls: ['sft.network/#/stake'],
    skip: { mobile: true },
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: () =>
            getConnectWalletModalByTitle('div[role="dialog"]', 'Connect wallet to continue'),
          afterUpdate(textNode) {
            textNode.parentElement && makeTextAlignCenter(textNode.parentElement);
          },
        },
      ],
      [IInjectedProviderNames.solana]: [
        {
          ...basicWalletInfo['phantom'],
          container: () =>
            getConnectWalletModalByTitle('div[role="dialog"]', 'Connect wallet to continue'),
          afterUpdate(textNode, ) {
            textNode.parentElement && makeTextAlignCenter(textNode.parentElement);
          },
        },
      ],
    },
  },
  {
    urls: ['stake.anvm.io'],

    testPath: {
      desktop: [':text("Connect Wallet")', ':nth-match(button.rounded-full:text("Connect"),2)'],
      'mobile': [
        'header.g-container > button',
        ':text("Connect Wallet")',
        ':nth-match(button.rounded-full:text("Connect"),2)',
      ],
    },
    walletsForProvider: {
      [IInjectedProviderNames.btc]: [
        {
          ...basicWalletInfo['unisat'],
          container: () =>
            getConnectWalletModalByTitle('div[role="dialog"][id*="headlessui"]', 'Choose Wallet'),
        },
      ],
    },
  },
  {
    urls: ['meson.fi'],
    testPath: {
      desktop: [':text("AGREE AND CONTINUE")', ':text("CONNECT WALLET")'],
      mobile: [":text('Connect your wallet')"],
    },

    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          container: () => getConnectWalletModalByTitle('div.fixed', 'CONNECT WALLET'),
        },
      ],
    },
  },
  {
    urls: ['bsquared.boolbridge.com'],
    testPath: ['.homepage button:has-text("Connect Wallet")'],
    walletsForProvider: {
      [IInjectedProviderNames.btc]: [
        {
          ...basicWalletInfo['unisat'],

          container: () => getConnectWalletModalByTitle('div[role="dialog"]', 'Bitcoin Wallets'),
        },
      ],
    },
  },
  {
    urls: ['app.gyro.finance'],
    skip: { mobile: true }, //not supported by mobile
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [metamaskForRainbowKit, walletConnectForRainbowKit],
    },
  },
  {
    urls: ['app.reflexer.finance'],
    skip: { mobile: true }, //no item in wallet list
    constraintMap: { icon: [isWalletIconLessEqualThan], text: [] },
    only: true,
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        { ...basicWalletInfo['metamask'], container: '#connect-METAMASK' },
      ],
    },
  },
  {
    urls: ['stusdt.io'],
    testPath: {
      desktop: [':text("Connect Wallet")'],
      mobile: [
        'div.positive-btn:text("Accept")',
        '.mobile-header .mobile-category-outer',
        ':text("Connect Wallet")',
      ],
    },
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          findIconAndName({ name }) {
            const modal = getConnectWalletModalByTitle('div.ant-modal-content', 'Connect Wallet');
            return (
              modal &&
              findIconAndNameByIcon(
                'img[src*="static/media/metamask"]',
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
    urls: ['app.hydration.net'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          findIconAndName({ name }) {
            const modal = getConnectWalletModalByTitle(
              'div[role="dialog"][data-state="open"]',
              'Connect wallet',
            );
            return (
              modal &&
              findIconAndNameByIcon(
                'img[src*="assets/MetaMask"][alt="MetaMask Logo"]',
                'auto-search-text',
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
          findIconAndName({ name }) {
            const modal = getConnectWalletModalByTitle(
              'div[role="dialog"][data-state="open"]',
              'Connect wallet',
            );
            return (
              modal &&
              findIconAndNameByIcon('img[alt="Polkadotjs Logo"]', 'auto-search-text', name, modal)
            );
          },
        },
      ],
    },
  },
  {
    urls: ['app.slingshot.finance'],
    walletsForProvider: {
      [IInjectedProviderNames.ethereum]: [
        {
          ...basicWalletInfo['metamask'],
          findIconAndName({ name }) {
            const modal = getConnectWalletModalByTitle('#portal-root>div', 'Connect Wallet');
            return (
              modal &&
              findIconAndNameByName(modal, name, (text) => {
                return text?.parentElement?.parentElement?.parentElement?.querySelector(
                  'div svg[height="38"]',
                );
              })
            );
          },
          afterUpdate(textNode) {
            textNode.parentElement && makeTextAlignLeft(textNode.parentElement);
          },
        },
      ],
    },
  },
];
