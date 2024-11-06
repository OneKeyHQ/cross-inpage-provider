import { atom, createStore } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { nanoid } from 'nanoid';
import { IFormField } from './types';

type Store = ReturnType<typeof createStore>;

export interface FormStore<T> {
  id: string;
  scope: Store;
  fieldsAtom: (id: string) => ReturnType<typeof atom<IFormField<T>>>;
  reset: () => void;
}

const formStores = new Map<string, FormStore<any>>();

export const createFormStore = <T = string>(id?: string): FormStore<T> => {
  const formId = id || nanoid();

  if (formStores.has(formId)) {
    return formStores.get(formId) as FormStore<T>;
  }

  const fieldsMap = new Map<string, IFormField<T>>();

  const store: FormStore<T> = {
    id: formId,
    scope: createStore(),
    fieldsAtom: atomFamily((id: string) => {
      const localAtom = atom<IFormField<T>>({ value: undefined });
      fieldsMap.set(id, { value: undefined });
      return localAtom;
    }),
    reset: () => {
      fieldsMap.forEach((_, fieldId) => {
        store.scope.set(store.fieldsAtom(fieldId), { value: undefined });
      });
      fieldsMap.clear();
    }
  };

  formStores.set(formId, store);
  return store;
};

export const getFormStore = (id: string) => {
  return formStores.get(id);
};

export const deleteFormStore = (id: string) => {
  formStores.get(id)?.reset();
  formStores.delete(id);
};
