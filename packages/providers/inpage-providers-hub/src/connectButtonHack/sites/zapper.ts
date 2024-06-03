import { hackConnectButton } from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';

export default () => hackConnectButton({
  urls: ['zapper.xyz', 'zapper.fi', 'www.zapper.xyz'],
  providers: [IInjectedProviderNames.ethereum],
  mutationObserverOptions: {
    attributes: true, // shadowRoot changed watch required
    characterData: false,
    childList: true,
    subtree: true,
  },
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
      const buttons: HTMLElement[] = Array.from(
        document.querySelectorAll(
          '.ReactModal__Content--after-open div > button > div:first-child',
        ),
      );
      const btnContent = buttons.reverse().find((item) => item.innerText.includes(findName));
      if (btnContent) {
        while (btnContent.firstChild) {
          btnContent.removeChild(btnContent.firstChild);
        }

        const image = document.createElement('img');
        image.src = icon;
        image.style.width = '32px';
        image.style.height = '32px';
        btnContent.appendChild(image);

        const newText = document.createTextNode(text);
        btnContent.appendChild(newText);
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
