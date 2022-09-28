import { hackConnectButton } from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';

hackConnectButton({
  urls: ['gem.xyz', 'www.gem.xyz'],
  throttleDelay: 600,
  throttleSettings: {
    leading: true,
    trailing: true,
  },
  providers: [IInjectedProviderNames.ethereum],
  replaceMethod() {
    const replaceFunc = ({
      findName,
      icon,
      text,
    }: {
      findName: string;
      icon: string;
      text: string;
    }) => {
      const modalHeaders = Array.from(document.querySelectorAll('div.font-semibold'));
      const header = modalHeaders.find((item) => item.innerHTML.includes('Choose your wallet'));
      if (!header) {
        return;
      }
      const containers = Array.from(
        header?.parentNode?.parentNode?.querySelectorAll('div > span') ?? [],
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
          const newImg = document.createElement('img');
          newImg.src = icon;
          newImg.className = 'h-8 w-8 mr-4';
          span.parentNode?.prepend(newImg);
        }
      }
    };

    replaceFunc({
      findName: 'MetaMask',
      icon: WALLET_CONNECT_INFO.metamask.icon,
      text: WALLET_CONNECT_INFO.metamask.text,
    });
  },
  options: { attributes: false, childList: true, subtree: true },
});
