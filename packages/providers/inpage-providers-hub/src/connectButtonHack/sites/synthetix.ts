import { createNewImageToContainer, hackConnectButton } from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';

export default () => hackConnectButton({
  urls: ['synthetix.io', 'staking.synthetix.io', 'app.synthetix.io', 'www.synthetix.io'],
  providers: [IInjectedProviderNames.ethereum],
  replaceMethod() {
    const replaceFunc = ({
      findName,
      icon,
      text,
    }: {
      findName: string;
      icon: string;
      text: string;
    }) => {
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
    replaceFunc({
      findName: 'WalletConnect',
      icon: WALLET_CONNECT_INFO.walletconnect.icon,
      text: WALLET_CONNECT_INFO.walletconnect.text,
    });
  },
});
