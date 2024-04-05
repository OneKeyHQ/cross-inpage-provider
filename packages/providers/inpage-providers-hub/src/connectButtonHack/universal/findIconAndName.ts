import { findWalletIconByParent, isWalletIcon } from './imgUtils';
import { findWalletText } from './textUtils';
import { FindResultType, Selector } from './type';
import { dbg, isClickable, isInExternalLink, isProd } from './utils';

/**
 *
 * @description:
 *   don't document to querySelector because it maybe not work in shadowRoot,
 *   instead of it, use the containerElement
 */
export function findIconAndNameByParent(
  containerElement: HTMLElement,
  walletName: RegExp,
): FindResultType | undefined {
  const textNode = findWalletText(containerElement, walletName);
  if (!textNode || !textNode.parentElement) {
    dbg(`===>not find wallet name text node`);
    return;
  }
  if (
    !isClickable(textNode.parentElement) ||
    isInExternalLink(textNode.parentElement, containerElement)
  ) {
    dbg(`===>it is not clickable or is in external link`);
    return;
  }
  dbg(`===>find wallet name text node`);

  let parent: HTMLElement | null = textNode.parentElement;
  let iconNode: HTMLImageElement | HTMLElement | undefined = undefined;

  while (parent && parent !== containerElement?.parentElement) {
    const walletIcon = findWalletIconByParent(parent, textNode);
    if (!walletIcon) {
      parent = parent.parentElement;
      continue;
    }
    iconNode = walletIcon;
    break;
  }
  if (!iconNode) {
    return;
  }
  // make sure the icon and text are both existed
  return { iconNode, textNode };
}

export function findIconAndNameDirectly(
  iconSelector: Selector | (() => HTMLElement | null | undefined),
  textSelector: Selector | ((icon: HTMLElement) => HTMLElement | null | undefined),
  name: RegExp,
  container = document,
): FindResultType | undefined {
  const iconElement =
    typeof iconSelector === 'string'
      ? container.querySelector<HTMLElement>(iconSelector)
      : iconSelector();

  if (!isProd) {
    if (typeof iconSelector === 'string' && container.querySelectorAll(iconSelector).length > 1) {
      console.error(
        '[universal]: attention there are more one wallet icon ,please check the selector',
      );
    }
  }
  
  const textElement =
    typeof textSelector === 'string'
      ? container.querySelector<HTMLElement>(textSelector)
      : iconElement && textSelector(iconElement);
  const textNode = textElement && findWalletText(textElement, name);
  if (!iconElement || !textNode) {
    dbg('one is missing', iconElement, textNode);
    return undefined;
  }
  return {
    iconNode: iconElement,
    textNode,
  };
}
