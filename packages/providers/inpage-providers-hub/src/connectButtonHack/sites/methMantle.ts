import { createNewImageToContainer, hackConnectButton } from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';
import domUtils from '../utils/utilsDomNodes';

export default () => hackConnectButton({
  urls: ['meth.mantle.xyz'],
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
      const walletBtnList = Array.from(document.querySelectorAll(`body > .w-full button `)) as (
        | HTMLElement
        | undefined
      )[];
      for (const walletBtn of walletBtnList) {
        if (walletBtn?.innerText === findName) {
          // replace text
          const textNode = domUtils.findTextNode(walletBtn, findName) as HTMLElement | undefined;
          const newTextNode = document.createTextNode(text);
          textNode?.replaceWith(newTextNode);
          newTextNode?.parentElement && (newTextNode.parentElement.style.whiteSpace = 'normal');
          //image
          const imgContainer = walletBtn?.querySelector('svg')?.parentNode as
            | HTMLImageElement
            | undefined;
          if (imgContainer) {
            createNewImageToContainer({
              container: imgContainer,
              icon,
              removeSvg: true,
              onCreated(img) {
                img.width = 36;
                img.height = 36;
              },
            });
          }
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
