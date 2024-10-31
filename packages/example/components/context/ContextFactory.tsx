import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';

// 定义基础Store的类型
type BaseStore = Record<string, any>;

// Store上下文类型
export interface StoreContextType<T extends BaseStore> {
  state: T;
  dispatch: React.Dispatch<Partial<T>>;
}

// 创建Store的工厂函数
export function createStore<T extends BaseStore>(initialState: T) {
  const StoreContext = createContext<StoreContextType<T> | null>(null);

  // Reducer
  const reducer = (state: T, action: Partial<T>) => ({
    ...state,
    ...action,
  });

  // Provider组件
  const Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, initialState);

    const memoizedDispatch = useCallback(dispatch, []);
    const value = useMemo(() => ({ state, dispatch: memoizedDispatch }), [state, memoizedDispatch]);

    return (
      <StoreContext.Provider value={value}>
        {children}
      </StoreContext.Provider>
    );
  };

  // Hook
  const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) {
      throw new Error('useStore must be used within its Provider');
    }
    return context;
  };

  // 选择器Hook
  const useStoreSelector = <K extends keyof T>(key: K): [T[K], (value: T[K]) => void] => {
    const { state, dispatch } = useStore();
    const value = useMemo(() => state[key], [state, key]);

    const setValue = useCallback((newValue: T[K]) => {
      dispatch({ [key]: newValue } as unknown as Partial<T>);
    }, [dispatch, key]);

    return [value, setValue];
  };

  return {
    Provider,
    useStore,
    useStoreSelector,
  };
}