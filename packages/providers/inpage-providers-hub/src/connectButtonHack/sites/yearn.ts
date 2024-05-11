import { hackConnectButton } from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';
import utilsDomNodes from '../utils/utilsDomNodes';

export default () => hackConnectButton({
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
      const modalDom = document.querySelector('.yearn--modalLogin');
      if (!modalDom) {
        return;
      }
      const names = Array.from(modalDom.querySelectorAll('.yearn--modalLogin-card>b'));
      const name = names.find((item) => utilsDomNodes.isInnerContentMatch(item, findName));
      if (name) {
        const svg = name.previousElementSibling?.querySelector('svg');
        const svgContainer = svg?.parentElement;
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
