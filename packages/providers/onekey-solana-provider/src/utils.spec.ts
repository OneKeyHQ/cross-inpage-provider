import base58 from 'bs58';

import {
  OFFCHAIN_MESSAGE_MAX_SIGNERS,
  OFFCHAIN_MESSAGE_SIGNER_LENGTH,
  normalizeRequiredSigners,
} from './utils';

const key = (fill: number) => new Uint8Array(OFFCHAIN_MESSAGE_SIGNER_LENGTH).fill(fill);
const keyAt = (index: number) => {
  const bytes = new Uint8Array(OFFCHAIN_MESSAGE_SIGNER_LENGTH);
  bytes[0] = (index >> 8) & 0xff;
  bytes[1] = index & 0xff;
  return bytes;
};

describe('normalizeRequiredSigners', () => {
  it('accepts base58 strings, byte arrays and PublicKey-like objects', () => {
    const bytes = key(1);
    const encoded = base58.encode(bytes);

    expect(normalizeRequiredSigners([encoded])).toEqual([encoded]);
    expect(normalizeRequiredSigners([bytes])).toEqual([encoded]);
    expect(normalizeRequiredSigners([{ toBytes: () => bytes }])).toEqual([encoded]);
  });

  it('preserves the given order, since the wallet is what sorts them', () => {
    const first = base58.encode(key(2));
    const second = base58.encode(key(1));
    expect(normalizeRequiredSigners([first, second])).toEqual([first, second]);
  });

  it('rejects an empty or non-array input', () => {
    expect(() => normalizeRequiredSigners([])).toThrow('non-empty array');
    expect(() =>
      normalizeRequiredSigners(undefined as unknown as string[]),
    ).toThrow('non-empty array');
  });

  it('rejects more signers than the single byte signer count can hold', () => {
    const tooMany = Array.from({ length: OFFCHAIN_MESSAGE_MAX_SIGNERS + 1 }, (_, i) => keyAt(i));
    expect(() => normalizeRequiredSigners(tooMany)).toThrow('at most 255');

    const atLimit = Array.from({ length: OFFCHAIN_MESSAGE_MAX_SIGNERS }, (_, i) => keyAt(i));
    expect(normalizeRequiredSigners(atLimit)).toHaveLength(OFFCHAIN_MESSAGE_MAX_SIGNERS);
  });

  it('rejects duplicates regardless of how they were expressed', () => {
    const bytes = key(3);
    expect(() => normalizeRequiredSigners([bytes, base58.encode(bytes)])).toThrow(
      'must be unique',
    );
  });

  it('rejects keys that are not 32 bytes', () => {
    expect(() => normalizeRequiredSigners([new Uint8Array(31).fill(1)])).toThrow(
      'must be a 32-byte public key',
    );
  });

  it('rejects invalid base58', () => {
    expect(() => normalizeRequiredSigners(['not valid base58 !!!'])).toThrow(
      'not a valid base58 public key',
    );
  });

  it('names the parameter and index for unsupported element types', () => {
    expect(() =>
      normalizeRequiredSigners([undefined as unknown as string]),
    ).toThrow('requiredSigners[0] must be a base58 string');
    expect(() => normalizeRequiredSigners([key(1), 42 as unknown as string])).toThrow(
      'requiredSigners[1] must be a base58 string',
    );
  });
});
