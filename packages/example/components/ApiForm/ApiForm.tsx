import React, { forwardRef, useEffect, useImperativeHandle, useMemo } from 'react';
import { Provider } from 'jotai';
import { Card, CardContent, CardDescription, CardHeader } from '../ui/card';
import { createFormStore, deleteFormStore } from './store';
import type { FormStore } from './store';
import { Button } from '../ui/button';
import { stringifyWithSpecialType } from '../../lib/jsonUtils';
import { tryFormatJson } from '../ApiActuator/ApiPayloadProvider';
import { get } from 'lodash';
import { IFormField } from './types';

export interface ApiFormRef {
  reset: () => void;
  getField: (id: string) => IFormField<any>;
  setField: (id: string, field: Partial<IFormField<any>>) => void;
  getValue: (id: string) => any;
  setValue: (id: string, value: any) => void;
  setJsonValue: (id: string, value: any) => void;
}

export interface ApiFormProps {
  id?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export interface ApiFormContextValue {
  store: FormStore<any>;
}

export const ApiFormContext = React.createContext<ApiFormContextValue | null>(null);


export const ApiForm = forwardRef<ApiFormRef, ApiFormProps>(function ApiForm(
  {
    id,
    title,
    description,
    children,
    className
  }: ApiFormProps,
  ref: React.Ref<ApiFormRef>
) {
  const store = useMemo(() => createFormStore(id), [id]);

  useEffect(() => {
    return () => {
      deleteFormStore(store.id);
    };
  }, [store.id]);

  const contextValue = useMemo(() => ({
    store
  }), [store]);

  useImperativeHandle(ref, () => ({
    reset: () => {
      store.reset();
    },
    getField: (id: string) => {
      return store.scope.get(store.fieldsAtom(id));
    },
    setField: (id: string, field: any) => {
      const oldField = store.scope.get(store.fieldsAtom(id));
      store.scope.set(store.fieldsAtom(id), {
        ...oldField,
        ...field
      });
    },
    getValue: (id: string) => {
      return store.scope.get(store.fieldsAtom(id)).value;
    },
    setValue: (id: string, value: any) => {
      store.scope.set(store.fieldsAtom(id), {
        value: value
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
          errorMessage = get(error, 'message', 'Execution error');
        }
      }

      store.scope.set(store.fieldsAtom(id), {
        value: tryFormatJson(resultString)
      });
    }
  }), [store]);

  return (
    <Provider store={store.scope}>
      <ApiFormContext.Provider value={contextValue}>
        <Card className={className}>
          <div className='flex justify-between'>
            <div>
              <CardHeader className="text-xl font-medium searchable">{title}</CardHeader>
              {description && <CardDescription>{description}</CardDescription>}
            </div>

            <Button variant="outline" size="sm" onClick={() => store.reset()}>
              Rest 请求
            </Button>
          </div>
          <CardContent>
            <div className="space-y-4">
              {children}
            </div>
          </CardContent>
        </Card>
      </ApiFormContext.Provider>
    </Provider>
  );
});