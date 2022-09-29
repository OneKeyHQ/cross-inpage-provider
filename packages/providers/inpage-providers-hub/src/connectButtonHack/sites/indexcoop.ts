import { hackConnectButton } from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';

hackConnectButton({
  urls: ['indexcoop.com', 'app.indexcoop.com', 'www.indexcoop.com'],
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
      let isDesktop = true;
      let spans = Array.from(
        // desktop app selector
        document.querySelectorAll('button > div > div > [role=img] ~ div > div'),
      );
      if (!spans.length) {
        isDesktop = false;
        // mobile app selector
        spans = Array.from(document.querySelectorAll('button > div > div > h2 > span'));
      }
      const span = spans.find((item) => item.innerHTML === findName);
      if (span) {
        span.innerHTML = text;
        let imgContainer;
        if (isDesktop) {
          imgContainer = span?.parentNode?.parentNode as HTMLElement | undefined;
          imgContainer = imgContainer?.querySelector('[role=img]') as HTMLElement | undefined;
        } else {
          imgContainer = span?.parentNode?.parentNode?.previousSibling as HTMLElement | undefined;
          imgContainer = imgContainer?.querySelector('[role=img]') as HTMLElement | undefined;
        }

        if (imgContainer) {
          const img = imgContainer.children?.[0] as HTMLElement | undefined;
          if (img && img.style.transition) {
            img.style.backgroundImage = `url(${icon})`;
          }
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
