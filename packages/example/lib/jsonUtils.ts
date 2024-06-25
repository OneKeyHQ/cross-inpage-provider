export function stringifyWithSpecialType(obj: any): string {
  if (obj instanceof Uint8Array) {
    return JSON.stringify(Array.from(obj));
  }

  return JSON.stringify(obj, (key, value) => {
    if (value instanceof Buffer) {
      return Array.from(value);
    }
    if (value instanceof Uint8Array) {
      return Array.from(value);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return value;
  });
}
