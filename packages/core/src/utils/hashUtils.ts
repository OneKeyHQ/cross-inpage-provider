import { hexToBytes, bytesToHex } from '@noble/hashes/utils';

function hasHexPrefix(data: string): boolean {
  return data.startsWith('0x');
}

function stripHexPrefix(hex: string): string {
  return hasHexPrefix(hex) ? hex.slice(2) : hex;
}

function addHexPrefix(hex: string): string {
  return hasHexPrefix(hex) ? hex : `0x${hex}`;
}

export { hexToBytes, bytesToHex, hasHexPrefix, stripHexPrefix, addHexPrefix };
