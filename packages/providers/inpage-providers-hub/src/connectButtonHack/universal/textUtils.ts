import domUtils from '../utils/utilsDomNodes';
import { ConstraintFn } from './type';
import { universalLog } from './utils';

export function makeTextEllipse(
  textNode: HTMLElement,
  option = {} as Partial<CSSStyleDeclaration>,
) {
  textNode.style.whiteSpace = 'nowrap';
  textNode.style.overflow = 'hidden';
  textNode.style.textOverflow = 'ellipsis';
  Object.assign(textNode.style, option);
}
export function makeTextWrap(textNode: HTMLElement) {
  textNode.style.whiteSpace = 'normal';
}
export function makeTextWordBreak(textNode: HTMLElement) {
  textNode.style.wordBreak = 'break-word';
}
export function makeTextAlignLeft(textNode: HTMLElement) {
  textNode.style.textAlign = 'left';
}
export function makeTextAlignCenter(textNode: HTMLElement) {
  textNode.style.textAlign = 'center';
}

export function replaceText(textNode: Text, newText: string) {
  const newTextNode = document.createTextNode(newText);
  textNode.replaceWith(newTextNode);
  return newTextNode;
}
/**
 * @description:
 * make sure there is only one text node match walletName to ignore hidden text and other text
 */
export function findWalletTextByParent(
  container: HTMLElement,
  walletName: RegExp,
  constraints: ConstraintFn[],
): Text | null {
  if (!(container instanceof HTMLElement)) {
    universalLog.warn('arg is wrong. container is not a HTMLElement', container);
    return null;
  }
  const textNodes = domUtils.findTextNode(container, walletName, 'all') as Text[] | null;
  const length = textNodes?.length || 0;
  if (length === 0 || !textNodes) {
    universalLog.warn(
      `find  none for wallet name ${walletName.toString()}, container is `,
      container,
    );
    return null;
  }
  if (length > 1) {
    universalLog.warn(`find  more than one text node for wallet name ${walletName.toString()}`);
    return null;
  }
  if (constraints.some((f) => !textNodes[0].parentElement || !f(textNodes[0].parentElement))) {
    universalLog.warn('===>it doesnot satisfy the constraints', constraints);
    return null;
  }

  return textNodes[0];
}
