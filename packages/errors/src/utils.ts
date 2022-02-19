import { errorCodes, errorValues } from './error-constants';
import { Web3RpcError, SerializedWeb3RpcError } from './classes';

const FALLBACK_ERROR_CODE = errorCodes.rpc.internal;
const FALLBACK_MESSAGE = 'Unspecified error message. This is a bug, please report it.';
const FALLBACK_ERROR: SerializedWeb3RpcError = {
  code: FALLBACK_ERROR_CODE,
  message: getMessageFromCode(FALLBACK_ERROR_CODE),
};

export const JSON_RPC_SERVER_ERROR_MESSAGE = 'Unspecified server error.';

type ErrorValueKey = keyof typeof errorValues;

/**
 * Gets the message for a given code, or a fallback message if the code has
 * no corresponding message.
 */
export function getMessageFromCode(
  code: number,
  fallbackMessage: string = FALLBACK_MESSAGE,
): string {
  if (Number.isInteger(code)) {
    const codeString = code.toString();

    if (hasKey(errorValues, codeString)) {
      return errorValues[codeString as ErrorValueKey].message;
    }
    if (isJsonRpcServerError(code)) {
      return JSON_RPC_SERVER_ERROR_MESSAGE;
    }
  }
  return fallbackMessage;
}

/**
 * Returns whether the given code is valid.
 * A code is only valid if it has a message.
 */
export function isValidCode(code: number): boolean {
  if (!Number.isInteger(code)) {
    return false;
  }

  const codeString = code.toString();
  if (errorValues[codeString as ErrorValueKey]) {
    return true;
  }

  if (isJsonRpcServerError(code)) {
    return true;
  }
  return false;
}

/**
 * Serializes the given error to an Web3 JSON RPC-compatible error object.
 * Merely copies the given error's values if it is already compatible.
 * If the given error is not fully compatible, it will be preserved on the
 * returned object's data.originalError property.
 */
export function serializeError(
  error: unknown,
  {
    fallbackError = FALLBACK_ERROR,
    shouldIncludeStack = false,
  } = {},
): SerializedWeb3RpcError {

  if (
    !fallbackError ||
    !Number.isInteger(fallbackError.code) ||
    typeof fallbackError.message !== 'string'
  ) {
    throw new Error(
      'Must provide fallback error with integer number code and string message.',
    );
  }

  if (error instanceof Web3RpcError) {
    return error.serialize();
  }

  const serialized: Partial<SerializedWeb3RpcError> = {};

  if (
    error &&
    typeof error === 'object' &&
    !Array.isArray(error) &&
    hasKey(error as Record<string, unknown>, 'code') &&
    isValidCode((error as SerializedWeb3RpcError).code)
  ) {
    const _error = error as Partial<SerializedWeb3RpcError>;
    serialized.code = _error.code;

    if (_error.message && typeof _error.message === 'string') {
      serialized.message = _error.message;

      if (hasKey(_error, 'data')) {
        serialized.data = _error.data;
      }
    } else {
      serialized.message = getMessageFromCode(
        (serialized as SerializedWeb3RpcError).code,
      );

      serialized.data = { originalError: assignOriginalError(error) };
    }
  } else {
    serialized.code = fallbackError.code;

    const message = (error as Error)?.message;

    serialized.message = (
      message && typeof message === 'string'
        ? message
        : fallbackError.message
    );
    serialized.data = { originalError: assignOriginalError(error) };
  }

  const stack = (error as Error)?.stack;

  if (shouldIncludeStack && error && stack && typeof stack === 'string') {
    serialized.stack = stack;
  }
  return serialized as SerializedWeb3RpcError;
}

// Internal

function isJsonRpcServerError(code: number): boolean {
  return code >= -32099 && code <= -32000;
}

function assignOriginalError(error: unknown): unknown {
  if (error && typeof error === 'object' && !Array.isArray(error)) {
    return Object.assign({}, error);
  }
  return error;
}

function hasKey(obj: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}
