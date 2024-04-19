import { MAX_LEVELS } from './consts';
import { findWalletIconByParent, isWalletIconSizeMatch } from './imgUtils';
import { findWalletText } from './textUtils';
import { FindResultType, Selector } from './type';
import { universalLog, isClickable, isInExternalLink } from './utils';
/**
 *
 * @description:
 *   don't document to querySelector because it maybe not work in shadowRoot,
 *   instead of it, use the containerElement
 */
export function findIconAndNameByParent(
  containerElement: HTMLElement,
  walletName: RegExp,
): FindResultType | null {
  const textNode = findWalletText(containerElement, walletName, [isClickable]);
  if (!textNode || !textNode.parentElement) {
    universalLog.log(`===>no wallet name ${walletName.toString()} text node found`);
    return null;
  }
  if (isInExternalLink(textNode.parentElement, containerElement)) {
    universalLog.log(`===>${walletName.toString()} is in external link`);
    return null;
  }

  let parent: HTMLElement | null = textNode.parentElement;
  let iconNode: HTMLImageElement | HTMLElement | undefined = undefined;

  let level = 0;
  while (parent && parent !== containerElement?.parentElement && level++ < MAX_LEVELS) {
    const walletIcon = findWalletIconByParent(parent, [isWalletIconSizeMatch, isClickable]);
    if (!walletIcon) {
      parent = parent.parentElement;
      continue;
    }
    iconNode = walletIcon;
    break;
  }
  if (!iconNode) {
    universalLog.log(`===>no wallet ${walletName.toString()} icon node found`);
    return null;
  }
  // make sure the icon and text are both existed
  return { iconNode, textNode };
}

export function findIconAndNameDirectly(
  iconSelector: Selector | (() => HTMLElement | null | undefined),
  textSelector: Selector | ((icon: HTMLElement) => HTMLElement | null | undefined),
  name: RegExp,
  container: HTMLElement | Document = document,
): FindResultType | null {
  const iconElement =
    typeof iconSelector === 'string'
      ? container.querySelector<HTMLElement>(iconSelector)
      : iconSelector();

  if (process.env.NODE_ENV !== 'production') {
    if (typeof iconSelector === 'string' && container.querySelectorAll(iconSelector).length > 1) {
      universalLog.warn(
        '[universal]: attention there are more one wallet icon ,please check the selector',
      );
    }
  }

  const textElement =
    typeof textSelector === 'string'
      ? container.querySelector<HTMLElement>(textSelector)
      : iconElement && textSelector(iconElement);
  const textNode = textElement && findWalletText(textElement, name, []);
  if (!iconElement || !textNode) {
    universalLog.warn('one is missing', iconElement, textNode);
    return null;
  }
  return {
    iconNode: iconElement,
    textNode,
  };
}
