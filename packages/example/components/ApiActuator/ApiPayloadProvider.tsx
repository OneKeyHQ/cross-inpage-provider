import React, { createContext, useContext, useReducer, Dispatch } from 'react';

// 定义状态和动作的类型
interface ApiPayloadState {
  request: string;
  result: string;
  validateResult: string;
  currentPurposeParamId: string;
}

type ApiPayloadAction =
  | { type: 'SET_REQUEST'; payload: string }
  | { type: 'SET_RESULT'; payload: string }
  | { type: 'SET_VALIDATE_RESULT'; payload: string }
  | { type: 'SET_CURRENT_PARAM_ID'; payload: string };

// 创建 Context
const ApiPayloadContext = createContext<{
  state: ApiPayloadState;
  dispatch: Dispatch<ApiPayloadAction>;
} | null>(null);

function tryFormatJson(json: string) {
  try {
    return JSON.stringify(JSON.parse(json), null, 2);
  } catch (error) {
    return json;
  }
}

// Reducer 函数
function apiPayloadReducer(state: ApiPayloadState, action: ApiPayloadAction): ApiPayloadState {
  switch (action.type) {
    case 'SET_REQUEST':
      return { ...state, request: tryFormatJson(action.payload) };
    case 'SET_RESULT':
      return { ...state, result: tryFormatJson(action.payload) };
    case 'SET_VALIDATE_RESULT':
      return { ...state, validateResult: tryFormatJson(action.payload) };
    case 'SET_CURRENT_PARAM_ID':
      return { ...state, currentPurposeParamId: action.payload };
    default:
      return state;
  }
}

// Provider 组件
interface IApiPayloadProviderProps {
  children: React.ReactNode; // 假设你有这个类型定义好
}

export function ApiPayloadProvider({ children }: IApiPayloadProviderProps) {
  const [state, dispatch] = useReducer(apiPayloadReducer, {
    request: '',
    result: '',
    validateResult: '',
    currentPurposeParamId: '',
  });

  return (
    <ApiPayloadContext.Provider value={{ state, dispatch }}>{children}</ApiPayloadContext.Provider>
  );
}

// Hook to use the context
export function useApiPayload() {
  const context = useContext(ApiPayloadContext);
  if (!context) {
    throw new Error('useApiPayload must be used within a ApiPayloadProvider');
  }
  return context;
}
