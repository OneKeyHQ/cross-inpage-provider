import { get } from 'lodash';
import { useCallback } from 'react';
import { stringifyWithSpecialType } from '../../lib/jsonUtils';
import { useToast } from '../ui/use-toast';

export type IApiExecutor = {
  onExecute: (request: string) => Promise<any>;
  onValidate?: (request: string, response: string) => Promise<any>;
};

export function useApiExecutor({ onExecute, onValidate }: IApiExecutor): {
  execute: (request: string) => Promise<{ result: string | undefined; error: string | undefined }>;
  validate: (
    request: string,
    result: string,
  ) => Promise<{ validation: string | undefined; error: string | undefined }>;
} {
  const { toast } = useToast();

  const execute = useCallback(
    async (request: string) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const result = await onExecute(request);

        let resultString: string;
        // normal types
        if (
          typeof result === 'number' ||
          typeof result === 'boolean' ||
          typeof result === 'string'
        ) {
          resultString = result.toString();
        } else {
          resultString = stringifyWithSpecialType(result);
        }

        return { result: resultString ?? 'null', error: undefined };
      } catch (error) {
        console.log('execute error', error);

        let errorMessage = '';
        try {
          errorMessage = JSON.stringify(error);
        } catch (error) {
          errorMessage = get(error, 'message', 'Execution error');
        }
        return { result: undefined, error: errorMessage };
      }
    },
    [onExecute],
  );

  const validate = useCallback(
    async (request: string, result: string) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const validation = await onValidate(request, result);

        let validationString: string;
        // normal types
        if (
          typeof validation === 'number' ||
          typeof validation === 'boolean' ||
          typeof validation === 'string'
        ) {
          validationString = validation.toString();
        } else {
          validationString = stringifyWithSpecialType(validation);
        }

        return { validation: validationString ?? 'null', error: undefined };
      } catch (error) {
        toast({
          title: '验证失败',
          description: get(error, 'message', '验证失败'),
          variant: 'destructive',
        });
        console.log('validate error', error);
        return { validation: undefined, error: get(error, 'message', 'Validation error') };
      }
    },
    [onValidate, toast],
  );

  return { execute, validate };
}
