import {
  createNewImageToContainer,
  hackConnectButton,
} from '../../../../providers/inpage-providers-hub/src/connectButtonHack/hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../../../../providers/inpage-providers-hub/src/connectButtonHack/consts';
import domUtils from '../../../../providers/inpage-providers-hub/src/connectButtonHack/utils/utilsDomNodes';

export default () =>
  hackConnectButton({
    urls: ['imtbl.top'],
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
          document.querySelectorAll('body [role="dialog"] button'),
        ) as (HTMLElement | undefined)[];

        for (const walletBtn of walletBtnList) {
          if (walletBtn?.innerText === findName) {
            const textNode = domUtils.findTextNode(walletBtn, findName) as HTMLElement | undefined;
            textNode?.replaceWith(text);

            const imgContainer = walletBtn?.querySelector('svg')?.parentNode as
              | HTMLImageElement
              | undefined;
            if (imgContainer) {
              createNewImageToContainer({
                container: imgContainer,
                icon,
                removeSvg: true,
                onCreated(img) {
                  img.width = 35;
                  img.height = 35;
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
      }
    },
  });
