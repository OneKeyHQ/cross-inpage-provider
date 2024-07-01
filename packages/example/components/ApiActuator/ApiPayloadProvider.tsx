import React, { createContext, useContext, useReducer, useMemo, useCallback } from 'react';
// @ts-expect-error
import perfectJson from 'perfect-json';
import { IPresupposeParam } from './PresupposeParamsSelector';

const RequestContext = createContext<string>('');
const ResultContext = createContext<string>('');
const ValidateResultContext = createContext<string>('');
const CurrentParamIdContext = createContext<string>('');
const PresupposeParamsContext = createContext<IPresupposeParam[] | undefined>(undefined);
const DispatchContext = createContext<React.Dispatch<ApiPayloadAction> | null>(null);

type ApiPayloadAction =
  | { type: 'SET_REQUEST'; payload: string }
  | { type: 'SET_RESULT'; payload: string }
  | { type: 'SET_VALIDATE_RESULT'; payload: string }
  | { type: 'SET_CURRENT_PARAM_ID'; payload: string }
  | { type: 'SET_PRESUPPOSE_PARAMS'; payload: IPresupposeParam[] };

// 优化 JSON 格式化函数
const tryFormatJson = (json: string) => {
  try {
    return JSON.stringify(JSON.parse(json), null, 2);
  } catch {
    return json;
  }
};

const tryFormatCompactJson = (json: string) => {
  try {
    const hasArray = /\[.*?\]/.test(json);
    const obj = JSON.parse(json);
    if (hasArray) {
      return perfectJson(obj, {
        // @ts-expect-error
        singleLine: ({ value }) => Array.isArray(value) && value.length > 10,
      });
    } else {
      return JSON.stringify(obj, null, 2);
    }
  } catch {
    return json;
  }
};

function apiPayloadReducer(state: ApiPayloadState, action: ApiPayloadAction): ApiPayloadState {
  switch (action.type) {
    case 'SET_REQUEST':
      return { ...state, request: tryFormatJson(action.payload) };
    case 'SET_RESULT':
      return { ...state, result: tryFormatCompactJson(action.payload) };
    case 'SET_VALIDATE_RESULT':
      return { ...state, validateResult: tryFormatJson(action.payload) };
    case 'SET_CURRENT_PARAM_ID':
      return { ...state, currentPurposeParamId: action.payload };
    case 'SET_PRESUPPOSE_PARAMS':
      return { ...state, presupposeParams: action.payload };
    default:
      return state;
  }
}

interface ApiPayloadState {
  request: string;
  result: string;
  validateResult: string;
  currentPurposeParamId: string;
  presupposeParams?: IPresupposeParam[];
}

interface IApiPayloadProviderProps {
  children: React.ReactNode;
}

export function ApiPayloadProvider({ children }: IApiPayloadProviderProps) {
  const [state, dispatch] = useReducer(apiPayloadReducer, {
    request: '',
    result: '',
    validateResult: '',
    currentPurposeParamId: '',
  });

  const memoizedDispatch = useCallback(dispatch, []);

  const requestValue = useMemo(() => state.request, [state.request]);
  const resultValue = useMemo(() => state.result, [state.result]);
  const validateResultValue = useMemo(() => state.validateResult, [state.validateResult]);
  const currentParamIdValue = useMemo(
    () => state.currentPurposeParamId,
    [state.currentPurposeParamId],
  );
  const presupposeParamsValue = useMemo(() => state.presupposeParams, [state.presupposeParams]);

  return (
    <DispatchContext.Provider value={memoizedDispatch}>
      <RequestContext.Provider value={requestValue}>
        <ResultContext.Provider value={resultValue}>
          <ValidateResultContext.Provider value={validateResultValue}>
            <CurrentParamIdContext.Provider value={currentParamIdValue}>
              <PresupposeParamsContext.Provider value={presupposeParamsValue}>
                {children}
              </PresupposeParamsContext.Provider>
            </CurrentParamIdContext.Provider>
          </ValidateResultContext.Provider>
        </ResultContext.Provider>
      </RequestContext.Provider>
    </DispatchContext.Provider>
  );
}

export function useApiPayload() {
  const dispatch = useContext(DispatchContext);
  if (!dispatch) {
    throw new Error('useApiPayload must be used within a ApiPayloadProvider');
  }

  return {
    request: useContext(RequestContext),
    result: useContext(ResultContext),
    validateResult: useContext(ValidateResultContext),
    currentPurposeParamId: useContext(CurrentParamIdContext),
    presupposeParams: useContext(PresupposeParamsContext),
    dispatch,
  };
}

export const useRequest = () => useContext(RequestContext);
export const useResult = () => useContext(ResultContext);
export const useValidateResult = () => useContext(ValidateResultContext);
export const useCurrentParamId = () => useContext(CurrentParamIdContext);
export const usePresupposeParams = () => useContext(PresupposeParamsContext);
export const useApiDispatch = () => {
  const dispatch = useContext(DispatchContext);
  if (!dispatch) {
    throw new Error('useApiDispatch must be used within a ApiPayloadProvider');
  }
  return dispatch;
};
