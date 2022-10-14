import { createNewImageToContainer, hackConnectButton } from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';

hackConnectButton({
  urls: ['pancakeswap.finance', 'app.pancakeswap.finance', 'www.pancakeswap.finance'],
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
      const btn = document.getElementById('wallet-connect-metamask');
      if (!btn) {
        return;
      }
      const svg = btn.querySelector('svg');
      if (!svg) {
        return;
      }
      const span = btn.querySelector('div');
      if (span && span.innerText.includes(findName)) {
        span.innerText = text;
        createNewImageToContainer({
          container: btn,
          removeSvg: true,
          icon,
          width: '40px',
          height: '40px',
          onCreated(img) {
            img.style.marginBottom = '8px';
          },
        });
      }
    };

    replaceFunc({
      findName: 'Metamask', // Metamask MetaMask
      icon: WALLET_CONNECT_INFO.metamask.icon,
      text: WALLET_CONNECT_INFO.metamask.text,
    });
    replaceFunc({
      findName: 'WalletConnect', // Metamask MetaMask
      icon: WALLET_CONNECT_INFO.walletconnect.icon,
      text: WALLET_CONNECT_INFO.walletconnect.text,
    });
  },
});
