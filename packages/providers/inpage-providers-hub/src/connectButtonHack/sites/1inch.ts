import { hackConnectButton } from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';

hackConnectButton({
  urls: ['1inch.io', 'app.1inch.io'],
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
      const btn = document.querySelector(
        `app-wallet-item button.wallet-connect-item[data-id=${findName}]`,
      );
      if (btn) {
        const img = btn.querySelector('img.wallet-connect-img') as HTMLImageElement | undefined;
        if (img && img.src) {
          img.src = icon;
          img.style.borderRadius = '0';
        }
        const span = btn.querySelector('.wallet-connect-item-down > p');
        if (span) {
          span.innerHTML = text;
        }
      }
    };

    replaceFunc({
      findName: 'Metamask',
      icon: WALLET_CONNECT_INFO.metamask.icon,
      text: WALLET_CONNECT_INFO.metamask.text,
    });
  },
});
