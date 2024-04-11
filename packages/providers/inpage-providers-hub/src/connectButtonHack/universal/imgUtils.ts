import { ICON_MAX_SIZE, ICON_MIN_SIZE } from './consts';
import { ConstraintFn } from './type';
import { universalLog, isClickable } from './utils';

export function replaceIcon(originalNode: HTMLElement, newIconSrc: string) {
  if (originalNode instanceof HTMLImageElement) {
    originalNode.src = newIconSrc;
    originalNode.removeAttribute('srcset');
    return originalNode;
  } else {
    const imgNode = createImageEle(newIconSrc);
    const style = window.getComputedStyle(originalNode);
    imgNode.style.width = style.width;
    imgNode.style.height = style.height;
    imgNode.classList.add(...Array.from(originalNode.classList));
    originalNode.replaceWith(imgNode);
    return imgNode;
  }
}

export function createImageEle(src: string) {
  const img = new Image();
  img.src = src;
  img.style.maxWidth = '100%';
  img.style.maxHeight = '100%';
  return img;
}

export function findIconNodesByParent(parent: HTMLElement) {
  const walker = document.createTreeWalker(parent, NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      const hasBgImg = window.getComputedStyle(node as HTMLElement).backgroundImage !== 'none';
      return node.nodeName === 'IMG' || hasBgImg || node.nodeName === 'svg'
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_SKIP;
    },
  });
  const matchingNodes: HTMLElement[] = [];
  while (walker.nextNode()) {
    matchingNodes.push(walker.currentNode as HTMLElement);
  }
  return matchingNodes;
}
/**
 * @description:
 * make sure that there is only one icon node match walletIcon to ignore hidden icon and other icon
 */
export function findWalletIconByParent(
  parent: HTMLElement,
  textNode: Text,
  constraints: ConstraintFn[],
) {
  const iconNodes = findIconNodesByParent(parent);
  if (iconNodes.length > 1) {
    universalLog.debug(`===>more than one icon node found`, iconNodes.length, iconNodes);
    return null;
  }
  const icon = iconNodes[0];
  if (!icon || !textNode.parentElement || constraints.some((e) => !e(icon))) {
    universalLog.debug(`===>it is not a wallet icon`, icon);
    return null;
  }
  return icon;
}

export function isWalletIconSizeMatch(walletIcon: HTMLElement) {
  const { width, height } = walletIcon.getBoundingClientRect();
  const isMatch =
    width < ICON_MAX_SIZE &&
    width > ICON_MIN_SIZE &&
    height < ICON_MAX_SIZE &&
    height > ICON_MIN_SIZE;
    universalLog.debug('===>wallet icon size match: ', isMatch);
  return isMatch;
}
