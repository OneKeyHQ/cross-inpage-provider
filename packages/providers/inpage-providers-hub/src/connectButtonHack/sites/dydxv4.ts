import { createNewImageToContainer, hackConnectButton } from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';

export default () => hackConnectButton({
  urls: ['dydx.trade'],
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
      const buttons = Array.from(
        document.querySelectorAll('div[role="dialog"] div > div > button'),
      );
      const btn = buttons.find((item) => {
        return item.querySelector('div')?.innerText.includes(findName);
      });

      const datasetKey = 'onekey_auto_created_icon_img';
      if (btn && !btn.querySelector(`[data-${datasetKey}]`)) {
        createNewImageToContainer({
          container: btn as HTMLElement,
          icon,
          removeSvg: true,
          onCreated(img) {
            img.style.width = '20px';
            img.style.height = '20px';
          },
        });
        const textNode = btn.querySelector('div');
        if (textNode) {
          textNode.innerText = text;
        }
      }
    };

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
  },
});
