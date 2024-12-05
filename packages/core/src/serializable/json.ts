export function enhancedJSONStringify(obj: any): string {
  return JSON.stringify(obj, (key, value) => {
    if (value === undefined) {
      return { __onekey_type: 'undefined', __onekey_data: '' };
    }

    if (value === null) {
      return null;
    }

    // Handle BigInt
    if (typeof value === 'bigint') {
      return {
        __onekey_type: 'bigint',
        __onekey_data: value.toString(),
      };
    }

    // Handle Uint8Array
    if (value instanceof Uint8Array) {
      return {
        __onekey_type: 'Uint8Array',
        __onekey_data: Buffer.from(value).toString('hex'),
      };
    }

    // Handle ArrayBuffer
    if (value instanceof ArrayBuffer) {
      return {
        __onekey_type: 'ArrayBuffer',
        __onekey_data: Buffer.from(new Uint8Array(value)).toString('hex'),
      };
    }

    return value as unknown;
  });
}

export function enhancedJSONParse(jsonString: string): any {
  return JSON.parse(jsonString, (key: string, value: unknown) => {
    if (value === null) {
      return null;
    }

    // Handle special type object
    if (
      value &&
      typeof value === 'object' &&
      '__onekey_type' in value &&
      '__onekey_data' in value &&
      typeof value.__onekey_data === 'string'
    ) {
      if (value.__onekey_type === 'undefined') {
        return undefined;
      }
      if (value.__onekey_type === 'bigint') {
        return BigInt(value.__onekey_data);
      }
      if (value.__onekey_type === 'Uint8Array') {
        return new Uint8Array(Buffer.from(value.__onekey_data, 'hex'));
      }
      if (value.__onekey_type === 'ArrayBuffer') {
        return new Uint8Array(Buffer.from(value.__onekey_data, 'hex')).buffer;
      }
    }

    return value;
  });
}
