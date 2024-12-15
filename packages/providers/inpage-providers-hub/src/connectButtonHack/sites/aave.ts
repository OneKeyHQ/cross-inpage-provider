import { hackConnectButton } from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';
import { last } from 'lodash-es';

export default () => hackConnectButton({
  urls: ['aave.com', 'app.aave.com', 'www.aave.com'],
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
      const img = last(
        Array.from(
          document.querySelectorAll(`.MuiModal-root button>span>img[src="${findIcon || ''}"]`),
        ),
      ) as HTMLImageElement | null;
      if (img && img.src) {
        img.src = icon;
        const span = img?.parentNode?.previousSibling;
        if (span) {
          span.nodeValue = text;
        }
      }
    };

    replaceFunc({
      findName: 'Browser wallet',
      findIcon: '/icons/wallets/browserWallet.svg',
      icon: WALLET_CONNECT_INFO.metamask.icon,
      text: WALLET_CONNECT_INFO.metamask.text,
    });
    replaceFunc({
      findName: 'WalletConnect',
      findIcon: '/icons/wallets/walletConnect.svg',
      icon: WALLET_CONNECT_INFO.walletconnect.icon,
      text: WALLET_CONNECT_INFO.walletconnect.text,
    });
  },
});
