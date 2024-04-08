import { FindResultType, Selector } from './type';
import { findIconAndNameByParent } from './findIconAndName';

export function findIconAndNameInShadowRoot(
  hostSelector: Selector,
  containerSelector: Selector,
  walletName: RegExp,
): FindResultType | undefined {
  const shadowRoot = document.querySelector(hostSelector)?.shadowRoot;
  if (!shadowRoot) {
    return;
  }
  const containerElement = shadowRoot.querySelector(containerSelector) as HTMLElement | undefined;
  if (!containerElement) {
    return;
  }
  return findIconAndNameByParent(containerElement, walletName);
}
