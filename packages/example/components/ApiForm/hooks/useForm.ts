import { useCallback } from 'react';
import { useFormContext } from './useFormContext';

export function useForm() {
  const context = useFormContext();
  if (!context) throw new Error('useForm must be used within ApiForm');

  const { store } = context;

  const getValue = useCallback(
    (id: string) => {
      return store.scope.get(store.fieldAtom(id)).value;
    },
    [store],
  );

  const setValue = useCallback(
    (id: string, value: any) => {
      store.scope.set(store.fieldAtom(id), { value });
    },
    [store],
  );

  const reset = useCallback(() => {
    store.reset();
  }, [store]);

  return {
    getValue,
    setValue,
    reset,
  };
}
