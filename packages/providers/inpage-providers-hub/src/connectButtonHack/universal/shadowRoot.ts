import { FindResultType, Selector } from './type';
import { findIconAndNameByParent } from './findIconAndName';
import { universalLog } from './utils';

export function findIconAndNameInShadowRoot(
  hostSelector: Selector,
  containerSelector: Selector,
  walletName: RegExp,
): FindResultType | null {
  const shadowRoots: ShadowRoot[] = Array.from(document.querySelectorAll<HTMLElement>(hostSelector))
    .filter(Boolean)
    .map((e) => e.shadowRoot) as ShadowRoot[]

  if (shadowRoots.length === 0) {
    universalLog.error('findIconAndNameInShadowRoot,shadowRoots.length=0')
    return null;
  }
  const containerElements = shadowRoots
    .map((e: ShadowRoot) => Array.from(e.querySelectorAll<HTMLElement>(containerSelector)))
    .reduce((a, b) => a.concat(b), [])
    .filter(Boolean);

  const length = containerElements.length;
  if (length === 0 || length > 1) {
    universalLog.error('findIconAndNameInShadowRoot,length=', length)
    return null;
  }
  return findIconAndNameByParent(containerElements[0], walletName);
}
