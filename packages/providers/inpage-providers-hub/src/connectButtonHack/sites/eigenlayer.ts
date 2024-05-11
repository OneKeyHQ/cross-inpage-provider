import { hackConnectButton } from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';

export default () => hackConnectButton({
  urls: ['app.eigenlayer.xyz'],
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
      //replace text
      const connectWalletDialog = 'div[role="dialog"]';
      const nameButton = document.querySelector(
        `${connectWalletDialog} button[aria-label="${findName}"]`,
      ) as HTMLElement | undefined;
      if (nameButton) {
        //replace textNode(idx===0) only,keep other nodes
        nameButton.childNodes[0]?.replaceWith(text);
      }

      //replace image
      const img = document.querySelector(`${connectWalletDialog} img[alt="${findName} logo"]`) as
        | HTMLImageElement
        | undefined;
      if (img) {
        img.src = icon; //img with 32x32 size already exists
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
