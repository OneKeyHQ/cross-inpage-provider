import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { WALLET_CONNECT_INFO } from '../consts';
import { hackConnectButton } from '../hackConnectButton';

export default () => hackConnectButton({
  urls: ['app.hope.money'],
  providers: [IInjectedProviderNames.ethereum],
  replaceMethod(options) {
    const replaceFunc = ({ id, icon, text }: { icon: string; text: string; id: string }) => {
      const walletButton = document.getElementById(id);

      const textNode = walletButton?.querySelector(':scope > div:nth-child(2) > div') as
        | HTMLElement
        | undefined;
      if (textNode) {
        textNode.innerText = text;
      }
      const imageNode = walletButton?.querySelector('img') as HTMLImageElement | undefined;
      if (imageNode) {
        imageNode.src = icon;
      }
    };

    if (options?.providers?.includes(IInjectedProviderNames.ethereum)) {
      replaceFunc({
        id: 'connect-METAMASK',
        icon: WALLET_CONNECT_INFO.metamask.icon,
        text: WALLET_CONNECT_INFO.metamask.text,
      });
      replaceFunc({
        id: 'connect-WALLET_CONNECT_V2',
        icon: WALLET_CONNECT_INFO.walletconnect.icon,
        text: WALLET_CONNECT_INFO.walletconnect.text,
      });
    }
  },
});
