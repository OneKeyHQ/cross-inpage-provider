import { hackConnectButton } from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';

hackConnectButton({
  urls: ['yearn.finance', 'www.yearn.finance', 'app.yearn.finance'],
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
      const img = document.querySelector(`li>button>div>img[alt="${findIcon || ''}"]`) as
        | HTMLImageElement
        | undefined;
      if (img && img.src) {
        img.src = icon;
        img.srcset = icon;
        const span = (img?.parentNode as HTMLElement | undefined)?.nextElementSibling as
          | HTMLElement
          | undefined;
        if (span && span.innerText === findName) {
          span.innerHTML = text;
        }
      }
    };

    replaceFunc({
      findName: 'MetaMask',
      findIcon: 'MetaMask',
      icon: WALLET_CONNECT_INFO.metamask.icon,
      text: WALLET_CONNECT_INFO.metamask.text,
    });
  },
});
