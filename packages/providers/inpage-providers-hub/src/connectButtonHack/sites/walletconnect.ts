import {
  createNewImageToContainer,
  createWalletConnectToButton,
  detectQrcodeFromSvg,
  hackConnectButton,
} from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';
import type { IWindowOneKeyHub } from '../../injectWeb3Provider';

hackConnectButton({
  urls: ['*'],
  providers: [IInjectedProviderNames.ethereum],
  replaceMethod() {
    const onekeyHub = window.$onekey as IWindowOneKeyHub | undefined;
    if (!onekeyHub || !onekeyHub.$walletInfo || !onekeyHub.$private) {
      return;
    }
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
      const headerText = document.getElementById('walletconnect-qrcode-text');
      if (!headerText) {
        return;
      }
      const qrcodeContainer = headerText?.nextSibling as HTMLElement | undefined;
      if (!qrcodeContainer) {
        return;
      }
      if (
        ['desktop', 'app', 'ios', 'android'].includes(onekeyHub?.$walletInfo?.platform || '') &&
        qrcodeContainer?.classList?.contains?.('walletconnect-search__input')
      ) {
        const inputEle = qrcodeContainer;
        const parent = headerText.parentNode;
        if (!parent) {
          return;
        }
        const iconsContainer = parent.querySelector(
          '.walletconnect-connect__buttons__wrapper__wrap',
        ) as HTMLElement | undefined;
        const firstItem = iconsContainer?.querySelector(
          '.walletconnect-connect__button__icon_anchor',
        ) as HTMLAnchorElement | undefined;
        if (!firstItem || !iconsContainer) {
          return;
        }
        if (firstItem.classList.contains('isOneKeyReplaced')) {
          return;
        }
        const img = firstItem.querySelector('.walletconnect-connect__button__icon') as
          | HTMLElement
          | undefined;
        if (!img) {
          return;
        }
        const span = firstItem.querySelector('.walletconnect-connect__button__text') as
          | HTMLElement
          | undefined;
        if (!span) {
          return;
        }
        const uri = new URL(firstItem?.href).searchParams.get('uri');
        if (uri && uri.startsWith('wc:')) {
          span.innerText = text;
          img.style.backgroundImage = `url(${icon || ''})`;
          img.style.backgroundColor = 'rgb(0, 184, 18)';
          // const item = firstItem.cloneNode(true) as HTMLElement;
          firstItem.classList.add('isOneKeyReplaced');
          firstItem.onclick = (e) => {
            e.preventDefault();
            void onekeyHub?.$private?.request({
              method: 'wallet_connectToWalletConnect',
              params: { uri },
            });
            return false;
          };
          for (const item of Array.from(iconsContainer?.children || [])) {
            const itemEl = item as HTMLElement | undefined;
            if (itemEl && itemEl.style) {
              itemEl.style.display = 'none';
            }
          }
          iconsContainer.style.display = 'flex';
          iconsContainer.style.justifyContent = 'center';
          iconsContainer.style.alignItems = 'center';
          iconsContainer.style.minHeight = '150px';

          firstItem.style.display = 'block';
          inputEle.remove();
          const footerContainer = iconsContainer?.parentNode?.querySelector(
            '.walletconnect-modal__footer',
          ) as HTMLElement | undefined;
          footerContainer?.remove();
        }
      } else {
        const svg = qrcodeContainer?.querySelector('svg.walletconnect-qrcode__image');
        if (!svg) {
          return;
        }
        if (qrcodeContainer.dataset['isOneKeyReplaced']) {
          return;
        }

        // starting hack
        qrcodeContainer.dataset['isOneKeyReplaced'] = 'true';
        qrcodeContainer.style.position = 'relative';
        qrcodeContainer.style.display = 'flex';
        qrcodeContainer.style.flexDirection = 'column';
        qrcodeContainer.style.alignItems = 'center';
        qrcodeContainer.style.justifyContent = 'center';

        createNewImageToContainer({
          container: qrcodeContainer,
          icon,
          removeSvg: false,
          onCreated(img) {
            img.style.maxWidth = '10%';
            img.style.borderRadius = '35%';
            img.style.position = 'absolute';
            img.style.border = '2px solid white';
            img.style.backgroundColor = 'white';
            img.style.outline = 'none';
            // img.style.left = '50%';
            // img.style.top = '50%';
            // img.style.transform = 'translate(-50%, -50%)';
          },
        });

        const footerContainer = qrcodeContainer.nextElementSibling as HTMLElement | undefined;
        if (!footerContainer) {
          return;
        }
        footerContainer.style.flexDirection = 'column';
        // @ts-ignore
        if (typeof window.BarcodeDetector !== 'undefined') {
          createWalletConnectToButton({
            container: footerContainer,
            onCreated(btn) {
              btn.style.marginTop = '16px';
              btn.style.alignSelf = 'center';
              btn.onclick = async () => {
                const uri = await detectQrcodeFromSvg({ img: svg });
                if (btn.dataset['isClicked']) {
                  return;
                }
                btn.dataset['isClicked'] = 'true';
                btn.style.backgroundColor = '#bbb';
                void onekeyHub?.$private?.request({
                  method: 'wallet_connectToWalletConnect',
                  params: { uri },
                });
              };
            },
          });
        }
      }
    };

    replaceFunc({
      findName: 'Metamask', // Metamask MetaMask
      icon: WALLET_CONNECT_INFO.onekey.icon,
      text: WALLET_CONNECT_INFO.onekey.text,
    });
  },
});
