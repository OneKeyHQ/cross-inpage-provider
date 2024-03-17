import { createNewImageToContainer, hackConnectButton } from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';

hackConnectButton({
  urls: ['app.renzoprotocol.com'],
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
        document.querySelectorAll(`body > .fixed .flex-col > button`),
      ) as (HTMLElement | undefined)[];

      for (const walletBtn of walletBtnList) {
        if (walletBtn?.innerText === findName) {
          const textNode = findTextNode(walletBtn, findName) as HTMLElement | undefined;
          textNode?.replaceWith(text);

          const img = walletBtn?.querySelector('img') as HTMLImageElement | undefined;
          if (img) {
            img.src = icon; //keep the original size and style
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

//find the text node in the container,including descendants
function findTextNode(container: HTMLElement, text: string) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return node.nodeValue?.trim() === text ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    },
  });
  return walker.nextNode();
}
