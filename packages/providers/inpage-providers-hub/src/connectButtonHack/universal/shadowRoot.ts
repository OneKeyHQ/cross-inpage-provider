import { FindResultType, Selector } from './type';
import { findIconAndNameByParent } from './findIconAndName';

export function findIconAndNameInShadowRoot(
  hostSelector: Selector,
  containerSelector: Selector,
  walletName: RegExp,
): FindResultType | null {
  const shadowRoot = document.querySelector(hostSelector)?.shadowRoot;
  if (!shadowRoot) {
    return null;
  }
  const containerElement = shadowRoot.querySelector(containerSelector) as HTMLElement | undefined;
  if (!containerElement) {
    return null;
  }
  return findIconAndNameByParent(containerElement, walletName);
}
