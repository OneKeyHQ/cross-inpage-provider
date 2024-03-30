import domUtils from '../utils/utilsDomNodes';
import { dbg } from './utils';

export function makeTextEllipse(textNode: HTMLElement) {
  textNode.style.whiteSpace = 'nowrap';
  textNode.style.overflow = 'hidden';
  textNode.style.textOverflow = 'ellipsis';
}

export function replaceText(textNode: Text, newText: string) {
  textNode.replaceWith(newText);
}
/**
 * @description:
 * make sure there is only one text node match walletName to ignore hidden text and other text
 */
export function findWalletText(container: HTMLElement, walletName: RegExp): Text | null {
  const textNodes = domUtils.findTextNode(container, walletName, 'all') as Text[] | null;
  if (!textNodes || textNodes?.length > 1) {
    dbg(`===>find none or more than one text node for wallet name`);
    return null;
  }
  return textNodes[0];
}
