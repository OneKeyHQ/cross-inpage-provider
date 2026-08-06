import {
  createNewImageToContainer,
  hackConnectButton,
} from '../../../../providers/inpage-providers-hub/src/connectButtonHack/hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../../../../providers/inpage-providers-hub/src/connectButtonHack/consts';
import domUtils from '../../../../providers/inpage-providers-hub/src/connectButtonHack/utils/utilsDomNodes';

export default () =>
  hackConnectButton({
    urls: ['staking.benqi.fi'],
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
          document.querySelectorAll(
            '[class*="ConnectWalletModal__ModalContainer"] button[class*="ConnectWalletModal__ConnectButton"]',
          ),
        ) as (HTMLElement | undefined)[];

        for (const walletBtn of walletBtnList) {
          if (walletBtn?.innerText === findName) {
            const textNode = domUtils.findTextNode(walletBtn, findName) as HTMLElement | undefined;
            textNode?.replaceWith(text);

            const img = walletBtn?.querySelector('img') as HTMLImageElement | undefined;
            if (img) {
              img.src = icon;
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
