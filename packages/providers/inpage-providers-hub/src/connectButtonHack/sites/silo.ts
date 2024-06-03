import { createNewImageToContainer, hackConnectButton } from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';
import domUtils from '../utils/utilsDomNodes';

export default () => hackConnectButton({
  urls: ['app.silo.finance'],
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
      const img = walletButton?.querySelector('img') as HTMLImageElement | undefined;
      if (img) {
        img.src = updatedIcon;
        img.removeAttribute('srcset');
      }
    };

    if (options?.providers?.includes(IInjectedProviderNames.ethereum)) {
      replaceFunc({
        selector: 'button[data-cy="select-wallet-MetaMask"]',
        walletName: 'MetaMask',
        updatedIcon: WALLET_CONNECT_INFO.metamask.icon,
        updatedText: WALLET_CONNECT_INFO.metamask.text,
      });
      replaceFunc({
        selector: 'button[data-cy="select-wallet-WalletConnect"]',
        walletName: 'WalletConnect',
        updatedIcon: WALLET_CONNECT_INFO.walletconnect.icon,
        updatedText: WALLET_CONNECT_INFO.walletconnect.text,
      });
    }
  },
});
