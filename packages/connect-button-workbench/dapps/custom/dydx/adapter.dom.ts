import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';

import { WALLET_CONNECT_INFO } from '../../../../providers/inpage-providers-hub/src/connectButtonHack/consts';
import { createWalletId } from '../../../../providers/inpage-providers-hub/src/connectButtonHack/universal/utils';

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

export function replaceDydxMetaMaskWallet() {
  const { icon, text } = WALLET_CONNECT_INFO.metamask;
  const walletId = createWalletId(IInjectedProviderNames.ethereum, text);
  const originalCandidates = Array.from(
    document.querySelectorAll<HTMLImageElement>('button > img[src="/wallets/metamask.svg"]'),
  ).flatMap((image) => {
    const button = image.closest<HTMLButtonElement>('button');
    return button ? [button] : [];
  });
  const updatedCandidates = Array.from(
    document.querySelectorAll<HTMLButtonElement>(`button${walletId.walletIdSelector}`),
  );
  const candidates = [...originalCandidates, ...updatedCandidates];
  const renderedCandidates = candidates.filter(isRendered);
  const button =
    renderedCandidates[renderedCandidates.length - 1] ??
    (candidates.length === 1 ? candidates[0] : undefined);
  if (!button || button.dataset.walletId === walletId.walletId) {
    return button ?? null;
  }

  const image = button.querySelector<HTMLImageElement>('img[src="/wallets/metamask.svg"]');
  const textNode = Array.from(button.childNodes).find(
    (node): node is Text =>
      node.nodeType === Node.TEXT_NODE && /^metamask$/iu.test(node.textContent?.trim() ?? ''),
  );
  if (!image || !textNode) {
    return null;
  }

  image.src = icon;
  textNode.nodeValue = text;
  walletId.updateFlag(button);
  return button;
}
