import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';

import { WALLET_CONNECT_INFO } from '../../../../providers/inpage-providers-hub/src/connectButtonHack/consts';
import { hackConnectButton } from '../../../../providers/inpage-providers-hub/src/connectButtonHack/hackConnectButton';
import { replaceIcon } from '../../../../providers/inpage-providers-hub/src/connectButtonHack/universal/imgUtils';
import { createWalletId } from '../../../../providers/inpage-providers-hub/src/connectButtonHack/universal/utils';
import domUtils from '../../../../providers/inpage-providers-hub/src/connectButtonHack/utils/utilsDomNodes';

function isRendered(button: HTMLButtonElement) {
  const style = window.getComputedStyle(button);
  const rect = button.getBoundingClientRect();
  return (
    style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0
  );
}

export default () =>
  hackConnectButton({
    urls: ['app.elk.finance'],
    providers: [IInjectedProviderNames.ethereum],
    replaceMethod(options) {
      if (!options?.providers?.includes(IInjectedProviderNames.ethereum)) {
        return;
      }

      const buttons = Array.from(
        document.querySelectorAll<HTMLButtonElement>('button#metamask'),
      ).filter(isRendered);
      const button = buttons[buttons.length - 1];
      if (!button) {
        return;
      }

      const { icon, text } = WALLET_CONNECT_INFO.metamask;
      const walletId = createWalletId(IInjectedProviderNames.ethereum, text);
      if (walletId.isUpdated) {
        return;
      }

      const textNode = domUtils.findTextNode(button, /^meta\s*mask$/i) as Text | null;
      const iconNode = button.querySelector<HTMLElement>('svg, img');
      if (!textNode || !iconNode) {
        return;
      }

      textNode.nodeValue = text;
      replaceIcon(iconNode, icon);
      walletId.updateFlag(button);
    },
  });
