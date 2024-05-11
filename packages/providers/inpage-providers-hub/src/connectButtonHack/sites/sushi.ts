import { createNewImageToContainer, hackConnectButton } from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';

export default () => hackConnectButton({
  urls: ['sushi.com', 'www.sushi.com'],
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
      const buttonList = Array.from(document.querySelectorAll('body header button'));
      const btn = buttonList.find((item) => item.innerHTML.includes(findName));
      if (btn) {
        const childNodes = Array.from(btn.childNodes);
        const span = childNodes.find((item) => item.nodeValue === findName);
        if (span) {
          span.nodeValue = text;
        }
        const imgContainer = btn.querySelector('div');
        if (imgContainer) {
          createNewImageToContainer({
            container: imgContainer,
            icon,
            removeSvg: true,
            onCreated(img) {
              img.style.maxWidth = '16px';
              img.style.maxHeight = '16px';
            },
          });
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
