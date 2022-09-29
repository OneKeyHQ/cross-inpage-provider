import { createNewImageToContainer, hackConnectButton } from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';

hackConnectButton({
  urls: ['*'],
  providers: [IInjectedProviderNames.ethereum],
  replaceMethod() {
    const replaceFunc = ({
      findName,
      icon,
      text,
    }: {
      findName: string;
      findIcon?: string;
      icon: string;
      text: string;
    }) => {
      const headerText = document.getElementById('walletconnect-qrcode-text');
      const qrcodeContainer = headerText?.nextSibling as HTMLElement | undefined;
      const svg = qrcodeContainer?.querySelector('svg.walletconnect-qrcode__image');
      if (svg && qrcodeContainer) {
        qrcodeContainer.style.position = 'relative';
        qrcodeContainer.style.display = 'flex';
        qrcodeContainer.style.alignItems = 'center';
        qrcodeContainer.style.justifyContent = 'center';
        createNewImageToContainer({
          container: qrcodeContainer,
          icon,
          removeSvg: false,
          onCreated(img) {
            img.style.maxWidth = '10%';
            img.style.borderRadius = '35%';
            img.style.position = 'absolute';
            img.style.border = '2px solid white';
            img.style.backgroundColor = 'white';
            img.style.outline = 'none';
            // img.style.left = '50%';
            // img.style.top = '50%';
            // img.style.transform = 'translate(-50%, -50%)';
          },
        });
      }
    };

    replaceFunc({
      findName: 'Metamask', // Metamask MetaMask
      icon: WALLET_CONNECT_INFO.onekey.icon,
      text: WALLET_CONNECT_INFO.onekey.text,
    });
  },
});
