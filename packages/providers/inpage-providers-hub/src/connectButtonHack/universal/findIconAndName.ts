import { MAX_LEVELS } from './consts';
import { findWalletIconByParent } from './imgUtils';
import { findWalletText } from './textUtils';
import { FindResultType, Selector } from './type';
import { universalLog, getConnectWalletModalByTitle, isClickable, isInExternalLink } from './utils';
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
  const textNode = findWalletText(containerElement, walletName);
  if (!textNode || !textNode.parentElement) {
    universalLog.debug(`===>no wallet name ${walletName.toString()} text node found`);
    return;
  }
  if (
    !isClickable(textNode.parentElement) ||
    isInExternalLink(textNode.parentElement, containerElement)
  ) {
    universalLog.debug(`===>${walletName.toString()} is not clickable or is in external link`);
    return null;
  }

  let parent: HTMLElement | null = textNode.parentElement;
  let iconNode: HTMLImageElement | HTMLElement | undefined = undefined;

  let level = 0;
  while (parent && parent !== containerElement?.parentElement && level++ < MAX_LEVELS) {
    const walletIcon = findWalletIconByParent(parent, textNode);
    if (!walletIcon) {
      parent = parent.parentElement;
      continue;
    }
    iconNode = walletIcon;
    break;
  }
  if (!iconNode) {
    universalLog.debug(`===>no wallet ${walletName.toString()} icon node found`);
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
      universalLog.error(
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
    universalLog.debug('one is missing', iconElement, textNode);
    return null;
  }
  return {
    iconNode: iconElement,
    textNode,
  };
}
