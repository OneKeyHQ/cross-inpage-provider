import { TronWeb } from 'tronweb';
import { ProviderTron } from './ProviderTron';

// Exercise the browser polyfill rather than Node's built-in buffer module.
jest.mock('buffer', () => jest.requireActual<typeof import('buffer')>('buffer/'));
jest.mock('sunweb', () => jest.fn());
jest.mock('@onekeyfe/cross-inpage-provider-core', () => ({ ProviderBase: class {} }));
jest.mock('@onekeyfe/extension-bridge-injected', () => ({}));
jest.mock('@onekeyfe/cross-inpage-provider-errors', () => ({ web3Errors: {} }));

describe('TRON signMessageV2 without a global Buffer', () => {
  const originalBuffer = Object.getOwnPropertyDescriptor(globalThis, 'Buffer');

  beforeEach(() => {
    Reflect.deleteProperty(globalThis, 'Buffer');
  });

  afterEach(() => {
    if (originalBuffer) {
      Object.defineProperty(globalThis, 'Buffer', originalBuffer);
    }
  });

  it.each([
    { name: 'UTF-8 text', message: 'hello', hex: '68656c6c6f' },
    { name: 'Unicode text', message: '你好👋', hex: 'e4bda0e5a5bdf09f918b' },
    { name: 'hex-looking text', message: '0x01020304', hex: '30783031303230333034' },
    { name: 'Uint8Array', message: new Uint8Array([0, 1, 127, 128, 255]), hex: '00017f80ff' },
    { name: 'byte array', message: [0, 1, 127, 128, 255], hex: '00017f80ff' },
    { name: 'empty text', message: '', hex: '' },
    { name: 'empty bytes', message: new Uint8Array(), hex: '' },
  ])('encodes $name and forwards the request to the wallet', async ({ message, hex }) => {
    const provider = Object.create(ProviderTron.prototype) as ProviderTron;
    const bridgeRequest = jest.fn().mockResolvedValue('wallet-signature');
    Object.assign(provider, {
      bridgeRequest,
      tronWeb: new TronWeb({ fullHost: 'https://rpc.example.invalid' }),
    });

    expect(Reflect.has(globalThis, 'Buffer')).toBe(false);
    await expect(provider.signMessageV2(message)).resolves.toBe('wallet-signature');
    expect(bridgeRequest).toHaveBeenCalledTimes(1);
    expect(bridgeRequest).toHaveBeenCalledWith({ method: 'signMessageV2', params: [hex] });
    expect(Reflect.has(globalThis, 'Buffer')).toBe(false);
  });
});
