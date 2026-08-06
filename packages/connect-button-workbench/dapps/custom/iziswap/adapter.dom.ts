const ONEKEY_ICON_PATTERN = /\/wallet\/onekey\.png(?:[?#]|$)/i;

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
    .filter((icon) =>
      ONEKEY_ICON_PATTERN.test(icon.currentSrc || icon.src || icon.getAttribute('src') || ''),
    )
    .map(findWalletItem)
    .filter(
      (
        candidate,
      ): candidate is {
        item: HTMLElement;
        list: HTMLElement;
      } => Boolean(candidate && isRendered(candidate.item) && isRendered(candidate.list)),
    );
  const candidate = candidates[candidates.length - 1];
  if (!candidate) {
    return null;
  }

  const { item, list } = candidate;
  if (!/^(inline-)?(flex|grid)$/.test(window.getComputedStyle(list).display)) {
    return null;
  }
  item.style.setProperty('order', '-1', 'important');
  return item;
}
