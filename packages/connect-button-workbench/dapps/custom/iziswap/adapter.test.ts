import { promoteOneKeyWalletItem } from './adapter.dom';

function setRendered(element: HTMLElement) {
  jest.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    bottom: 100,
    height: 80,
    left: 0,
    right: 100,
    top: 20,
    width: 100,
    x: 0,
    y: 20,
    toJSON: () => undefined,
  } as DOMRect);
}

function createWallet(name: string, icon: string) {
  const item = document.createElement('div');
  const clickable = document.createElement('div');
  const image = document.createElement('img');
  const text = document.createElement('p');
  image.src = icon;
  text.textContent = name;
  clickable.append(image, text);
  item.append(clickable);
  setRendered(item);
  return { clickable, item };
}

describe('iZiSwap OneKey wallet promotion', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  test('moves OneKey first with CSS without changing DOM order or click handlers', () => {
    const list = document.createElement('div');
    const metamask = createWallet('Metamask', 'https://izumi.finance/wallet/metamask.png');
    const walletConnect = createWallet(
      'Wallet Connect',
      'https://izumi.finance/wallet/walletConnectIcon.svg',
    );
    const onekey = createWallet('OneKey', 'https://izumi-finance.example/wallet/onekey.png');
    const onMetamaskClick = jest.fn();
    const onWalletConnectClick = jest.fn();
    const onClick = jest.fn();
    metamask.clickable.addEventListener('click', onMetamaskClick);
    walletConnect.clickable.addEventListener('click', onWalletConnectClick);
    onekey.clickable.addEventListener('click', onClick);
    list.append(metamask.item, walletConnect.item, onekey.item);
    list.style.display = 'flex';
    setRendered(list);
    document.body.append(list);

    expect(promoteOneKeyWalletItem()).toBe(onekey.item);
    expect(list.firstElementChild).toBe(metamask.item);
    expect(list.lastElementChild).toBe(onekey.item);
    expect(onekey.item.style.getPropertyValue('order')).toBe('-1');
    expect(onekey.item.style.getPropertyPriority('order')).toBe('important');

    metamask.clickable.click();
    walletConnect.clickable.click();
    onekey.clickable.click();
    expect(onMetamaskClick).toHaveBeenCalledTimes(1);
    expect(onWalletConnectClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(1);

    promoteOneKeyWalletItem();
    expect(list.children).toHaveLength(3);
    expect(list.firstElementChild).toBe(metamask.item);
    expect(list.lastElementChild).toBe(onekey.item);
    expect(onekey.item.style.getPropertyValue('order')).toBe('-1');
  });

  test('ignores an unrelated OneKey image outside a wallet list', () => {
    const image = document.createElement('img');
    image.src = 'https://example.com/wallet/onekey.png';
    document.body.append(image);

    expect(promoteOneKeyWalletItem()).toBeNull();
  });
});
