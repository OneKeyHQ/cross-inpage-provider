import { WALLET_CONNECT_INFO } from '../../../../providers/inpage-providers-hub/src/connectButtonHack/consts';
import { replaceOrdinalsWalletUnisat } from './adapter.dom';

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

function setRendered(element: HTMLElement, rendered = true) {
  jest.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    bottom: rendered ? 64 : 0,
    height: rendered ? 56 : 0,
    left: 0,
    right: rendered ? 494 : 0,
    top: rendered ? 8 : 0,
    width: rendered ? 494 : 0,
    x: 0,
    y: rendered ? 8 : 0,
    toJSON: () => undefined,
  } as DOMRect);
}

function createWalletOption({
  name = 'Unisat',
  rendered = true,
}: {
  name?: string;
  rendered?: boolean;
} = {}) {
  const option = document.createElement('div');
  const icon = document.createElement('img');
  const text = document.createTextNode(name);
  const onClick = jest.fn();
  option.setAttribute('cmdk-item', '');
  option.setAttribute('role', 'option');
  option.dataset.value = name;
  icon.src = `https://ordinalswallet.com/connect-${name.toLowerCase()}.png`;
  option.append(icon, text);
  option.addEventListener('click', onClick);
  setRendered(option, rendered);
  return { icon, onClick, option };
}

describe('Ordinals Wallet UniSat replacement', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  test('updates the rendered option and preserves its selection behavior', () => {
    const hidden = createWalletOption({ rendered: false });
    hidden.option.dataset.walletId = 'btc-onekey-unisat';
    const rendered = createWalletOption();
    document.body.append(hidden.option, rendered.option);

    expect(replaceOrdinalsWalletUnisat()).toBe(rendered.option);
    expect(hidden.option.dataset.walletId).toBeUndefined();
    expect(hidden.option.textContent).toBe('Unisat');
    expect(rendered.option.dataset.walletId).toBe('btc-onekey-unisat');
    expect(rendered.option.dataset.value).toBe('Unisat');
    expect(rendered.option.textContent).toBe(WALLET_CONNECT_INFO.unisat.text);
    expect(rendered.icon.src).toBe(WALLET_CONNECT_INFO.unisat.icon);

    rendered.option.click();
    expect(rendered.onClick).toHaveBeenCalledTimes(1);
  });

  test('is idempotent and ignores unrelated wallet options', () => {
    const unrelated = createWalletOption({ name: 'Xverse' });
    const rendered = createWalletOption();
    document.body.append(unrelated.option, rendered.option);

    expect(replaceOrdinalsWalletUnisat()).toBe(rendered.option);
    expect(replaceOrdinalsWalletUnisat()).toBe(rendered.option);
    expect(document.querySelectorAll('[data-wallet-id="btc-onekey-unisat"]')).toHaveLength(1);
    expect(unrelated.option.textContent).toBe('Xverse');
    expect(unrelated.icon.src).toBe('https://ordinalswallet.com/connect-xverse.png');
  });
});
