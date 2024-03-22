import { createNewImageToContainer, hackConnectButton } from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';
import domUtils from '../utils/utilsDomNodes';

hackConnectButton({
  urls: ['app.mento.org'],
  providers: [IInjectedProviderNames.ethereum],
  replaceMethod(options) {
    const replaceFunc = ({
      selector,
      updatedIcon,
      updatedText,
      walletName,
    }: {
      updatedIcon: string;
      updatedText: string;
      selector: string;
      walletName: string;
    }) => {
      const walletButton = document.querySelector(selector) as HTMLElement | undefined;
      if (!walletButton) {
        return;
      }
      const textNode = domUtils.findTextNode(walletButton, walletName) as HTMLElement | undefined;
      textNode?.replaceWith(updatedText);

      const imgContainer = walletButton?.querySelector('div[role="img"]') as
        | HTMLImageElement
        | undefined;
      if (imgContainer) {
        createNewImageToContainer({
          container: imgContainer,
          icon: updatedIcon,
          removeSvg: true,
          onCreated(img) {
            img.width = 28;
            img.height = 28;
          },
        });
      }
    };

    if (options?.providers?.includes(IInjectedProviderNames.ethereum)) {
      replaceFunc({
        selector: 'button[data-testid="rk-wallet-option-metaMask"]',
        walletName: 'MetaMask',
        updatedIcon: WALLET_CONNECT_INFO.metamask.icon,
        updatedText: WALLET_CONNECT_INFO.metamask.text,
      });
      replaceFunc({
        selector: 'button[data-testid="rk-wallet-option-walletConnect"]',
        walletName: 'WalletConnect',
        updatedIcon: WALLET_CONNECT_INFO.walletconnect.icon,
        updatedText: WALLET_CONNECT_INFO.walletconnect.text,
      });
    }
  },
});
