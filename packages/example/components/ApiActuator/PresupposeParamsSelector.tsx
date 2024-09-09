import { useCallback, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useApiDispatch, useCurrentParamId, usePresupposeParams } from './ApiPayloadProvider';

export type IPresupposeParam = {
  id: string;
  name: string;
  value: string;
  description?: string;
};

export type IPresupposeParamsSelectorProps = {
  onPresupposeParamChange?: (paramId: string) => void;
};

export function PresupposeParamsSelector({
  onPresupposeParamChange,
}: IPresupposeParamsSelectorProps) {
  const presupposeParams = usePresupposeParams();
  const currentPurposeParamId = useCurrentParamId();
  const dispatch = useApiDispatch();

  useEffect(() => {
    if (presupposeParams && presupposeParams.length > 0) {
      dispatch({ type: 'SET_CURRENT_PARAM_ID', payload: presupposeParams[0].id });
      onPresupposeParamChange?.(presupposeParams[0].id);
    }
  }, [dispatch, presupposeParams]);

  useEffect(() => {
    const params = presupposeParams?.find((param) => param.id === currentPurposeParamId);
    dispatch({ type: 'SET_REQUEST', payload: params?.value ?? '' });
  }, [currentPurposeParamId, dispatch, presupposeParams]);

  const handleSetCurrentPurposeParamId = useCallback(
    (newPurposeParamId: string) => {
      dispatch({ type: 'SET_CURRENT_PARAM_ID', payload: newPurposeParamId });
      onPresupposeParamChange?.(newPurposeParamId);
    },
    [dispatch],
  );

  const showPresupposeParams = presupposeParams && presupposeParams.length > 1;

  const presupposeParamsDescription = presupposeParams?.find((param) => param.id === currentPurposeParamId)?.description;

  return showPresupposeParams ? (
    <div className="flex flex-col gap-2">
      <span className="text-base font-medium">预设参数</span>
      <Select
        defaultValue={presupposeParams[0]?.id}
        value={currentPurposeParamId}
        onValueChange={handleSetCurrentPurposeParamId}
      >
        <SelectTrigger className="w-full">
          <SelectValue className="text-base font-medium" placeholder="选择参数" />
        </SelectTrigger>
        <SelectContent>
          {presupposeParams?.map((param) => (
            <SelectItem key={param.id} value={param.id} className="text-base font-medium">
              {param.name || param.description}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {
        presupposeParamsDescription &&
        <p className="px-2 text-base text-muted-foreground">
          {presupposeParamsDescription}
        </p>
      }
    </div>
  ) : null;
}
