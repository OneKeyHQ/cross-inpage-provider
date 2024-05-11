import {
  createNewImageToContainer,
  createWalletConnectToButton,
  detectQrcodeFromSvg,
  hackConnectButton,
} from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';
import type { IWindowOneKeyHub } from '../../injectWeb3Provider';
import { commonLogger } from '@onekeyfe/cross-inpage-provider-core';

const onekeyBtnBg = 'rgb(0, 184, 18)';
function setOnClickToConnectWallet({ element, uri }: { element: HTMLElement; uri: string }) {
  element.onclick = (e) => {
    e.preventDefault();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    void window.$onekey?.$private?.request({
      method: 'wallet_connectToWalletConnect',
      params: { uri },
    });
    return false;
  };
}

export default () => hackConnectButton({
  urls: ['*'],
  providers: [IInjectedProviderNames.ethereum],
  replaceMethod() {
    // $onekey.$walletInfo.platformEnv.isExtension
    const onekeyHub = window.$onekey as IWindowOneKeyHub | undefined;
    if (!onekeyHub || !onekeyHub.$walletInfo || !onekeyHub.$private) {
      return;
    }
    const { isExtension, isDesktop, isNative } = onekeyHub.$walletInfo.platformEnv;
    const replaceFunc = async ({
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
      const headerNextSibling = headerText?.nextSibling as HTMLElement | undefined;
      if (!headerNextSibling) {
        return;
      }

      // **** android single connect button replacement
      const isAndroidSingleConnectButton = headerNextSibling?.classList?.contains?.(
        'walletconnect-connect__buttons__wrapper__android',
      );
      if (isAndroidSingleConnectButton) {
        const btn = headerNextSibling.querySelector('.walletconnect-connect__button') as
          | HTMLAnchorElement
          | undefined;
        if (!btn) {
          return;
        }
        if (btn.dataset['isOneKeyReplaced']) {
          return;
        }
        btn.dataset['isOneKeyReplaced'] = 'true';
        btn.innerText = `${btn.innerText} ${text}`;
        btn.style.backgroundColor = onekeyBtnBg;
        setOnClickToConnectWallet({
          element: btn,
          uri: btn.href,
        });
      }

      // **** deeplink buttons replacement
      const isSearchInput = headerNextSibling?.classList?.contains?.('walletconnect-search__input');
      const isConnectButtonsContainer = headerNextSibling?.classList?.contains?.(
        'walletconnect-connect__buttons__wrapper__wrap',
      );
      if (isSearchInput || isConnectButtonsContainer) {
        const shouldHideOtherWallets = isDesktop || isNative;
        const inputEle = isSearchInput ? headerNextSibling : undefined;
        const parent = headerText.parentNode;
        if (!parent) {
          return;
        }
        const iconsContainer = parent.querySelector(
          '.walletconnect-connect__buttons__wrapper__wrap',
        ) as HTMLElement | undefined;
        let firstItem = iconsContainer?.querySelector(
          '.walletconnect-connect__button__icon_anchor',
        ) as HTMLAnchorElement | undefined;
        if (!firstItem?.getAttribute('href')) {
          try {
            firstItem = iconsContainer?.querySelector(
              '.walletconnect-connect__button__icon_anchor[href]:not([href=""])',
            ) as HTMLAnchorElement | undefined;
          } catch (error) {
            // noop
            commonLogger.error(error);
          }
        }
        if (!firstItem || !iconsContainer) {
          return;
        }
        const newItemAdded = parent.querySelector(
          '.isOneKeyReplaced.walletconnect-connect__button__icon_anchor',
        ) as HTMLElement | undefined;
        if (newItemAdded) {
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
        if (!firstItem?.getAttribute('href')) {
          return;
        }
        const uri = new URL(firstItem?.href).searchParams.get('uri');
        if (uri && uri.startsWith('wc:')) {
          const newItem = firstItem.cloneNode(true) as HTMLAnchorElement;
          const newItemImg = newItem.querySelector('.walletconnect-connect__button__icon') as
            | HTMLElement
            | undefined;
          const newItemSpan = newItem.querySelector('.walletconnect-connect__button__text') as
            | HTMLElement
            | undefined;
          if (newItemSpan) {
            newItemSpan.innerText = text;
          }
          if (newItemImg) {
            newItemImg.style.backgroundImage = `url(${icon || ''})`;
            newItemImg.style.backgroundColor = onekeyBtnBg;
          }
          newItem.classList.add('isOneKeyReplaced');
          // TODO use universal link
          newItem.href = `onekey-wallet:///wc?uri=${encodeURIComponent(uri)}`;
          if (shouldHideOtherWallets) {
            setOnClickToConnectWallet({
              element: newItem,
              uri,
            });
          }

          // hide all other wallets
          if (shouldHideOtherWallets) {
            for (const item of Array.from(iconsContainer?.children || [])) {
              const itemEl = item as HTMLElement | undefined;
              if (itemEl && itemEl.style) {
                itemEl.style.display = 'none';
              }
            }
            iconsContainer.style.display = 'flex';
            iconsContainer.style.justifyContent = 'center';
            iconsContainer.style.alignItems = 'center';
          }
          iconsContainer.style.minHeight = '150px';
          iconsContainer.style.minWidth = isNative ? '0px' : '310px';
          iconsContainer.prepend(newItem);

          // remove input and footer pagination
          if (shouldHideOtherWallets) {
            inputEle?.remove();
            const footerContainer = iconsContainer?.parentNode?.querySelector(
              '.walletconnect-modal__footer',
            ) as HTMLElement | undefined;
            footerContainer?.remove();
          }
        }
      }

      // **** qrcode replacement
      const svgQrcode = headerNextSibling?.querySelector('svg.walletconnect-qrcode__image');
      if (svgQrcode) {
        const qrcodeContainer = headerNextSibling;
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

        const footerContainer = headerNextSibling.nextElementSibling as HTMLElement | undefined;
        if (!footerContainer) {
          return;
        }
        footerContainer.style.flexDirection = 'column';
        // @ts-ignore
        const uri = await detectQrcodeFromSvg({ img: svgQrcode });
        if (!uri || !uri.startsWith('wc:')) {
          return;
        }
        createWalletConnectToButton({
          container: footerContainer,
          uri,
          onCreated(btn) {
            btn.style.marginTop = '16px';
            btn.style.alignSelf = 'center';
          },
        });
      }
    };

    void replaceFunc({
      findName: 'WalletConnect',
      icon: WALLET_CONNECT_INFO.onekey.icon,
      text: WALLET_CONNECT_INFO.onekey.text,
    });
  },
});
