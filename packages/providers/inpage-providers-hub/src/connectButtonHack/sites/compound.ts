import { hackConnectButton } from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';

hackConnectButton({
  urls: ['compound.finance', 'app.compound.finance'],
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
      const img = document.querySelector(`.connect-choices .connect-item ${findIcon || ''}`) as
        | HTMLImageElement
        | undefined;
      if (img) {
        img.style.backgroundImage = `url(${icon})`;
        const span = img.nextSibling as HTMLElement | undefined;
        if (span && span.innerText === findName) {
          span.innerText = text;
        }
      }
    };

    replaceFunc({
      findName: 'Metamask',
      findIcon: '.connect-wallet-icon--metamask',
      icon: WALLET_CONNECT_INFO.metamask.icon,
      text: WALLET_CONNECT_INFO.metamask.text,
    });
  },
});
