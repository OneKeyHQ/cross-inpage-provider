import {
  WALLET_CONNECT_INFO,
  WALLET_NAMES,
} from '../../../../providers/inpage-providers-hub/src/connectButtonHack/consts';
import { replaceDegenSwapWallet, replaceDegenSwapWallets } from './adapter.dom';

jest.mock(
  '../../../../providers/inpage-providers-hub/src/connectButtonHack/universal/utils',
  () => ({
    createWalletId: (provider: string, updatedName: string) => {
      const walletId = `${provider}-${updatedName.replace(/[\s&.]/g, '').toLowerCase()}`.replace(
        /onekey/i,
        'onekey-',
      );
      return {
        walletId,
        walletIdSelector: `[data-wallet-id="${walletId}"]`,
        get isUpdated() {
          return Boolean(document.querySelector(`[data-wallet-id="${walletId}"]`));
        },
        updateFlag(element: HTMLElement) {
          element.dataset.walletId = walletId;
        },
      };
    },
  }),
);

function setRendered(element: HTMLElement, rendered = true) {
  jest.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    bottom: rendered ? 283 : 0,
    height: rendered ? 58 : 0,
    left: 355,
    right: rendered ? 741 : 355,
    top: rendered ? 225 : 0,
    width: rendered ? 386 : 0,
    x: 355,
    y: rendered ? 225 : 0,
    toJSON: () => undefined,
  } as DOMRect);
}

function createWallet({
  buttonId,
  name,
  rendered = true,
  withIcon = true,
}: {
  buttonId: string;
  name: string;
  rendered?: boolean;
  withIcon?: boolean;
}) {
  const button = document.createElement('button');
  const labelFrame = document.createElement('div');
  const label = document.createElement('div');
  const iconFrame = document.createElement('div');
  const icon = document.createElement('img');
  const onClick = jest.fn();
  button.id = buttonId;
  label.textContent = name;
  icon.src = `https://dex.swapdegen.tips/wallets/${name}.png`;
  labelFrame.append(label);
  if (withIcon) iconFrame.append(icon);
  button.append(labelFrame, iconFrame);
  button.addEventListener('click', onClick);
  setRendered(button, rendered);
  return { button, icon, onClick };
}

describe('DegenSwap wallet replacement', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  test('updates MetaMask and leaves WalletConnect unchanged', () => {
    const hiddenMetaMask = createWallet({
      buttonId: 'connect-METAMASK',
      name: 'MetaMask',
      rendered: false,
    });
    const metaMask = createWallet({
      buttonId: 'connect-METAMASK',
      name: 'MetaMask',
    });
    const walletConnect = createWallet({
      buttonId: 'connect-WALLET_CONNECT',
      name: 'WalletConnect',
    });
    document.body.append(hiddenMetaMask.button, metaMask.button, walletConnect.button);

    expect(replaceDegenSwapWallets()).toEqual([metaMask.button]);
    expect(hiddenMetaMask.button.textContent).toBe('MetaMask');
    expect(metaMask.button.textContent).toBe(WALLET_CONNECT_INFO.metamask.text);
    expect(metaMask.icon.src).toBe(WALLET_CONNECT_INFO.metamask.icon);
    expect(metaMask.button.dataset.walletId).toBe('ethereum-onekey-metamask');
    expect(walletConnect.button.textContent).toBe('WalletConnect');
    expect(walletConnect.icon.src).toContain('/wallets/WalletConnect.png');
    expect(walletConnect.button.dataset.walletId).toBeUndefined();

    metaMask.button.click();
    walletConnect.button.click();
    expect(metaMask.onClick).toHaveBeenCalledTimes(1);
    expect(walletConnect.onClick).toHaveBeenCalledTimes(1);
  });

  test('is idempotent and rejects WalletConnect passed directly', () => {
    const metaMask = createWallet({
      buttonId: 'connect-METAMASK',
      name: 'MetaMask',
    });
    const walletConnect = createWallet({
      buttonId: 'connect-WALLET_CONNECT',
      name: 'WalletConnect',
    });
    document.body.append(metaMask.button, walletConnect.button);

    expect(
      replaceDegenSwapWallet({
        buttonId: 'connect-WALLET_CONNECT',
        originalName: 'WalletConnect',
        walletName: WALLET_NAMES.walletconnect,
      }),
    ).toBeNull();

    expect(replaceDegenSwapWallets()).toEqual([metaMask.button]);
    expect(replaceDegenSwapWallets()).toEqual([metaMask.button]);
    expect(metaMask.button.querySelectorAll('img')).toHaveLength(1);
    expect(document.querySelectorAll('[data-wallet-id="ethereum-onekey-metamask"]')).toHaveLength(
      1,
    );
    expect(walletConnect.button.textContent).toBe('WalletConnect');
    expect(walletConnect.button.dataset.walletId).toBeUndefined();
  });
});
