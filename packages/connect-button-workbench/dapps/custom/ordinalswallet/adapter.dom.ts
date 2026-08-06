import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';

import { WALLET_CONNECT_INFO } from '../../../../providers/inpage-providers-hub/src/connectButtonHack/consts';
import { createWalletId } from '../../../../providers/inpage-providers-hub/src/connectButtonHack/universal/utils';
import domUtils from '../../../../providers/inpage-providers-hub/src/connectButtonHack/utils/utilsDomNodes';

const UNISAT_OPTION_SELECTOR =
  '[role="option"][data-value="Unisat"], [cmdk-item][data-value="Unisat"]';

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

export function replaceOrdinalsWalletUnisat() {
  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>(UNISAT_OPTION_SELECTOR),
  ).filter(isRendered);
  const option = candidates[candidates.length - 1];
  if (!option) return null;

  const { icon, text } = WALLET_CONNECT_INFO.unisat;
  const walletId = createWalletId(IInjectedProviderNames.btc, text);
  if (option.matches(walletId.walletIdSelector)) return option;

  const textNode = domUtils.findTextNode(option, /^unisat$/i) as Text | null;
  const iconNode = option.querySelector<HTMLImageElement>('img');
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
