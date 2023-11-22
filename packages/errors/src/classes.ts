// https://github.com/MetaMask/rpc-errors/blob/main/src/classes.ts
import safeStringify from 'fast-safe-stringify';

export interface SerializedWeb3RpcError {
  code: number; // must be an integer
  message: string;
  data?: unknown;
  stack?: string;
}

/**
 * Error subclass implementing JSON RPC 2.0 errors and Web3 RPC errors
 * per EIP-1474.
 * Permits any integer error code.
 */
export class Web3RpcError<T> extends Error {
  public code: number;

  public data?: T;

  constructor(code: number, message: string, data?: T) {
    if (!Number.isInteger(code)) {
      throw new Error('"code" must be an integer.');
    }
    if (!message || typeof message !== 'string') {
      throw new Error('"message" must be a nonempty string.');
    }

    super(message);
    this.code = code;
    if (data !== undefined) {
      this.data = data;
    }
  }

  /**
   * Returns a plain object with all public class properties.
   */
  serialize(): SerializedWeb3RpcError {
    const serialized: SerializedWeb3RpcError = {
      code: this.code,
      message: this.message,
    };
    if (this.data !== undefined) {
      serialized.data = this.data;
    }

    // TODO read error.stack cause RN hermes app crash
    // if (this.stack) {
    //   serialized.stack = this.stack;
    // }

    return serialized;
  }

  /**
   * Return a string representation of the serialized error, omitting
   * any circular references.
   */
  toString(): string {
    return safeStringify(this.serialize(), stringifyReplacer, 2);
  }
}

/**
 * Error subclass implementing Web3 Provider errors per EIP-1193.
 * Permits integer error codes in the [ 1000 <= 4999 ] range.
 */
export class Web3ProviderError<T> extends Web3RpcError<T> {
  /**
   * Create an Web3 Provider JSON-RPC error.
   * `code` must be an integer in the 1000 <= 4999 range.
   */
  constructor(code: number, message: string, data?: T) {
    if (!isValidWeb3ProviderCode(code)) {
      throw new Error('"code" must be an integer such that: 1000 <= code <= 4999');
    }

    super(code, message, data);
  }
}

// Internal

function isValidWeb3ProviderCode(code: number): boolean {
  return Number.isInteger(code) && code >= 1000 && code <= 4999;
}

function stringifyReplacer(_: unknown, value: unknown): unknown {
  if (value === '[Circular]') {
    return undefined;
  }
  return value;
}
