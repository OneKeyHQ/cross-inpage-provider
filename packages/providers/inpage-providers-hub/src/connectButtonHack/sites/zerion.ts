import { hackConnectButton } from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';

export default () => hackConnectButton({
  urls: ['zerion.io', 'app.zerion.io', 'www.zerion.io'],
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
      const buttons = Array.from(
        document.querySelectorAll('[class^="ConnectWallet__Content"] button'),
      );
      const btn = buttons.find((item) =>
        item.querySelector('div>div[kind]')?.innerHTML.includes(findName),
      );
      if (btn) {
        const span = btn.querySelector('div>div[kind]');
        if (span) {
          span.innerHTML = text;
        }
        const img = btn.querySelector('img') as HTMLImageElement | undefined;
        if (img && img.src) {
          img.src = icon;
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
