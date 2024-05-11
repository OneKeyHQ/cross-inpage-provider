import { createNewImageToContainer, hackConnectButton } from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';

export default () => hackConnectButton({
  urls: ['gem.xyz', 'www.gem.xyz', 'pro.opensea.io'],
  providers: [IInjectedProviderNames.ethereum],
  replaceMethod() {
    const replaceFunc = ({
      findName,
      icon,
      text,
    }: {
      findName: string;
      findIcon?: string;
      icon: string;
      text: string;
    }) => {
      const header = document.querySelector('#rk_connect_title');
      if (!header) {
        return;
      }
      const containers = Array.from(
        (header?.parentNode?.parentNode?.nextSibling as HTMLElement)?.querySelectorAll(
          'div > button > div > div > div + div',
        ) ?? [],
      );
      const span = containers.find((item) => item.innerHTML.includes(findName));
      if (span) {
        span.innerHTML = text;
        const prevImg = span.previousSibling as HTMLImageElement | undefined;
        // maybe <img />
        if (prevImg && prevImg.src) {
          prevImg.src = icon;
        } else {
          // maybe <svg />
          prevImg?.remove();

          const imgContainer = span.parentNode as HTMLElement | undefined;
          if (imgContainer) {
            createNewImageToContainer({
              container: imgContainer,
              icon,
              removeSvg: true,
              onCreated(img) {
                img.className = 'h-8 w-8 mr-4';
              },
            });
          }
        }
      }
    };

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
  },
});
