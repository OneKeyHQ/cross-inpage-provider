import {
  createNewImageToContainer,
  createWalletConnectToButton,
  detectQrcodeFromSvg,
  hackConnectButton,
} from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';
import type { IWindowOneKeyHub } from '../../injectWeb3Provider';

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
      if (!headerText) {
        return;
      }
      const qrcodeContainer = headerText?.nextSibling as HTMLElement | undefined;
      if (!qrcodeContainer) {
        return;
      }
      const svg = qrcodeContainer?.querySelector('svg.walletconnect-qrcode__image');
      if (!svg) {
        return;
      }
      if (qrcodeContainer.dataset['isHacked']) {
        return;
      }

      // starting hack
      qrcodeContainer.dataset['isHacked'] = 'true';
      qrcodeContainer.style.position = 'relative';
      qrcodeContainer.style.display = 'flex';
      qrcodeContainer.style.flexDirection = 'column';
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

      const footerContainer = qrcodeContainer.nextElementSibling as HTMLElement | undefined;
      if (!footerContainer) {
        return;
      }
      footerContainer.style.flexDirection = 'column';
      createWalletConnectToButton({
        container: footerContainer,
        onCreated(btn) {
          btn.style.marginTop = '16px';
          btn.style.alignSelf = 'center';
          btn.onclick = async () => {
            const uri = await detectQrcodeFromSvg({ img: svg });
            if (btn.dataset['isClicked']) {
              return;
            }
            btn.dataset['isClicked'] = 'true';
            btn.style.backgroundColor = '#bbb';
            void (window.$onekey as IWindowOneKeyHub | undefined)?.$private?.request({
              method: 'wallet_connectToWalletConnect',
              params: { uri },
            });
          };
        },
      });
    };

    replaceFunc({
      findName: 'Metamask', // Metamask MetaMask
      icon: WALLET_CONNECT_INFO.onekey.icon,
      text: WALLET_CONNECT_INFO.onekey.text,
    });
  },
});
