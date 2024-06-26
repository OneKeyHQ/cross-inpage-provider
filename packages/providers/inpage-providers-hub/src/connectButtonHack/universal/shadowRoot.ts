import { ConstraintFn, FindResultType, Selector } from './type';
import { findIconAndNameByName } from './findIconAndName';
import { isClickable, universalLog } from './utils';
import { isWalletIconLessEqualThan, isWalletIconSizeMatch } from './imgUtils';

export function findIconAndNameInShadowRoot(
  hostSelector: Selector,
  containerSelector: Selector,
  walletName: RegExp,
  constraints: { text: ConstraintFn[]; icon: ConstraintFn[] } = {
    text: [isClickable],
    icon: [isWalletIconLessEqualThan, isClickable],
  },
): FindResultType | null {
  const shadowRoots: ShadowRoot[] = Array.from(document.querySelectorAll<HTMLElement>(hostSelector))
    .filter(Boolean)
    .map((e) => e.shadowRoot) as ShadowRoot[];

  if (shadowRoots.length === 0) {
    universalLog.warn('findIconAndNameInShadowRoot,shadowRoots.length=0');
    return null;
  }
  const containerElements = shadowRoots
    .map((e: ShadowRoot) => Array.from(e.querySelectorAll<HTMLElement>(containerSelector)))
    .reduce((a, b) => a.concat(b), [])
    .filter(Boolean);

  const length = containerElements.length;
  if (length === 0 || length > 1) {
    universalLog.warn('findIconAndNameInShadowRoot,length=', length);
    return null;
  }
  return findIconAndNameByName(containerElements[0], walletName, 'auto-search-icon', constraints);
}
