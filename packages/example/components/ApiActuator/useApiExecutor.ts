import { get } from 'lodash';
import { useCallback } from 'react';

export type IApiExecutor = {
  onExecute: (request: string) => Promise<string>;
  onValidate: (request: string, response: string) => Promise<string>;
};

export function useApiExecutor({ onExecute, onValidate }: IApiExecutor): {
  execute: (request: string) => Promise<{ result: string | undefined; error: string | undefined }>;
  validate: (
    request: string,
    result: string,
  ) => Promise<{ validation: string | undefined; error: string | undefined }>;
} {
  const execute = useCallback(
    async (request: string) => {
      try {
        const result = await onExecute(request);
        return { result, error: undefined };
      } catch (error) {
        console.log('execute error', error);
        return { result: undefined, error: get(error, 'message', 'Execution error') };
      }
    },
    [onExecute],
  );

  const validate = useCallback(
    async (request: string, result: string) => {
      try {
        const validation = await onValidate(request, result);
        return { validation, error: undefined };
      } catch (error) {
        console.log('validate error', error);
        return { validation: undefined, error: get(error, 'message', 'Validation error') };
      }
    },
    [onValidate],
  );

  return { execute, validate };
}
