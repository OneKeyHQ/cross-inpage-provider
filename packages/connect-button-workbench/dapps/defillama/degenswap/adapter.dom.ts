import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';

import type { REPLACEABLE_WALLET_NAMES } from '../../../../providers/inpage-providers-hub/src/connectButtonHack/consts';
import {
  WALLET_CONNECT_INFO,
  WALLET_NAMES,
} from '../../../../providers/inpage-providers-hub/src/connectButtonHack/consts';
import { createWalletId } from '../../../../providers/inpage-providers-hub/src/connectButtonHack/universal/utils';

type IDegenSwapWallet = {
  buttonId: string;
  originalName: string;
  walletName: WALLET_NAMES;
};

const DEGEN_SWAP_WALLETS: IDegenSwapWallet[] = [
  {
    buttonId: 'connect-METAMASK',
    originalName: 'MetaMask',
    walletName: WALLET_NAMES.metamask,
  },
];

function isRendered(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    style.pointerEvents !== 'none' &&
    rect.width > 0 &&
    rect.height > 0
  );
}

function findWalletLabel(button: HTMLElement, originalName: string): HTMLElement | null {
  return (
    Array.from(button.querySelectorAll<HTMLElement>('div')).find(
      (element) => element.children.length === 0 && element.textContent?.trim() === originalName,
    ) || null
  );
}

export function replaceDegenSwapWallet({
  buttonId,
  originalName,
  walletName,
}: IDegenSwapWallet): HTMLElement | null {
  // WalletConnect replacement is intentionally disabled. Keep the DApp's native
  // WalletConnect branding and connection flow even if an upstream config passes it.
  if (walletName === WALLET_NAMES.walletconnect) return null;

  const walletInfo = WALLET_CONNECT_INFO[walletName as REPLACEABLE_WALLET_NAMES];
  const walletId = createWalletId(IInjectedProviderNames.ethereum, walletInfo.text);
  const button = Array.from(
    document.querySelectorAll<HTMLElement>(`button[id="${buttonId}"]`),
  ).find(isRendered);
  if (!button) return null;
  if (button.dataset.walletId === walletId.walletId) return button;
  if (button.textContent?.trim() !== originalName) return null;

  const label = findWalletLabel(button, originalName);
  const image = button.querySelector<HTMLImageElement>('img');
  if (!label || !image) return null;

  label.textContent = walletInfo.text;
  image.src = walletInfo.icon;
  walletId.updateFlag(button);
  return button;
}

export function replaceDegenSwapWallets(): HTMLElement[] {
  return DEGEN_SWAP_WALLETS.flatMap((wallet) => {
    const button = replaceDegenSwapWallet(wallet);
    return button ? [button] : [];
  });
}
