import { createNewImageToContainer, hackConnectButton } from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';

export default () => hackConnectButton({
  urls: ['stake.lido.fi'],
  providers: [IInjectedProviderNames.ethereum],
  replaceMethod(options) {
    const replaceFunc = ({
      findName,
      icon,
      text,
    }: {
      findName: string;
      icon: string;
      text: string;
    }) => {
      const buttons = Array.from(
        document.querySelector('div.idjqeC')?.querySelectorAll('button') ?? [],
      );

      const findButton = buttons.find((button) => {
        const span = button.querySelector('span > span > div') as HTMLElement | undefined;
        if (span && span.innerText === findName) {
          return button;
        }
        return undefined;
      });

      if (findButton) {
        // change button text
        const span = findButton.querySelector('div') as HTMLElement | undefined;
        if (span) {
          span.innerText = text;
        }

        // change icon
        const imgContainer = findButton.querySelector('span > span >span') as
          | HTMLElement
          | undefined;
        if (imgContainer) {
          createNewImageToContainer({
            container: imgContainer,
            icon: icon,
            removeSvg: true,
            onCreated(img) {
              img.style.maxWidth = '48px';
              img.style.maxHeight = '48px';
            },
          });
        }
      }
    };

    if (options?.providers?.includes(IInjectedProviderNames.ethereum)) {
      replaceFunc({
        findName: 'MetaMask',
        icon: WALLET_CONNECT_INFO.metamask.icon,
        text: WALLET_CONNECT_INFO.metamask.text,
      });
      replaceFunc({
        findName: 'WalletConnect',
        icon: WALLET_CONNECT_INFO.walletconnect.icon,
        text: WALLET_CONNECT_INFO.walletconnect.text,
      });
    }
  },
});
