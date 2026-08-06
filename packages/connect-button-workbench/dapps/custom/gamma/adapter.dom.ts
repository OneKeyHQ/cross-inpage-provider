import { WALLET_CONNECT_INFO } from '../../../../providers/inpage-providers-hub/src/connectButtonHack/consts';
import domUtils from '../../../../providers/inpage-providers-hub/src/connectButtonHack/utils/utilsDomNodes';

const GAMMA_UNISAT_WALLET_ID = 'btc-onekey-unisat';
const GAMMA_UNISAT_WALLET_SELECTOR = `[data-wallet-id="${GAMMA_UNISAT_WALLET_ID}"]`;

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

export function replaceGammaUnisatWallet() {
  const { icon, text } = WALLET_CONNECT_INFO.unisat;
  const candidates = Array.from(
    document.querySelectorAll<HTMLImageElement>('img[alt="unisat-logo"]'),
  )
    .map((iconNode) => ({
      button: iconNode.closest<HTMLButtonElement>('button'),
      iconNode,
    }))
    .filter(
      (
        candidate,
      ): candidate is {
        button: HTMLButtonElement;
        iconNode: HTMLImageElement;
      } => Boolean(candidate.button && isRendered(candidate.button)),
    );
  const candidate = candidates[candidates.length - 1];
  if (!candidate) {
    return null;
  }

  const { button, iconNode } = candidate;
  if (button.matches(GAMMA_UNISAT_WALLET_SELECTOR)) {
    return button;
  }

  const textNode = domUtils.findTextNode(button, /^unisat$/i) as Text | null;
  if (!textNode) {
    return null;
  }

  document.querySelectorAll<HTMLElement>(GAMMA_UNISAT_WALLET_SELECTOR).forEach((element) => {
    delete element.dataset.walletId;
  });
  textNode.nodeValue = text;
  iconNode.src = icon;
  iconNode.removeAttribute('srcset');
  iconNode.style.width = '32px';
  iconNode.style.height = '32px';
  iconNode.parentElement?.style.setProperty('background-color', 'transparent');
  button.dataset.walletId = GAMMA_UNISAT_WALLET_ID;
  return button;
}
