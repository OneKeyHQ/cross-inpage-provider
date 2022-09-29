import { hackConnectButton } from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';

hackConnectButton({
  urls: ['uniswap.org', 'app.uniswap.org', 'www.uniswap.org'],
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
      const buttonList = Array.from(
        document.querySelectorAll(
          'div[data-testid=wallet-modal] div[data-testid=option-grid] button',
        ),
      );
      const btn = buttonList.find((item) => item.innerHTML.includes(findName));
      const span = btn?.querySelector('div > div');
      const img = btn?.querySelector('img');
      if (span) {
        span.innerHTML = text;
      }
      if (img && img.src) {
        img.src = icon;
      }
    };

    replaceFunc({
      findName: 'MetaMask',
      icon: WALLET_CONNECT_INFO.metamask.icon,
      text: WALLET_CONNECT_INFO.metamask.text,
    });
  },
});
