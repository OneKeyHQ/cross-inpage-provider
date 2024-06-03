import { createNewImageToContainer, hackConnectButton } from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';

export default () => hackConnectButton({
  urls: ['oasis.app', 'www.oasis.app'],
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
      const spans = Array.from(
        window.document
          ?.querySelector('onboard-v2')
          ?.shadowRoot?.querySelectorAll('.wallets-container .wallet-button-container .name') ?? [],
      );
      const span = spans.find((item) => item.innerHTML === findName);
      if (span) {
        span.innerHTML = text;
        const imgContainer = span.previousElementSibling?.querySelector('div') as
          | HTMLElement
          | undefined;
        if (imgContainer) {
          createNewImageToContainer({
            container: imgContainer,
            icon: icon,
            removeSvg: true,
            onCreated(img) {
              img.style.maxWidth = '22px';
              img.style.maxHeight = '22px';
            },
          });
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
