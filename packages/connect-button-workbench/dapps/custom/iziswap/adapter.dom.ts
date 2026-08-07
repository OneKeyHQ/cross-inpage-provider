import { WALLET_CONNECT_INFO } from '../../../../providers/inpage-providers-hub/src/connectButtonHack/consts';

const ONEKEY_ICON_PATTERN = /\/wallet\/onekey\.png(?:[?#]|$)/i;

function isOneKeyIcon(icon: HTMLImageElement) {
  const sources = [icon.currentSrc, icon.src, icon.getAttribute('src')].filter(
    (source): source is string => Boolean(source),
  );
  return sources.some(
    (source) =>
      ONEKEY_ICON_PATTERN.test(source) || source === WALLET_CONNECT_INFO.onekey.icon,
  );
}

function normalizeText(value: string | null | undefined) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isRendered(element: HTMLElement) {
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    Number(style.opacity || 1) > 0 &&
    rect.width > 0 &&
    rect.height > 0
  );
}

function findWalletItem(icon: HTMLImageElement) {
  let item: HTMLElement | null = icon.parentElement;
  while (item && item !== document.body) {
    const list = item.parentElement;
    if (list && list.children.length > 1) {
      const walletNames = Array.from(list.children).map((child) =>
        normalizeText(child.textContent),
      );
      if (
        normalizeText(item.textContent) === 'OneKey' &&
        walletNames.some((name) => /^meta\s*mask$/i.test(name)) &&
        walletNames.some((name) => /^wallet\s*connect$/i.test(name))
      ) {
        return { item, list };
      }
    }
    item = item.parentElement;
  }
  return null;
}

export function promoteOneKeyWalletItem() {
  const candidates = Array.from(document.querySelectorAll<HTMLImageElement>('img'))
    .filter(isOneKeyIcon)
    .map((icon) => {
      const candidate = findWalletItem(icon);
      return candidate ? { ...candidate, icon } : null;
    })
    .filter(
      (
        candidate,
      ): candidate is {
        icon: HTMLImageElement;
        item: HTMLElement;
        list: HTMLElement;
      } => Boolean(candidate && isRendered(candidate.item) && isRendered(candidate.list)),
    );
  const candidate = candidates[candidates.length - 1];
  if (!candidate) {
    return null;
  }

  const { icon, item, list } = candidate;
  if (!/^(inline-)?(flex|grid)$/.test(window.getComputedStyle(list).display)) {
    return null;
  }
  icon.src = WALLET_CONNECT_INFO.onekey.icon;
  icon.removeAttribute('srcset');
  item.style.setProperty('order', '-1', 'important');
  return item;
}
