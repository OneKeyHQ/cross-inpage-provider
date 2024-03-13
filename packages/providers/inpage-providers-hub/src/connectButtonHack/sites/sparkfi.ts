import { createNewImageToContainer, hackConnectButton } from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';

hackConnectButton({
  urls: ['app.spark.fi'],
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
      const connectWalletDialog = '.MuiModal-root .MuiPaper-root';
      const walletBtn = document.querySelector(`${connectWalletDialog} button`) as
        | HTMLElement
        | undefined;
      console.log('walletBtn', walletBtn);
      if (walletBtn && walletBtn.innerText === findName) {
        //replace textNode(idx===0) only,keep other nodes
        walletBtn.childNodes[0]?.replaceWith(text);

        //replace image
        const img = walletBtn.querySelector(`${connectWalletDialog} span img]`) as
          | HTMLImageElement
          | undefined;
        if (img) {
          img.src = icon; //img with 24x24 size already exists
        }
      }
    };

    if (options?.providers?.includes(IInjectedProviderNames.ethereum)) {
      replaceFunc({
        findName: 'Browser wallet',
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
