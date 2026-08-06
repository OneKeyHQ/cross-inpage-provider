import { WALLET_CONNECT_INFO } from '../../../../providers/inpage-providers-hub/src/connectButtonHack/consts';
import { replaceGammaUnisatWallet } from './adapter.dom';

function setRendered(element: HTMLElement, rendered = true) {
  jest.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    bottom: rendered ? 68 : 0,
    height: rendered ? 48 : 0,
    left: 0,
    right: rendered ? 320 : 0,
    top: rendered ? 20 : 0,
    width: rendered ? 320 : 0,
    x: 0,
    y: rendered ? 20 : 0,
    toJSON: () => undefined,
  } as DOMRect);
}

function createUnisatButton(rendered = true) {
  const button = document.createElement('button');
  const content = document.createElement('div');
  const iconFrame = document.createElement('div');
  const icon = document.createElement('img');
  const text = document.createTextNode('Unisat');
  const onClick = jest.fn();
  icon.alt = 'unisat-logo';
  icon.src = 'https://gamma.io/public/unisat.svg';
  icon.style.width = '16px';
  icon.style.height = '16px';
  iconFrame.style.backgroundColor = 'black';
  iconFrame.append(icon);
  content.append(iconFrame, text);
  button.append(content);
  button.addEventListener('click', onClick);
  setRendered(button, rendered);
  return { button, icon, iconFrame, onClick };
}

describe('Gamma UniSat wallet replacement', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  test('updates only the rendered UniSat button and preserves its click handler', () => {
    const hidden = createUnisatButton(false);
    hidden.button.dataset.walletId = 'btc-onekey-unisat';
    const rendered = createUnisatButton();
    document.body.append(hidden.button, rendered.button);

    expect(replaceGammaUnisatWallet()).toBe(rendered.button);
    expect(hidden.button.dataset.walletId).toBeUndefined();
    expect(hidden.button.textContent).toBe('Unisat');
    expect(rendered.button.dataset.walletId).toBe('btc-onekey-unisat');
    expect(rendered.button.textContent).toBe(WALLET_CONNECT_INFO.unisat.text);
    expect(rendered.icon.src).toBe(WALLET_CONNECT_INFO.unisat.icon);
    expect(rendered.icon.style.width).toBe('32px');
    expect(rendered.icon.style.height).toBe('32px');
    expect(rendered.iconFrame.style.backgroundColor).toBe('transparent');

    rendered.button.click();
    expect(rendered.onClick).toHaveBeenCalledTimes(1);
  });

  test('is idempotent and ignores unrelated wallet buttons', () => {
    const unrelated = createUnisatButton();
    unrelated.icon.alt = 'xverse-logo';
    const rendered = createUnisatButton();
    document.body.append(unrelated.button, rendered.button);

    expect(replaceGammaUnisatWallet()).toBe(rendered.button);
    expect(replaceGammaUnisatWallet()).toBe(rendered.button);
    expect(document.querySelectorAll('[data-wallet-id="btc-onekey-unisat"]')).toHaveLength(1);
    expect(unrelated.button.textContent).toBe('Unisat');
    expect(unrelated.icon.src).toBe('https://gamma.io/public/unisat.svg');
  });
});
