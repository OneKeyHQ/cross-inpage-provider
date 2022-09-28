import { hackConnectButton } from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';

hackConnectButton({
  urls: ['sushi.com', 'www.sushi.com'],
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
      const buttonList = Array.from(document.querySelectorAll('div[role=menu] div[role=menuitem]'));
      const btn = buttonList.find((item) => item.innerHTML.includes(findName));
      if (btn) {
        const childNodes = Array.from(btn.childNodes);
        const span = childNodes.find((item) => item.nodeValue === findName);
        if (span) {
          span.nodeValue = text;
        }
        const imgContainer = btn.querySelector('div');
        if (imgContainer) {
          const svg = imgContainer.querySelector('svg');
          if (svg) {
            svg.remove();
          }
          const newImg = document.createElement('img');
          newImg.style.maxWidth = '16px';
          newImg.style.maxHeight = '16px';
          newImg.src = icon;
          imgContainer.prepend(newImg);
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
