import {
  createWalletConnectToButton,
  detectQrcodeFromSvg,
  hackConnectButton,
} from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';

export default () => hackConnectButton({
  urls: ['indexcoop.com', 'app.indexcoop.com', 'www.indexcoop.com'],
  providers: [IInjectedProviderNames.ethereum],
  replaceMethod() {
    const getDialogDom = () =>
      document.querySelector('[role=dialog]>[role=document]') as HTMLElement | undefined;
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
      const dialog = getDialogDom();
      if (!dialog) {
        return;
      }
      let isDesktop = true;
      let spans = Array.from(
        // desktop app selector
        dialog.querySelectorAll('button > div > div > [role=img] ~ div > div'),
      );
      if (!spans.length) {
        isDesktop = false;
        // mobile app selector
        spans = Array.from(dialog.querySelectorAll('button > div > div > h2 > span'));
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
            imgContainer.style.backgroundColor = 'transparent';
          }
        }
      }
    };
    const replaceWalletConnectQrcode = async () => {
      const dialog = getDialogDom();
      if (!dialog) {
        return;
      }
      const qrcodeSvg = dialog.querySelector('div > div ~ svg[style]') as
        | HTMLOrSVGImageElement
        | undefined;
      if (qrcodeSvg) {
        if (qrcodeSvg.classList.contains('isOneKeyReplaced')) {
          return;
        }
        // should add white bg color for qrcode scan
        qrcodeSvg.style.backgroundColor = 'white';
        qrcodeSvg.classList.add('isOneKeyReplaced');
        const uri = await detectQrcodeFromSvg({ img: qrcodeSvg });
        if (process.env.NODE_ENV !== 'production') {
          console.log('indexcoop replaceWalletConnectQrcode >>>>', { uri });
        }
        const container = qrcodeSvg.parentElement;
        if (uri && container) {
          createWalletConnectToButton({
            container,
            uri,
            onCreated(btn) {
              btn.style.padding = '6px 12px';
              btn.style.width = '155px';
              btn.style.display = 'block';
              btn.style.margin = 'auto';
            },
          });
        }
      }
    };
    void replaceFunc({
      findName: 'MetaMask',
      icon: WALLET_CONNECT_INFO.metamask.icon,
      text: WALLET_CONNECT_INFO.metamask.text,
    });
    void replaceFunc({
      findName: 'WalletConnect',
      icon: WALLET_CONNECT_INFO.walletconnect.icon,
      text: WALLET_CONNECT_INFO.walletconnect.text,
    });

    // TODO indexcoop WalletConnect Qrcode is WRONG
    void replaceWalletConnectQrcode();
  },
});
