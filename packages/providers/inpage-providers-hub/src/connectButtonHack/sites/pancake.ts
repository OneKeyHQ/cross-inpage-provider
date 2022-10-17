import { createNewImageToContainer, hackConnectButton } from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';
import utilsDomNodes from '../utils/utilsDomNodes';

hackConnectButton({
  urls: ['pancakeswap.finance', 'app.pancakeswap.finance', 'www.pancakeswap.finance'],
  providers: [IInjectedProviderNames.ethereum],
  replaceMethod() {
    const replaceFunc = ({
      findName,
      findIcon,
      icon,
      text,
    }: {
      findName: string;
      findIcon?: string;
      icon: string;
      text: string;
    }) => {
      const modalDom = document.querySelector(
        '#portal-root>.appear>[role=presentation]',
      )?.nextElementSibling;
      if (!modalDom) {
        return;
      }
      const images = Array.from(modalDom.querySelectorAll('img') || []);
      const img = images.find((item) => item.getAttribute('src') === findIcon);
      if (!img) {
        return;
      }
      const span = img?.parentElement?.parentElement?.nextElementSibling;
      if (span && img && utilsDomNodes.isInnerContentMatch(span, findName)) {
        span.innerHTML = text;
        img.src = icon;
      }
    };

    replaceFunc({
      findName: 'Metamask', // Metamask MetaMask
      findIcon: '/images/wallets/metamask.png',
      icon: WALLET_CONNECT_INFO.metamask.icon,
      text: WALLET_CONNECT_INFO.metamask.text,
    });
    replaceFunc({
      findName: 'WalletConnect', // Metamask MetaMask
      findIcon: '/images/wallets/walletconnect.png',
      icon: WALLET_CONNECT_INFO.walletconnect.icon,
      text: WALLET_CONNECT_INFO.walletconnect.text,
    });
  },
});
