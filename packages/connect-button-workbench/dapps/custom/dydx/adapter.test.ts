import { WALLET_CONNECT_INFO } from '../../../../providers/inpage-providers-hub/src/connectButtonHack/consts';

import { replaceDydxMetaMaskWallet } from './adapter.dom';

jest.mock(
  '../../../../providers/inpage-providers-hub/src/connectButtonHack/universal/utils',
  () => ({
    createWalletId: (provider: string, updatedName: string) => {
      const walletId = `${provider}-${updatedName.replace(/[\s&.]/g, '').toLowerCase()}`.replace(
        /onekey/i,
        'onekey-',
      );
      const walletIdSelector = `[data-wallet-id="${walletId}"]`;
      return {
        walletId,
        walletIdSelector,
        get isUpdated() {
          return Boolean(document.querySelector(walletIdSelector));
        },
        updateFlag(element: HTMLElement) {
          element.dataset.walletId = walletId;
        },
      };
    },
  }),
);

function setRendered(button: HTMLButtonElement, rendered = true) {
  jest.spyOn(button, 'getBoundingClientRect').mockReturnValue({
    bottom: rendered ? 302 : 0,
    height: rendered ? 36 : 0,
    left: 382,
    right: rendered ? 571 : 382,
    top: rendered ? 266 : 0,
    width: rendered ? 189 : 0,
    x: 382,
    y: rendered ? 266 : 0,
    toJSON: () => undefined,
  } as DOMRect);
}

function createWallet(name: string, icon: string, rendered = true) {
  const button = document.createElement('button');
  const image = document.createElement('img');
  const onClick = jest.fn();
  image.src = icon;
  button.append(image, name);
  button.addEventListener('click', onClick);
  setRendered(button, rendered);
  return { button, image, onClick };
}

describe('dYdX wallet replacement', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  test('replaces the visible MetaMask wallet and preserves its click handler', () => {
    const hidden = createWallet('MetaMask', '/wallets/metamask.svg', false);
    const metamask = createWallet('MetaMask', '/wallets/metamask.svg');
    const walletConnect = createWallet('WalletConnect (1.0)', '/wallets/walletconnect.svg');
    document.body.append(hidden.button, metamask.button, walletConnect.button);

    expect(replaceDydxMetaMaskWallet()).toBe(metamask.button);
    expect(hidden.button.textContent).toBe('MetaMask');
    expect(metamask.button.textContent).toBe(WALLET_CONNECT_INFO.metamask.text);
    expect(metamask.image.src).toBe(WALLET_CONNECT_INFO.metamask.icon);
    expect(metamask.button.dataset.walletId).toBe('ethereum-onekey-metamask');
    expect(walletConnect.button.textContent).toBe('WalletConnect (1.0)');
    expect(walletConnect.button.dataset.walletId).toBeUndefined();

    metamask.button.click();
    expect(metamask.onClick).toHaveBeenCalledTimes(1);
  });

  test('replaces a sole MetaMask wallet before its first layout', () => {
    const metamask = createWallet('MetaMask', '/wallets/metamask.svg', false);
    document.body.append(metamask.button);

    expect(replaceDydxMetaMaskWallet()).toBe(metamask.button);
    expect(metamask.button.textContent).toBe(WALLET_CONNECT_INFO.metamask.text);
    expect(metamask.button.dataset.walletId).toBe('ethereum-onekey-metamask');
  });

  test('is idempotent and ignores unrelated MetaMask text', () => {
    const metamask = createWallet('MetaMask', '/wallets/metamask.svg');
    const unrelated = createWallet('MetaMask', '/images/metamask.svg');
    document.body.append(metamask.button, unrelated.button);

    expect(replaceDydxMetaMaskWallet()).toBe(metamask.button);
    expect(replaceDydxMetaMaskWallet()).toBe(metamask.button);
    expect(document.querySelectorAll('[data-wallet-id="ethereum-onekey-metamask"]')).toHaveLength(
      1,
    );
    expect(metamask.button.querySelectorAll('img')).toHaveLength(1);
    expect(unrelated.button.textContent).toBe('MetaMask');
    expect(unrelated.button.dataset.walletId).toBeUndefined();
  });
});
