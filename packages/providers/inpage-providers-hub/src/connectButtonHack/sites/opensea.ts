import { hackConnectButton } from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';

hackConnectButton({
  urls: ['opensea.io', 'www.opensea.io'],
  providers: [IInjectedProviderNames.ethereum, IInjectedProviderNames.solana],
  throttleDelay: 200,
  throttleSettings: {
    leading: false,
    trailing: true,
  },
  mutationObserverOptions: { attributes: false, childList: true, subtree: true },
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
      const listDom = window.document.querySelector('.ConnectCompatibleWallet--wallet-list')
        ?.childNodes as HTMLElement[] | undefined;
      if (!listDom || !listDom.length) {
        return;
      }
      const li = Array.from(listDom).find((item) => item.innerText.includes(findName));
      if (!li) {
        return;
      }
      const img = li?.querySelector?.('button > div > img') as HTMLImageElement | undefined;
      if (img && img.src) {
        img.src = icon;
      }

      const spans = li.querySelectorAll('button > div > span');
      if (!spans || !spans.length) {
        return;
      }
      const span = Array.from(spans).find((item) =>
        (item as HTMLElement | undefined)?.innerText?.includes(findName),
      ) as HTMLElement | undefined;
      if (span) {
        span.innerText = text;
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
});
