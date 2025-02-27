import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { useField } from './hooks/useField';
import { ApiFormRef } from './ApiForm';
import { useFormContext } from './hooks/useFormContext';

interface IOption<T> {
  value: string;
  label: string;
  extra?: T;
  remark?: string;
}

export interface ApiSelectorProps<T = string> {
  id: string;
  label?: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
  onRequestOptions?: () => Promise<IOption<T>[]>;
  onValueChange?: (value: string | null, formRef: ApiFormRef | null | undefined) => void;
  onOptionChange?: (option: IOption<T> | null, formRef: ApiFormRef | null | undefined) => void;
}

export interface ApiSelectorRef<T = string> {
  getCurrentValue: () => string | undefined;
  getCurrentOption: () => IOption<T> | undefined;
  getOptions: () => IOption<T>[];
  setValue: (value: string) => void;
}

export const ApiSelector = forwardRef<ApiSelectorRef, ApiSelectorProps>(function ApiSelector<
  T = string,
>(
  {
    id,
    label,
    required,
    defaultValue,
    placeholder,
    onRequestOptions,
    onValueChange,
    onOptionChange,
  }: ApiSelectorProps<T>,
  ref: React.Ref<ApiSelectorRef<T>>,
) {
  const {
    getFromApi,
    field,
    setValue: setField,
    setExtra,
  } = useField<string, { options: IOption<T>[] | undefined }>({
    id,
    name: label,
    required,
  });
  const options = field.extra?.options;

  const getCurrentOption = useCallback(() => {
    return options?.find((opt) => opt.value === field.value);
  }, [options, field.value]);

  const currentOption = useMemo(() => getCurrentOption(), [getCurrentOption]);

  const setOptions = useCallback(
    (options: IOption<T>[]) => {
      setExtra({
        options,
      });
    },
    [setExtra],
  );

  useEffect(() => {
    if (onRequestOptions) {
      void onRequestOptions().then((options) => {
        setOptions(options);
      });
    }
  }, [onRequestOptions, setOptions]);

  const setValue = useCallback(
    (value: string | null) => {
      setField(value);
      onValueChange?.(value, getFromApi());
      onOptionChange?.(options?.find((opt) => opt.value === value) ?? null, getFromApi());
    },
    [setField, onValueChange, getFromApi, onOptionChange, options],
  );

  useImperativeHandle(
    ref,
    () => ({
      setValue,
      getCurrentValue: () => currentOption?.value,
      getCurrentOption: () => currentOption,
      getOptions: () => options,
      setOptions,
    }),
    [currentOption, options, setOptions, setValue],
  );

  return (
    <div>
      {label && (
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <Select defaultValue={defaultValue} value={field.value} onValueChange={setValue}>
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
        <span className="px-1 text-sm text-muted-foreground">{currentOption.remark}</span>
      )}
    </div>
  );
});

ApiSelector.displayName = 'ApiSelector';
