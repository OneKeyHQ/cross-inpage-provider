import { hackConnectButton } from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';

export default () => hackConnectButton({
  urls: ['sating.io', 'www.sating.io'],
  providers: [IInjectedProviderNames.btc],
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
      const buttonList = Array.from(
        document.querySelectorAll('.modal-dialog .modal-body button.btn'),
      );
      const btn = buttonList.find((item) => item.innerHTML.includes(findName));
      const textNode = Array.from(btn?.childNodes || []).find((item) => {
        return item?.nodeValue?.includes(findName);
      });
      if (textNode) {
        textNode.nodeValue = text;
      }
      const img = btn?.querySelector('img');
      if (img && img.src) {
        img.src = icon;
      }
    };

    replaceFunc({
      findName: 'Unisat',
      icon: WALLET_CONNECT_INFO.unisat.icon,
      text: WALLET_CONNECT_INFO.unisat.text,
    });
  },
});
