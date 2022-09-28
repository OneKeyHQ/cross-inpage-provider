import { hackConnectButton } from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';

hackConnectButton({
  urls: ['rarible.com', 'www.rarible.com'],
  throttleDelay: 600,
  throttleSettings: {
    leading: true,
    trailing: true,
  },
  providers: [IInjectedProviderNames.ethereum, IInjectedProviderNames.solana],
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
        document.querySelectorAll('.ScrollbarsCustom ~ div > div > button > span '),
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

    replaceFunc({
      findName: 'MetaMask',
      icon: WALLET_CONNECT_INFO.metamask.icon,
      text: WALLET_CONNECT_INFO.metamask.text,
    });
    replaceFunc({
      findName: 'Phantom',
      icon: WALLET_CONNECT_INFO.phantom.icon,
      text: WALLET_CONNECT_INFO.phantom.text,
    });
  },
  options: { attributes: false, childList: true, subtree: true },
});
