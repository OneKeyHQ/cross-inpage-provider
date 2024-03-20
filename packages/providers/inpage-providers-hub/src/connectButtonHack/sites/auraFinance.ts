import { createNewImageToContainer, hackConnectButton } from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';
import domUtils from '../utils/utilsDomNodes';

hackConnectButton({
  urls: ['app.aura.finance'],
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
        document.querySelectorAll(`[role="dialog"] [role="document"] button`),
      ) as (HTMLElement | undefined)[];

      for (const walletBtn of walletBtnList) {
        if (walletBtn?.innerText === findName) {
          const textNode = domUtils.findTextNode(walletBtn, findName) as HTMLElement | undefined;
          textNode?.replaceWith(text);

          const imgContainer = walletBtn?.querySelector('[role="img"]') as
            | HTMLImageElement
            | undefined;
          if (imgContainer) {
            createNewImageToContainer({
              container: imgContainer,
              icon,
              removeSvg: true,
              onCreated(img) {
                img.width = 28;
                img.height = 28;
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
