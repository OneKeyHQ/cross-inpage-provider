import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../../../../providers/inpage-providers-hub/src/connectButtonHack/consts';
import { hackConnectButton } from '../../../../providers/inpage-providers-hub/src/connectButtonHack/hackConnectButton';
import domUtils from '../../../../providers/inpage-providers-hub/src/connectButtonHack/utils/utilsDomNodes';

export default () =>
  hackConnectButton({
    urls: ['app.boringdao.com'],
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
            `.MuiModal-root .MuiDialog-container .MuiPaper-root > div:nth-child(2) > div`,
          ),
        ) as (HTMLElement | undefined)[];

        for (const walletBtn of walletBtnList) {
          if (walletBtn?.innerText.trim() === findName) {
            const textNode = domUtils.findTextNode(walletBtn, findName) as HTMLElement | undefined;
            textNode?.replaceWith(text);

            const img = walletBtn?.querySelector(`img[alt="${findName}"][width="40"]`) as
              | HTMLImageElement
              | undefined;
            if (img) {
              img.src = icon; //keep the original size and style
            }
          }
        }
      };

      if (options?.providers?.includes(IInjectedProviderNames.ethereum)) {
        replaceFunc({
          findName: 'Metamask',
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
