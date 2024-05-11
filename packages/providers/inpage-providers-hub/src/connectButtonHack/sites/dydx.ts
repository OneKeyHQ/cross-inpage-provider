import { hackConnectButton } from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';

export default () => hackConnectButton({
  urls: ['dydx.exchange', 'trade.dydx.exchange', 'www.dydx.exchange'],
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
      const img = document.querySelector(`button img[src="${findIcon || ''}"]`) as
        | HTMLImageElement
        | undefined;
      if (img && img.src) {
        img.src = icon;
        const span = img.nextSibling;
        if (span && span.nodeValue === findName) {
          span.nodeValue = text;
        }
      }
    };

    replaceFunc({
      findName: 'MetaMask',
      findIcon: '/wallets/metamask.svg',
      icon: WALLET_CONNECT_INFO.metamask.icon,
      text: WALLET_CONNECT_INFO.metamask.text,
    });
    replaceFunc({
      findName: 'WalletConnect',
      findIcon: '/wallets/walletconnect.svg',
      icon: WALLET_CONNECT_INFO.walletconnect.icon,
      text: WALLET_CONNECT_INFO.walletconnect.text,
    });
  },
});
