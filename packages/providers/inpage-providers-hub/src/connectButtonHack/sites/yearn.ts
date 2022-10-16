import { hackConnectButton } from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';
import utilsDomNodes from '../utils/utilsDomNodes';

hackConnectButton({
  urls: ['yearn.finance', 'www.yearn.finance', 'app.yearn.finance'],
  providers: [IInjectedProviderNames.ethereum],
  replaceMethod() {
    const replaceFunc = ({
      findName,
      findIcon,
      icon,
      text,
    }: {
      findName: string;
      findIcon?: string;
      icon: string;
      text: string;
    }) => {
      const modalDom = document.querySelector('aside.bn-onboard-modal');
      if (!modalDom) {
        return;
      }
      const img = modalDom.querySelector(`li>button>div>img[alt="${findIcon || ''}"]`) as
        | HTMLImageElement
        | undefined;
      const svg = modalDom.querySelector('li>button>div>svg') as HTMLOrSVGImageElement | undefined;
      if (img && img.src && utilsDomNodes.isNotReplaced(img)) {
        img.src = icon;
        img.srcset = icon;
        utilsDomNodes.setIsReplaced(img);
        const span = (img?.parentNode as HTMLElement | undefined)?.nextElementSibling as
          | HTMLElement
          | undefined;
        if (span && utilsDomNodes.isInnerContentMatch(span, findName)) {
          span.childNodes[0].nodeValue = text;
          utilsDomNodes.setIsReplaced(span);
        }
      }
      // WalletConnect is svg
      if (svg) {
        const svgContainer = svg.parentElement;
        const span = svgContainer?.nextElementSibling;
        if (utilsDomNodes.isReplaced(svgContainer)) {
          return;
        }
        if (svgContainer && span && utilsDomNodes.isInnerContentMatch(span, findName)) {
          span.childNodes[0].nodeValue = text;
          utilsDomNodes.setIsReplaced(span);

          // DO NOT remove svg, otherwise cause dapp dom error:
          //    Uncaught (in promise) Error: Missing or invalid topic field
          //    Uncaught (in promise) TypeError: Cannot read properties of null (reading 'removeChild')
          svg.style.display = 'none';
          svgContainer.append(
            utilsDomNodes.createElementFromHTML(`
              <img src="${icon}" srcset="${icon}" alt="OneKeyReplaced" class="svelte-1799bj2">
          `),
          );
          utilsDomNodes.setIsReplaced(svgContainer);
        }
      }
    };

    replaceFunc({
      findName: 'MetaMask',
      findIcon: 'MetaMask',
      icon: WALLET_CONNECT_INFO.metamask.icon,
      text: WALLET_CONNECT_INFO.metamask.text,
    });

    replaceFunc({
      findName: 'WalletConnect',
      findIcon: 'WalletConnect',
      icon: WALLET_CONNECT_INFO.walletconnect.icon,
      text: WALLET_CONNECT_INFO.walletconnect.text,
    });
  },
});
