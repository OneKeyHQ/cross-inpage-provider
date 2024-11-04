import React, { forwardRef, useCallback, useContext, useEffect, useImperativeHandle, useMemo } from 'react';
import { useAtom } from 'jotai';
import { ApiFormContext } from './ApiForm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';

interface IOption<T> {
  value: string;
  label: string;
  extra?: T;
  remark?: string;
}

export interface ApiSelectorProps<T = any> {
  id: string;
  label?: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
  onRequestOptions?: () => Promise<IOption<T>[]>
}

export interface ApiSelectorRef<T = any> {
  getCurrentValue: () => string | undefined;
  getCurrentOption: () => IOption<T> | undefined;
  getOptions: () => IOption<T>[];
  setValue: (value: string) => void;
}

export const ApiSelector = forwardRef<ApiSelectorRef, ApiSelectorProps>(function ApiSelector<T = any>(
  {
    id,
    label,
    required,
    defaultValue,
    placeholder,
    onRequestOptions
  }: ApiSelectorProps<T>,
  ref: React.Ref<ApiSelectorRef<T>>,
) {
  const context = useContext(ApiFormContext);
  if (!context) throw new Error('ApiField must be used within ApiForm');

  const { store } = context;
  const [field, setField] = useAtom(store.fieldsAtom(id));
  const options = field.extra?.options as IOption<T>[] | undefined;

  const getCurrentOption = useCallback(() => {
    return options?.find(opt => opt.value === field.value);
  }, [options, field.value]);

  const currentOption = useMemo(() => getCurrentOption(), [getCurrentOption]);

  const setOptions = useCallback((options: IOption<T>[]) => {
    setField({
      ...field, extra: {
        options: [...options]
      }
    });
  }, [setField]);

  useEffect(() => {
    if (defaultValue) {
      setField({ ...field, value: defaultValue });
    }
  }, []);

  useEffect(() => {
    if (onRequestOptions) {
      onRequestOptions().then((options) => {
        setOptions(options);
      });
    }
  }, [onRequestOptions]);


  useImperativeHandle(ref, () => ({
    setValue: (key: string | null) => setField({ ...field, value: key }),
    getCurrentValue: () => currentOption?.value,
    getCurrentOption: () => currentOption,
    getOptions: () => options,
    setOptions,
  }), [currentOption]);

  return <div>
    {label && (
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
    )}
    <Select
      defaultValue={defaultValue}
      value={field.value}
      onValueChange={(value) => setField({ ...field, value })}
    >
      {placeholder && (
        <SelectTrigger className="w-full">
          <SelectValue className="text-base font-medium" placeholder={placeholder} />
        </SelectTrigger>
      )}
      <SelectContent>
        {options?.map((option) => (
          <SelectItem key={option.value} value={option.value} className="text-base font-medium">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    {currentOption?.remark && (
      <span className="px-1 text-sm text-muted-foreground">
        {currentOption.remark}
      </span>
    )}
  </div>
});

ApiSelector.displayName = 'ApiSelector';