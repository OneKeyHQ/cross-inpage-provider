export function hasHexPrefix(data: string): boolean {
  return data.startsWith('0x');
}

export function stripHexPrefix(hex: string): string {
  return hasHexPrefix(hex) ? hex.slice(2) : hex;
}
