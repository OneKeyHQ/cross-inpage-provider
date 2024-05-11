import { createNewImageToContainer, hackConnectButton } from '../hackConnectButton';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';

export default () => hackConnectButton({
  urls: ['gamma.io','www.gamma.io'],
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
      const buttonList = Array.from(document.querySelectorAll('#headlessui-portal-root button'));
      const btn = buttonList.find((item) => item.innerHTML.includes(findName));
      const span = btn?.querySelector('div > div > div');
      const textNode = Array.from(span?.childNodes || []).find((item) => {
        return item?.nodeValue?.includes(findName);
      });
      if (textNode) {
        textNode.nodeValue = text;
      }
      const imgContainer = btn?.querySelector('div');
      if (imgContainer) {
        createNewImageToContainer({
          container: imgContainer,
          icon: icon,
          removeSvg: true,
          onCreated(img) {
            img.style.maxWidth = '32px';
            img.style.maxHeight = '32px';
          },
        });
      }
    };

    replaceFunc({
      findName: 'Unisat wallet',
      icon: WALLET_CONNECT_INFO.unisat.icon,
      text: WALLET_CONNECT_INFO.unisat.text,
    });
  },
});
