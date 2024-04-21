import { Logger } from '@onekeyfe/cross-inpage-provider-core';
import { Selector } from './type';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { find } from 'lodash';

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
  const res: HTMLElement[] = [];
  for (const ele of eles) {
    if (isVisible(ele) && filter ? filter(ele) : true && ele.innerText.includes(title)) {
      res.push(ele);
    }
  }
  if (res.length === 0) {
    universalLog.warn('can not find the connect wallet modal');
    return null;
  }
  if (res.length === 1) {
    return res[0];
  }
  universalLog.warn('find more than one connect wallet modal');
  return res[res.length - 1];
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
export function getWalletIdSelector(walletId: string) {
  return `img[data-wallet-id="${walletId}"]`;
}
export function isWalletUpdate(walletId: string) {
  return !!document.querySelector(getWalletIdSelector(walletId));
}
export function setWalletUpdateId(ele: HTMLElement, walletId: string) {
  ele.dataset.walletId = walletId;
}

export function arrayify<T>(ele: T | T[]): T[] {
  return Array.isArray(ele) ? ele : [ele];
}
