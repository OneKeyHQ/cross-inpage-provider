import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo } from 'react';
import { Label } from '../ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command';
import { ChevronDownIcon, CheckIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useField } from './hooks/useField';
import { ApiFormRef } from './ApiForm';
import { useFormContext } from './hooks/useFormContext';

export interface IOption<T> {
  value: string;
  label: string;
  extra?: T;
  remark?: string;
}

export interface ApiComboboxProps<T = string> {
  id: string;
  label?: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
  requestOptionsKey?: string;
  onRequestOptions?: () => Promise<IOption<T>[]>;
  onValueChange?: (value: string | null, formRef: ApiFormRef | null | undefined) => void;
  onOptionChange?: (option: IOption<T> | null, formRef: ApiFormRef | null | undefined) => void;
}

export interface ApiComboboxRef<T = string> {
  getCurrentValue: () => string | undefined;
  getCurrentOption: () => IOption<T> | undefined;
  getOptions: () => IOption<T>[];
  setValue: (value: string) => void;
  setOptions: (options: IOption<T>[]) => void;
}

export const ApiCombobox = forwardRef(function ApiCombobox<T = string>(
  {
    id,
    label,
    required,
    defaultValue,
    placeholder,
    requestOptionsKey,
    onRequestOptions,
    onValueChange,
    onOptionChange,
  }: ApiComboboxProps<T>,
  ref: React.Ref<ApiComboboxRef<T>>,
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
    defaultValue,
  });

  const options = field?.extra?.options;
  const [open, setOpen] = React.useState(false);

  const getCurrentOption = useCallback(() => {
    return options?.find((opt) => opt.value === field.value);
  }, [options, field?.value]);

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
    setOptions([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestOptionsKey]);

  useEffect(() => {
    if (open && onRequestOptions && (options?.length == null || options?.length === 0)) {
      void onRequestOptions().then((options) => {
        setOptions(options);
      });
    }
  }, [open, onRequestOptions, options?.length, setOptions]);

  const setValue = useCallback(
    (value: string | null) => {
      setField(value);
      setOpen(false);
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
    <div className="flex flex-col">
      {label && (
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="truncate text-left break-all line-clamp-2">
              {currentOption?.value
                ? options.find((option) => option.value === currentOption?.value)?.label
                : placeholder}
            </span>
            <ChevronDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput placeholder={placeholder} className="h-9" />
            <CommandList>
              <CommandEmpty>没有找到选项</CommandEmpty>
              <CommandGroup>
                {options?.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    className="break-all"
                    onSelect={(currentLabel) => {
                      const currentOption = options?.find((opt) => opt.label === currentLabel);
                      setValue(currentOption?.value ?? null);
                    }}
                  >
                    {option.label}
                    <CheckIcon
                      className={cn(
                        'ml-auto h-4 w-4',
                        currentOption?.value === option.value ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {currentOption?.remark && (
        <span className="px-1 text-sm text-muted-foreground">{currentOption.remark}</span>
      )}
    </div>
  );
}) as <T>(
  props: ApiComboboxProps<T> & { ref?: React.Ref<ApiComboboxRef<T>> },
) => React.ReactElement;

// ApiCombobox.displayName = 'ApiCombobox';
