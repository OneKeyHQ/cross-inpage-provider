import { MAX_LEVELS, MAX_SEARCH_LEVELS_By_IMG } from './consts';
import { findWalletIconByParent, isWalletIconSizeMatch } from './imgUtils';
import { findWalletTextByParent } from './textUtils';
import { ConstraintFn, FindResultType, Selector } from './type';
import { arrayify, isClickable, isInExternalLink, universalLog } from './utils';
/**
 *
 * @description:
 *   don't document to querySelector because it maybe not work in shadowRoot,
 *   instead of it, use the containerElement
 */
export function findIconAndNameByParent(
  containerElement: HTMLElement,
  walletName: RegExp,
  constraints: { text: ConstraintFn[]; icon: ConstraintFn[] } = {
    text: [isClickable],
    icon: [isWalletIconSizeMatch, isClickable],
  },
): FindResultType | null {
  const textNode = findWalletTextByParent(containerElement, walletName, constraints.text);
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
    const walletIcon = findWalletIconByParent(parent, constraints.icon);
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
  textSelector:
    | 'auto-search-text'
    | ((icon: HTMLElement) => HTMLElement | null | undefined)
    | (Selector & Record<never, never>),
  name: RegExp,
  container: HTMLElement | Document = document,
  constraints: { text: ConstraintFn[]; icon: ConstraintFn[] } = { text: [], icon: [] },
  searchLevel = MAX_SEARCH_LEVELS_By_IMG
): FindResultType | null {
  const iconElements =
    typeof iconSelector === 'string'
      ? container.querySelectorAll<HTMLElement>(iconSelector)
      : arrayify(iconSelector());

  universalLog.log('iconElements', iconElements);
  if (iconElements.length > 1) {
    universalLog.error('more one wallet icon found ,please check the selector');
    return null;
  }

  const iconElement = Array.from(iconElements)[0];
  let textNode: Text | null = null;
  if (textSelector === 'auto-search-text') {
    const containerEle = container instanceof HTMLElement ? container : document.body;
    textNode = iconElement
      ? findTextByImg(iconElement, name, containerEle, constraints.text, searchLevel)
      : null;
  } else if (typeof textSelector === 'string') {
    const textContainer = Array.from(container.querySelectorAll<HTMLElement>(textSelector))?.filter(
      Boolean,
    );
    if (textContainer?.length > 1) {
      universalLog.error('more one wallet text found ,please check the selector');
      return null;
    }
    textNode = findWalletTextByParent(textContainer[0], name, constraints.text);
  } else if (typeof textSelector === 'function') {
    const containerEle = iconElement && textSelector(iconElement);
    textNode =
      iconElement && containerEle
        ? findWalletTextByParent(containerEle, name, constraints.text)
        : null;
  } else {
    universalLog.error('textSelector is wrong');
    return null;
  }

  if (!iconElement || !textNode) {
    universalLog.warn('one is missing', 'icon=', iconElement, 'text=', textNode);
    return null;
  }

  return {
    iconNode: iconElement,
    textNode,
  };
}

export function findTextByImg(
  img: HTMLElement,
  walletName: RegExp,
  containerLimit: HTMLElement,
  constraints: ConstraintFn[],
  maxLevel = MAX_SEARCH_LEVELS_By_IMG
) {
  let text: null | Text = null;
  let parent: HTMLElement | null = img;
  let level = 0;

  while (parent && parent != containerLimit && level++ < maxLevel) {
    text = findWalletTextByParent(parent, walletName, constraints);
    if (text) {
      return text;
    }
    parent = parent.parentElement;
  }
  universalLog.error('can not find the text node by img', level);
  return null;
}
