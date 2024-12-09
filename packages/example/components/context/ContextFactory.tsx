import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';

type BaseStore = Record<string, any>;

interface Action<T> {
  type: string;
  field?: keyof T;
  payload?: any;
}

export function createStore<T extends BaseStore>(initialState: T) {
  // 为每个字段创建独立的 Context
  const FieldContexts = new Map<keyof T, React.Context<any>>();
  const DispatchContext = createContext<((action: Action<T>) => void) | null>(null);

  const getFieldContext = (field: keyof T) => {
    if (!FieldContexts.has(field)) {
      FieldContexts.set(field, createContext(initialState[field]));
    }
    return FieldContexts.get(field)!;
  };

  const Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useReducer(
      (state: T, action: Action<T>) => {
        switch (action.type) {
          case 'SET_FIELD':
            if (!action.field) return state;
            return {
              ...state,
              [action.field]: action.payload
            };
          default:
            return state;
        }
      },
      initialState
    );

    const dispatch = useCallback((action: Action<T>) => {
      setState(action);
    }, []);

    // 为每个字段创建独立的 Provider
    const providers = useMemo(() => {
      return Object.keys(state).reduce((acc, key) => {
        const Context = getFieldContext(key as keyof T);
        return (
          <Context.Provider value={state[key as keyof T]}>
            {acc}
          </Context.Provider>
        );
      }, children);
    }, [state]);

    return (
      <DispatchContext.Provider value={dispatch}>
        {providers}
      </DispatchContext.Provider>
    );
  };

  const useDispatch = () => {
    const dispatch = useContext(DispatchContext);
    if (!dispatch) throw new Error('useDispatch must be used within Provider');
    return dispatch;
  };

  const useFieldValue = <K extends keyof T>(field: K) => {
    const Context = getFieldContext(field);
    return useContext(Context);
  };

  return {
    Provider,
    useDispatch,
    useFieldValue
  };
}