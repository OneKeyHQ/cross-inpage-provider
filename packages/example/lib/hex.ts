export function hasHexPrefix(data: string): boolean {
  return data.startsWith('0x');
}

export function stripHexPrefix(hex: string): string {
  return hasHexPrefix(hex) ? hex.slice(2) : hex;
}

export function addHexPrefix(hex: string): string {
  return hasHexPrefix(hex) ? hex : `0x${hex}`;
}
