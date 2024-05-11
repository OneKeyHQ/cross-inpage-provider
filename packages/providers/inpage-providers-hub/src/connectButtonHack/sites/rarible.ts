import { hackConnectButton } from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';

export default () => hackConnectButton({
  urls: ['rarible.com', 'www.rarible.com'],
  providers: [IInjectedProviderNames.ethereum, IInjectedProviderNames.solana],
  callbackDelay: 0,
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
      const spans = Array.from(
        document.querySelectorAll(
          '.ScrollbarsCustom ~ div > div > button > span > span > span > span',
        ),
      );
      const span = spans.find((item) => item.innerHTML === findName);
      if (span) {
        span.innerHTML = text;
        const img = span.previousSibling as HTMLImageElement | undefined;
        if (img && img.src) {
          img.src = icon;
        }
      }
    };

    if (options?.providers?.includes(IInjectedProviderNames.ethereum)) {
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
    }

    if (options?.providers?.includes(IInjectedProviderNames.solana)) {
      replaceFunc({
        findName: 'Phantom',
        icon: WALLET_CONNECT_INFO.phantom.icon,
        text: WALLET_CONNECT_INFO.phantom.text,
      });
    }
  },
});
