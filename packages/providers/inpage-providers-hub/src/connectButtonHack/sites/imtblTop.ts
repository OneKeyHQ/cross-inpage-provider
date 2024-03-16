import { createNewImageToContainer, hackConnectButton } from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';

hackConnectButton({
  urls: ['imtbl.top'],
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
      const walletBtnList = Array.from(
        document.querySelectorAll('body [role="dialog"] button'),
      ) as (HTMLElement | undefined)[];

      for (const walletBtn of walletBtnList) {
        if (walletBtn?.innerText === findName) {
          const textNode = findTextNode(walletBtn, findName) as HTMLElement | undefined;
          textNode?.replaceWith(text);

          const imgContainer = walletBtn?.querySelector('svg')?.parentNode as
            | HTMLImageElement
            | undefined;
          if (imgContainer) {
            createNewImageToContainer({
              container: imgContainer,
              icon,
              removeSvg: true,
              onCreated(img) {
                img.width = 35;
                img.height = 35;
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
    }
  },
});

//find the text node in the container,including descendants
function findTextNode(container: HTMLElement, text: string) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return node.nodeValue?.trim() === text ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    },
  });
  return walker.nextNode();
}
