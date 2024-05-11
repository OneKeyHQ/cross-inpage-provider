import { hackConnectButton } from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';

export default () => hackConnectButton({
  urls: ['magiceden.io', 'www.magiceden.io'],
  providers: [
    IInjectedProviderNames.ethereum,
    IInjectedProviderNames.solana,
    IInjectedProviderNames.btc,
  ],
  replaceMethod(options) {
    const replaceFunc = ({
      findName,
      findIconText,
      icon,
      text,
    }: {
      findName: string;
      findIconText: string; // Phantom icon
      icon: string;
      text: string;
    }) => {
      const img = document.querySelector(
        `#headlessui-portal-root div > button > div > img[alt="${findIconText}"]`,
      ) as HTMLImageElement | undefined;
      if (img && img.src) {
        img.src = icon;
        const span = (img.nextSibling as HTMLElement)?.querySelector('span');
        if (span && span.innerText === findName) {
          span.innerText = text;
        }
      }
    };

    if (options?.providers?.includes(IInjectedProviderNames.ethereum)) {
      replaceFunc({
        findName: 'MetaMask',
        findIconText: 'MetaMask icon',
        icon: WALLET_CONNECT_INFO.metamask.icon,
        text: WALLET_CONNECT_INFO.metamask.text,
      });
      // The magiceden bug will probably be fixed later
      replaceFunc({
        findName: 'MetaMask',
        findIconText: 'MetaMask  icon',
        icon: WALLET_CONNECT_INFO.metamask.icon,
        text: WALLET_CONNECT_INFO.metamask.text,
      });
      replaceFunc({
        findName: 'WalletConnect',
        findIconText: 'WalletConnect icon',
        icon: WALLET_CONNECT_INFO.walletconnect.icon,
        text: WALLET_CONNECT_INFO.walletconnect.text,
      });
    }

    if (options?.providers?.includes(IInjectedProviderNames.solana)) {
      replaceFunc({
        findName: 'Phantom',
        findIconText: 'Phantom icon',
        icon: WALLET_CONNECT_INFO.phantom.icon,
        text: WALLET_CONNECT_INFO.phantom.text,
      });
    }
    if (options?.providers?.includes(IInjectedProviderNames.btc)) {
      replaceFunc({
        findName: 'Unisat',
        findIconText: 'Unisat icon',
        icon: WALLET_CONNECT_INFO.unisat.icon,
        text: WALLET_CONNECT_INFO.unisat.text,
      });
    }
  },
});
