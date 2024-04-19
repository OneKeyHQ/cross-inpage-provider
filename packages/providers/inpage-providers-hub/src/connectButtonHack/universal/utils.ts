import { Logger } from '@onekeyfe/cross-inpage-provider-core';
import { Selector } from './type';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';

export const universalLog = new Logger('universal');

export function isClickable(ele: HTMLElement) {
  return ele && window.getComputedStyle(ele).cursor === 'pointer';
}

export const getWalletListByBtn = (anyButtonSelector: Selector) => {
  const ele = document.querySelector(anyButtonSelector);
  if (!ele || !ele.parentElement) {
    universalLog.warn(`can not find the wallet button list`);
    return null;
  }
  return ele.parentElement;
};
export const getConnectWalletModalByTitle = (
  modalSelector: Selector | Selector[],
  title: string,
  filter?: (modal: HTMLElement) => boolean,
) => {
  const selectors = arrayify(modalSelector);
  const eles: HTMLElement[] = [];
  for (const selector of selectors) {
    eles.push(...Array.from(document.querySelectorAll<HTMLElement>(selector)));
  }
  for (const ele of eles) {
    if (isVisible(ele) && filter ? filter(ele) : true && ele.innerText.includes(title)) {
      return ele;
    }
  }
  universalLog.warn('can not find the connect wallet modal');
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
export function getWalletId(provider: IInjectedProviderNames, updatedName: string) {
  return `${provider}-${updatedName.replace(/[\s&.]/g, '').toLowerCase()}`.replace(
    /onekey/i,
    'onekey-',
  );
}

export function arrayify<T>(ele: T | T[]): T[] {
  return Array.isArray(ele) ? ele : [ele];
}
