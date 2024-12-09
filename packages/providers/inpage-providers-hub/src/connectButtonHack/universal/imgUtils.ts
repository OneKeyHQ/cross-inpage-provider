import { ICON_MAX_SIZE, ICON_MIN_SIZE } from './consts';
import { ConstraintFn } from './type';
import { universalLog } from './utils';
/**
 *  @note: lazy loading image  with  width and height 0
 */
export function replaceIcon(originalNode: HTMLElement, newIconSrc: string) {
  const computedstyle = window.getComputedStyle(originalNode);
  universalLog.log('ok: replace icon', originalNode);
  const width = parseFloat(computedstyle.width) ? computedstyle.width : 'auto';
  const height = parseFloat(computedstyle.height) ? computedstyle.height : 'auto';
  if (originalNode instanceof HTMLImageElement) {
    originalNode.src = newIconSrc;
    originalNode.removeAttribute('srcset');
    return originalNode;
  } else {
    const imgNode = createImageEle(newIconSrc);
    imgNode.style.width = width;
    imgNode.style.height = height;
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
export function findWalletIconByParent(parent: HTMLElement, constraints: ConstraintFn[]) {
  const iconNodes = findIconNodesByParent(parent);
  if (iconNodes.length === 0) {
    universalLog.warn(`no icon node found for parent`, parent);
    return null;
  }

  const filteredIconNodes = iconNodes.filter((icon) => constraints.every((f) => f(icon)));

  if (filteredIconNodes.length === 0) {
    throw new Error('it doesnt satisfy the constraints');
  }

  if (filteredIconNodes.length > 1) {
    universalLog.warn(`more than one icon node found`, iconNodes.length, iconNodes);
    throw new Error('more than one icon node found');
  }
  return filteredIconNodes[0];
}
//NOTE:  use function isWalletIconLessEqualThan with lazy loading image
export function isWalletIconSizeMatch(
  walletIcon: HTMLElement,
  min = ICON_MIN_SIZE,
  max = ICON_MAX_SIZE,
) {
  const { width, height } = walletIcon.getBoundingClientRect();
  const isMatch = width <= max && width >= min && height <= max && height >= min;
  !isMatch && universalLog.log('wallet icon size doesnot match: ', width, height);
  return isMatch;
}
export function isWalletIconLessEqualThan(walletIcon: HTMLElement) {
  return isWalletIconSizeMatch(walletIcon, 0, ICON_MAX_SIZE);
}
