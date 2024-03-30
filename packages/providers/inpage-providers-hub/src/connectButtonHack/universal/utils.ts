import { ALIGN_THRESHOLD } from './consts';
import { Selector } from './type';

export const isProd = process.env.NODE_ENV === 'production';
export const dbg = (...args: unknown[]) => {
  if (!isProd) {
    console.log('[universal]:', ...args);
  }
};

export function isClickable(ele: HTMLElement) {
  return ele && window.getComputedStyle(ele).cursor === 'pointer';
}

export const getWalletListByBtn = (anyButtonSelector: Selector) => {
  const ele = document.querySelector(anyButtonSelector);
  if (!ele || !ele.parentElement) {
    throw new Error(`[universal]: can not find the wallet button list`);
  }
  return ele.parentElement;
};
export const getConnectWalletModalByTitle = (modalSelector: Selector, title: string) => {
  const eles = Array.from(document.querySelectorAll<HTMLElement>(modalSelector));
  for (const ele of eles) {
    if (ele.innerText.includes(title)) {
      return ele;
    }
  }
  throw new Error(`[universal]: can not find the connect wallet modal`);
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

export function isAlign(ele1: HTMLElement, ele2: HTMLElement) {
  const rect1 = ele1.getBoundingClientRect();
  const rect2 = ele2.getBoundingClientRect();
  const dx = Math.abs(rect1.left - rect2.left);
  const dy = Math.abs(rect1.top - rect2.top);
  return dx < ALIGN_THRESHOLD || dy < ALIGN_THRESHOLD;
}
