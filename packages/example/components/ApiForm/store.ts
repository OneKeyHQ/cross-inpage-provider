/* eslint-disable @typescript-eslint/no-explicit-any */
import { atom, createStore } from 'jotai';
import { nanoid } from 'nanoid';
import { IFormField } from './types';

type Store = ReturnType<typeof createStore>;

export interface FormStore {
  id: string;
  scope: Store;
  fieldAtom: <T , E = string>(
    id: string,
    initialValue?: IFormField<T, E>
  ) => ReturnType<typeof atom<IFormField<T, E>>>;
  fieldsAtom: (fieldIds: string[] | undefined) => ReturnType<typeof atom<(IFormField<any> & {
    id: string;
  })[]>>;
  allFields: () => string[];
  allFieldsAtom: () => ReturnType<typeof atom<(IFormField<any> & {
    id: string;
  })[]>>;
  reset: () => void;
  destroy: () => void;
}

const formStores = new Map<string, FormStore>();

export const createFormStore = (id?: string): FormStore => {
  const formId = id || nanoid();

  if (formStores.has(formId)) {
    return formStores.get(formId);
  }

  const fieldsAtoms = new Map<string, ReturnType<typeof atom>>();

  const store: FormStore = {
    id: formId,
    scope: createStore(),
    fieldAtom: <T, E = string>(id: string, initialValue?: IFormField<T, E>) => {
      if (!fieldsAtoms.has(id)) {
        const fieldAtom = atom<IFormField<T, E>>({
          value: initialValue?.defaultValue ?? undefined,
          ...initialValue
        });
        fieldsAtoms.set(id, fieldAtom);
      }
      return fieldsAtoms.get(id);
    },
    // @ts-expect-error
    fieldsAtom: (fieldIds: string[] | undefined) => {
      return atom((get) => {
        if (!fieldIds?.length) return [];

        return fieldIds.map((id) => {
          const fieldAtom = store.fieldAtom(id);
          const field = get(fieldAtom);
          return {
            id,
            ...field,
          };
        });
      });
    },
    allFields: () => {
      return Array.from(fieldsAtoms.keys());
    },
    // @ts-expect-error
    allFieldsAtom: () => {
      return atom((get) => {
        return Array.from(fieldsAtoms.values()).map((fieldAtom) => get(fieldAtom));
      });
    },
    reset: () => {
      fieldsAtoms.forEach((fieldAtom) => {
        const field = store.scope.get(fieldAtom);
        // @ts-expect-error
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        store.scope.set(fieldAtom, { value: undefined , defaultValue: field?.defaultValue });
      });
    },
    destroy: () => {
      fieldsAtoms.clear();
    }
  };

  formStores.set(formId, store);
  return store;
};

export const getFormStore = (id: string) => {
  return formStores.get(id);
};

export const deleteFormStore = (id: string) => {
  formStores.get(id)?.destroy();
  formStores.delete(id);
};
