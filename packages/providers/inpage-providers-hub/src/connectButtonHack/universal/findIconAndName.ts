import { MAX_LEVELS, MAX_SEARCH_LEVELS_By_IMG } from './consts';
import { findWalletIconByParent, isWalletIconLessEqualThan } from './imgUtils';
import { findWalletTextByParent } from './textUtils';
import { ConstraintFn, FindResultType, Selector } from './type';
import { arrayify, isClickable, isInExternalLink, universalLog } from './utils';
/**
 *
 * @description:
 *   don't document to querySelector because it maybe not work in shadowRoot,
 *   instead of it, use the containerElement
 */
export function findIconAndNameByName(
  containerElement: HTMLElement,
  walletName: RegExp,
  icon:
    | 'none'
    | 'auto-search-icon'
    | ((text: Text) => HTMLElement | null | undefined) = 'auto-search-icon',
  constraints: { text: ConstraintFn[]; icon: ConstraintFn[] } = {
    text: [isClickable],
    icon: [isWalletIconLessEqualThan, isClickable],
  },
): FindResultType | null {
  const textNode = findWalletTextByParent(containerElement, walletName, constraints.text);
  if (!textNode || !textNode.parentElement) {
    universalLog.debug(`no wallet name ${walletName.toString()} text node found`);
    return null;
  }
  if (isInExternalLink(textNode.parentElement, containerElement)) {
    universalLog.debug(`${walletName.toString()} is in external link`);
    return null;
  }

  let iconNode: HTMLImageElement | HTMLElement | undefined | null = undefined;
  if (typeof icon === 'function') {
    iconNode = icon(textNode);
  } else if (icon === 'auto-search-icon') {
    let parent: HTMLElement | null = textNode.parentElement;
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
  } else if (typeof icon === 'string' && icon !== 'none') {
    universalLog.warn('icon paramter should be a function or auto-search-icon');
    return null;
  }

  if (!iconNode && typeof icon === 'string' && icon !== 'none') {
    universalLog.debug(`no wallet ${walletName.toString()} icon node found`);
    return null;
  }
  // make sure the icon and text are both existed
  return { iconNode: iconNode ?? null, textNode };
}

export function findIconAndNameByIcon(
  iconSelector: Selector | (() => HTMLElement | null | undefined),
  textSelector: 'auto-search-text' | ((icon: HTMLElement) => HTMLElement | null | undefined),
  name: RegExp,
  container: HTMLElement | Document = document,
  constraints: { text: ConstraintFn[]; icon: ConstraintFn[] } = { text: [], icon: [] },
  searchLevel = MAX_SEARCH_LEVELS_By_IMG,
): FindResultType | null {
  const iconElements =
    typeof iconSelector === 'string'
      ? container.querySelectorAll<HTMLElement>(iconSelector)
      : arrayify(iconSelector());

  if (iconElements.length > 1) {
    universalLog.warn('more one wallet icon found ,please check the selector');
    return null;
  }

  const iconElement = Array.from(iconElements)[0];

  //find the text node by img
  let textNode: Text | null = null;
  if (textSelector === 'auto-search-text') {
    const containerEle = container instanceof HTMLElement ? container : document.body;
    textNode = iconElement
      ? findTextByImg(iconElement, name, containerEle, constraints.text, searchLevel)
      : null;
  } else if (typeof textSelector === 'function') {
    const containerEle = iconElement && textSelector(iconElement);
    textNode =
      iconElement && containerEle
        ? findWalletTextByParent(containerEle, name, constraints.text)
        : null;
  } else {
    universalLog.warn('textSelector is wrong');
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
  maxLevel = MAX_SEARCH_LEVELS_By_IMG,
) {
  let text: null | Text = null;
  let parent: HTMLElement | null = img;
  let level = 0;

  while (parent && parent != containerLimit.parentElement && level++ < maxLevel) {
    text = findWalletTextByParent(parent, walletName, constraints);
    if (text) {
      return text;
    }
    parent = parent.parentElement;
  }
  universalLog.warn('can not find the text node by img ', level);
  return null;
}
