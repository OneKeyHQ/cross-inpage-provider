export function jsonToUint8Array(json: string | any): Uint8Array {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const message = typeof json === 'string' ? JSON.parse(json) : json;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
  const signatureArray = Object.keys(message).map((key) => message[key]);

  return new Uint8Array(signatureArray);
}
