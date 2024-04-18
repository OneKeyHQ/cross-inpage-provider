import { Logger } from '@onekeyfe/cross-inpage-provider-core';
import { Selector } from './type';

export const universalLog = new Logger('universal');

export function isClickable(ele: HTMLElement) {
  return ele && window.getComputedStyle(ele).cursor === 'pointer';
}

export const getWalletListByBtn = (anyButtonSelector: Selector) => {
  const ele = document.querySelector(anyButtonSelector);
  if (!ele || !ele.parentElement) {
    universalLog.debug(`can not find the wallet button list`);
    return null;
  }
  return ele.parentElement;
};
export const getConnectWalletModalByTitle = (
  modalSelector: Selector,
  title: string,
  filter?: (modal: HTMLElement) => boolean,
) => {
  const eles = Array.from(document.querySelectorAll<HTMLElement>(modalSelector));
  for (const ele of eles) {
    if (isVisible(ele) && filter ? filter(ele) : true && ele.innerText.includes(title)) {
      return ele;
    }
  }
  universalLog.debug('can not find the connect wallet modal');
  return null;
};

export function isInExternalLink(element: HTMLElement, container: HTMLElement) {
  while (element !== container) {
    if (element.tagName === 'A') {
      return true;
    }
    element = element.parentNode as HTMLElement;
  }
  return false;
}
export function isVisible(ele: HTMLElement) {
  const style = window.getComputedStyle(ele);
  return style.visibility !== 'hidden' && style.display !== 'none';
}
