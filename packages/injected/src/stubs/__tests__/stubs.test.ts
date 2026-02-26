/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

// Unit tests for webpack stub modules used to replace heavy dependencies
// in the injected bundle. These stubs must maintain API compatibility
// with the subset of functionality actually used at runtime.

describe('validator-stub', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const validator = require('../validator-stub');

  describe('isURL', () => {
    it('should accept valid HTTP/HTTPS URLs', () => {
      expect(validator.isURL('https://api.trongrid.io')).toBe(true);
      expect(validator.isURL('http://localhost:8090')).toBe(true);
      expect(validator.isURL('https://node.mainnet.alephium.org')).toBe(true);
    });

    it('should reject non-URL strings', () => {
      expect(validator.isURL('not-a-url')).toBe(false);
      expect(validator.isURL('')).toBe(false);
      expect(validator.isURL('ftp://files.example.com')).toBe(false);
    });

    it('should reject non-string input', () => {
      expect(validator.isURL(null)).toBe(false);
      expect(validator.isURL(undefined)).toBe(false);
      expect(validator.isURL(123)).toBe(false);
    });

    it('should respect custom protocols option', () => {
      expect(validator.isURL('ftp://files.example.com', { protocols: ['ftp'] })).toBe(true);
      expect(validator.isURL('https://example.com', { protocols: ['ftp'] })).toBe(false);
    });
  });
});

describe('alephium-web3-stub', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const alph = require('../../../../providers/onekey-alph-provider/src/stubs/alephium-web3');

  it('should export SignerProvider and InteractiveSignerProvider', () => {
    expect(alph.SignerProvider).toBeDefined();
    expect(alph.InteractiveSignerProvider).toBeDefined();
    expect(alph.InteractiveSignerProvider.prototype).toBeInstanceOf(alph.SignerProvider);
  });

  it('should not export NodeProvider/ExplorerProvider (type-only imports, erased by TS)', () => {
    expect(alph.NodeProvider).toBeUndefined();
    expect(alph.ExplorerProvider).toBeUndefined();
  });

  it('should support duck-typing checks', () => {
    const instance = new alph.InteractiveSignerProvider();
    expect('getSelectedAccount' in instance).toBe(true);
    expect('enable' in instance).toBe(true);
  });
});
