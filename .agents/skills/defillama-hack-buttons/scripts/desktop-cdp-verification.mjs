export function verifyPage(page) {
  const replacements = page.replacements || [];
  const walletIds = replacements.map((item) => item.walletId).filter(Boolean);
  const uniqueWalletIds = new Set(walletIds);
  const oneKeyWalletIdPattern = /^[a-z0-9]+-onekey-[a-z0-9-]+$/i;
  const customInjectionActive =
    page.customInjection?.runtime?.source === 'custom-workspace' &&
    page.customInjection?.indicator?.visible === true;
  const visibleOneKeyReplacements = replacements.filter(
    (item) =>
      item.visible &&
      /^OneKey(?:\s*&\s*.+)?$/i.test(item.walletLabel || item.text) &&
      (oneKeyWalletIdPattern.test(item.walletId || '') ||
        item.image?.source?.startsWith('data:') ||
        /onekey/i.test(item.image?.source || '')),
  );
  const visibleJointReplacements = replacements.filter(
    (item) =>
      item.visible &&
      /^OneKey\s*&\s*/i.test(item.walletLabel || item.text) &&
      (item.image?.source?.startsWith('data:') || /onekey/i.test(item.image?.source || '')),
  );
  const passed =
    customInjectionActive &&
    replacements.length > 0 &&
    walletIds.length === uniqueWalletIds.size &&
    visibleOneKeyReplacements.length > 0;
  return {
    desktopDomCheckPassed: passed,
    verdictScope: 'development DOM check only; not Electron E2E and not registry verification',
    customInjectionActive,
    replacementCount: replacements.length,
    uniqueWalletIds: walletIds.length === uniqueWalletIds.size,
    visibleOneKeyReplacementCount: visibleOneKeyReplacements.length,
    visibleJointReplacementCount: visibleJointReplacements.length,
    replacements: replacements.map((item) => ({
      tag: item.tag,
      id: item.id,
      text: item.text,
      walletLabel: item.walletLabel,
      walletId: item.walletId,
      disabled: item.disabled,
      visible: item.visible,
      opacity: item.opacity,
      pointerEvents: item.pointerEvents,
      imageSource: item.image?.source || null,
    })),
  };
}
