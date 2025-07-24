import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo } from 'react';
import { createFormStore, deleteFormStore } from './store';
import { Provider } from 'jotai';
import { ApiFormProviderContext } from './hooks/useFormContext';
import { ApiFormRef } from './ApiForm';
import { stringifyWithSpecialType } from '../../lib/jsonUtils';
import { get, isEmpty } from 'lodash';
import { tryFormatCompactJson, tryFormatJson } from '../ApiActuator/ApiPayloadProvider';

export const ApiFormProvider = forwardRef<ApiFormRef | null, { children: React.ReactNode }>(
    function ApiFormProvider({ children }, ref) {
  const store = useMemo(() => createFormStore(), []);

  useEffect(() => {
    return () => {
      deleteFormStore(store.id);
    };
  }, [store.id]);

  const formApi: ApiFormRef = useMemo(() => ({
    reset: () => {
      store.reset();
    },
    getField: (id: string) => {
      return store.scope.get(store.fieldAtom(id)) ;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setField: (id: string, field: any) => {
      const oldField = store.scope.get(store.fieldAtom(id));
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      store.scope.set(store.fieldAtom(id), {
        ...oldField,
        ...field,
      });
    },
    getValue: <T = any>(id: string) => {
      return store.scope.get(store.fieldAtom(id))?.value as T;
    },
    setValue: (id: string, value: any) => {
      store.scope.set(store.fieldAtom(id), {
        value,
      });
    },
    setJsonValue: (id: string, result: any) => {
      let resultString: string;
      let errorMessage = '';

      try {
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
      } catch (error) {
        console.log('execute error', error);
        try {
          errorMessage = JSON.stringify(error);
        } catch (error) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          errorMessage = get(error, 'message', 'Execution error');
        }
      }

      if (isEmpty(errorMessage)) {
        store.scope.set(store.fieldAtom(id), {
          value: tryFormatCompactJson(resultString),
        });
      } else {
        store.scope.set(store.fieldAtom(id), {
          error: errorMessage,
        });
      }
    },
    setError: (id: string, error: string) => {
      store.scope.set(store.fieldAtom(id), {
        error,
      });
    },
  }), [store]);

  useImperativeHandle(
    ref,
    () => formApi,
    [formApi],
  );

  const getFromApi = useCallback(() => {
    return formApi;
  }, [formApi]);

  const contextValue = useMemo(
    () => ({
      store,
      getFromApi
    }),
    [store, getFromApi],
  );

  return (
    <Provider store={store.scope}>
      <ApiFormProviderContext.Provider value={contextValue}>
        {children}
      </ApiFormProviderContext.Provider>
    </Provider>
  );
});
