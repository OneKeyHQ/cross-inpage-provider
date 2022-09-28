import { createNewImageToContainer, hackConnectButton } from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';

hackConnectButton({
  urls: ['zapper.fi', 'app.zapper.fi', 'www.zapper.fi'],
  providers: [IInjectedProviderNames.ethereum],
  mutationObserverOptions: {
    attributes: true,
    characterData: false,
    childList: true,
    subtree: true,
  },
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
      // TODO shadowRoot watch
      //    https://stackoverflow.com/questions/46995421/shadow-dom-know-when-dom-is-rendered-changed
      const shadowRoot = document.querySelector('onboard-v2')?.shadowRoot;
      if (shadowRoot) {
        const buttons = Array.from(shadowRoot.querySelectorAll('.wallets-container button'));
        const btn = buttons.find((item) => item.innerHTML.includes(findName));
        if (btn) {
          const replaceImg = () => {
            const imgContainer = btn.querySelector('div.icon') as HTMLElement | undefined;
            if (imgContainer) {
              createNewImageToContainer({
                container: imgContainer,
                icon,
                removeSvg: true,
              });
            }
          };

          const span = btn.querySelector('span.name');
          if (span && span.innerHTML === findName) {
            span.innerHTML = text;
            // shadowRoot update image, need some delay to replace image
            setTimeout(replaceImg, 1000);
          }
          replaceImg();
        }
      }
    };

    replaceFunc({
      findName: 'MetaMask',
      icon: WALLET_CONNECT_INFO.metamask.icon,
      text: WALLET_CONNECT_INFO.metamask.text,
    });
  },
});
