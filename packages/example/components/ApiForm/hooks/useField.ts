import { useCallback, useEffect, useMemo } from 'react';
import { useAtom } from 'jotai';
import type { IFormField } from '../types';
import { stringifyWithSpecialType } from '../../../lib/jsonUtils';
import { tryFormatJson } from '../../ApiActuator/ApiPayloadProvider';
import { get, isEmpty } from 'lodash';
import { useFormContext } from './useFormContext';

export interface UseFieldOptions<T, E> extends IFormField<T, E> {
  id: string;
}

export function useField<T = string | undefined, E = string>({
  id,
  name,
  required,
  defaultValue,
  value,
  extra,
}: UseFieldOptions<T, E>) {
  const { store, getFromApi } = useFormContext();

  // 1. 初始化值只需要在组件挂载时创建一次
  const initialValue = useMemo(
    () => ({
      name,
      required,
      defaultValue,
      value: value ?? defaultValue ?? undefined,
      extra,
    }),
    // 只在组件挂载时创建一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [field, setField] = useAtom(store.fieldAtom<T, E>(id, initialValue));

  // 2. 所有更新函数都需要用 useCallback 缓存
  const setValue = useCallback(
    (value: T) => {
      setField((prev) => {
        if (prev.value === value) {
          return prev;
        }
        return { ...prev, value };
      });
    },
    [setField],
  );

  // 设置错误信息
  const setError = useCallback(
    (error?: string) => {
      setField((prev) => ({ ...prev, error }));
    },
    [setField],
  );

  const setDisabled = useCallback(
    (disabled: boolean) => {
      setField((prev) => ({ ...prev, disabled }));
    },
    [setField],
  );

  const setExtra = useCallback(
    (extra: E) => {
      setField((prev) => ({ ...prev, extra }));
    },
    [setField],
  );

  const setValueJson = useCallback(
    (value: T) => {
      let resultString: string;
      let errorMessage = '';

      try {
        // normal types
        if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') {
          resultString = value.toString();
        } else {
          resultString = stringifyWithSpecialType(value);
        }
      } catch (error) {
        console.log('execute error', error);
        try {
          errorMessage = JSON.stringify(error);
        } catch (error) {
          errorMessage = get(error, 'message', 'Execution error');
        }
      }

      if (isEmpty(errorMessage)) {
        setValue(tryFormatJson(resultString) as T);
      } else {
        setError(errorMessage);
      }
    },
    [setError, setValue],
  );

  // 3. 外部属性变化时的更新
  useEffect(() => {
    if (extra !== undefined) {
      setExtra(extra);
    }
  }, [extra, setExtra]);

  useEffect(() => {
    if (value !== undefined) {
      setField((prev) => ({ ...prev, value }));
    }
  }, [value, setField]);

  useEffect(() => {
    setField((prev) => {
      if (prev.value === defaultValue) {
        return prev;
      }
      return { ...prev, value: defaultValue };
    });
  }, [defaultValue, setField]);

  // 4. 返回值使用 useMemo 缓存
  return useMemo(
    () => ({
      field,
      setValue,
      setError,
      setDisabled,
      setExtra,
      setValueJson,
      getFromApi,
    }),
    [field, setValue, setError, setDisabled, setExtra, setValueJson, getFromApi],
  );
}
