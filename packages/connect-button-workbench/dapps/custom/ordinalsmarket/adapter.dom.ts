import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';

import { WALLET_CONNECT_INFO } from '../../../../providers/inpage-providers-hub/src/connectButtonHack/consts';
import { createWalletId } from '../../../../providers/inpage-providers-hub/src/connectButtonHack/universal/utils';
import domUtils from '../../../../providers/inpage-providers-hub/src/connectButtonHack/utils/utilsDomNodes';

const OPEN_WALLET_OPTION_SELECTOR =
  '[role="dialog"][data-state="open"][data-slot="dialog-content"] li';

function isRendered(option: HTMLElement) {
  const style = window.getComputedStyle(option);
  const rect = option.getBoundingClientRect();
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    Number(style.opacity || 1) > 0 &&
    rect.width > 0 &&
    rect.height > 0
  );
}

export function replaceSatflowUnisat() {
  const { icon, text } = WALLET_CONNECT_INFO.unisat;
  const walletId = createWalletId(IInjectedProviderNames.btc, text);
  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>(OPEN_WALLET_OPTION_SELECTOR),
  ).filter((option) => {
    if (!isRendered(option)) return false;
    if (option.matches(walletId.walletIdSelector)) return true;
    return /^unisat$/i.test(option.querySelector('b')?.textContent?.trim() || '');
  });
  const option = candidates[candidates.length - 1];
  if (!option) return null;
  if (option.matches(walletId.walletIdSelector)) return option;

  const textNode = domUtils.findTextNode(option, /^unisat$/i) as Text | null;
  const iconNode = option.querySelector<HTMLImageElement>('img[alt="UniSat logo"]');
  if (!textNode || !iconNode) return null;

  document
    .querySelectorAll<HTMLElement>(walletId.walletIdSelector)
    .forEach((element) => delete element.dataset.walletId);
  textNode.nodeValue = text;
  iconNode.src = icon;
  iconNode.removeAttribute('srcset');
  walletId.updateFlag(option);
  return option;
}
