import { WALLET_CONNECT_INFO } from '../../../../providers/inpage-providers-hub/src/connectButtonHack/consts';
import { replaceSatflowUnisat } from './adapter.dom';

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
    bottom: rendered ? 290 : 0,
    height: rendered ? 44 : 0,
    left: 341,
    right: rendered ? 755 : 341,
    top: rendered ? 246 : 0,
    width: rendered ? 414 : 0,
    x: 341,
    y: rendered ? 246 : 0,
    toJSON: () => undefined,
  } as DOMRect);
}

function createWalletOption({
  name = 'UniSat',
  rendered = true,
  withIcon = true,
}: {
  name?: string;
  rendered?: boolean;
  withIcon?: boolean;
} = {}) {
  const dialog = document.createElement('div');
  const list = document.createElement('ul');
  const option = document.createElement('li');
  const iconFrame = document.createElement('div');
  const icon = document.createElement('img');
  const label = document.createElement('b');
  const onClick = jest.fn();
  dialog.setAttribute('role', 'dialog');
  dialog.dataset.state = 'open';
  dialog.dataset.slot = 'dialog-content';
  icon.alt = `${name} logo`;
  icon.src = `https://www.satflow.com/wallet-icons/${name.toLowerCase()}.png`;
  label.append(name);
  if (withIcon) iconFrame.append(icon);
  option.append(iconFrame, label);
  option.addEventListener('click', onClick);
  list.append(option);
  dialog.append(list);
  setRendered(option, rendered);
  return { dialog, icon, onClick, option };
}

describe('Satflow UniSat wallet replacement', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  test('updates the rendered option and preserves its click behavior', () => {
    const hidden = createWalletOption({ rendered: false });
    hidden.option.dataset.walletId = 'btc-onekey-unisat';
    const rendered = createWalletOption();
    document.body.append(hidden.dialog, rendered.dialog);

    expect(replaceSatflowUnisat()).toBe(rendered.option);
    expect(hidden.option.dataset.walletId).toBeUndefined();
    expect(hidden.option.textContent).toBe('UniSat');
    expect(rendered.option.dataset.walletId).toBe('btc-onekey-unisat');
    expect(rendered.option.textContent).toBe(WALLET_CONNECT_INFO.unisat.text);
    expect(rendered.icon.src).toBe(WALLET_CONNECT_INFO.unisat.icon);

    rendered.option.click();
    expect(rendered.onClick).toHaveBeenCalledTimes(1);
  });

  test('is idempotent and ignores unrelated or incomplete options', () => {
    const unrelated = createWalletOption({ name: 'Xverse' });
    const incomplete = createWalletOption({ withIcon: false });
    const rendered = createWalletOption();
    document.body.append(unrelated.dialog, incomplete.dialog, rendered.dialog);

    expect(replaceSatflowUnisat()).toBe(rendered.option);
    expect(replaceSatflowUnisat()).toBe(rendered.option);
    expect(document.querySelectorAll('[data-wallet-id="btc-onekey-unisat"]')).toHaveLength(1);
    expect(unrelated.option.textContent).toBe('Xverse');
    expect(incomplete.option.textContent).toBe('UniSat');
  });
});
