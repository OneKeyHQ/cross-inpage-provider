import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';

import { WALLET_CONNECT_INFO } from '../../../../providers/inpage-providers-hub/src/connectButtonHack/consts';
import { hackConnectButton } from '../../../../providers/inpage-providers-hub/src/connectButtonHack/hackConnectButton';
import { createWalletId } from '../../../../providers/inpage-providers-hub/src/connectButtonHack/universal/utils';
import domUtils from '../../../../providers/inpage-providers-hub/src/connectButtonHack/utils/utilsDomNodes';

function isRendered(button: HTMLButtonElement) {
  const style = window.getComputedStyle(button);
  const rect = button.getBoundingClientRect();
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    Number(style.opacity || 1) > 0 &&
    rect.width > 0 &&
    rect.height > 0
  );
}

export default () =>
  hackConnectButton({
    urls: ['velocity.exchange'],
    providers: [IInjectedProviderNames.solana],
    replaceMethod(options) {
      if (!options?.providers?.includes(IInjectedProviderNames.solana)) {
        return;
      }

      const buttons = Array.from(
        document.querySelectorAll<HTMLButtonElement>(
          'button[data-testid="connect-wallet-button-Solflare"]',
        ),
      ).filter(isRendered);
      const button = buttons[buttons.length - 1];
      if (!button) {
        return;
      }

      const { icon, text } = WALLET_CONNECT_INFO.solflare;
      const walletId = createWalletId(IInjectedProviderNames.solana, text);
      if (walletId.isUpdated) {
        return;
      }

      const textNode = domUtils.findTextNode(button, /^solflare$/i) as Text | null;
      const iconNode = button.querySelector<HTMLImageElement>('img');
      if (!textNode || !iconNode || (iconNode.currentSrc || iconNode.src) !== icon) {
        return;
      }

      textNode.nodeValue = text;
      walletId.updateFlag(button);
    },
  });
