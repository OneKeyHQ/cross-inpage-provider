import React, { useEffect, useState } from 'react';
import { debounce } from 'lodash';
import { Input } from './ui/input';

export type IInputWithSaveProps = {
  storageKey: string;
  onChange: (value: string) => void;
  defaultValue?: string;
};

export function InputWithSave({ storageKey, onChange, defaultValue }: IInputWithSaveProps) {
  const [inputValue, setInputValue] = useState('');
  const debouncedChangeHandler = debounce((value: string) => {
    localStorage.setItem(storageKey, value);
    onChange(value);
  }, 300);

  useEffect(() => {
    const storedValue = localStorage.getItem(storageKey);
    if (storedValue) {
      setInputValue(storedValue);
      onChange(storedValue);
    } else {
      setInputValue(defaultValue || '');
      debouncedChangeHandler(defaultValue || '');
    }
  }, [debouncedChangeHandler, defaultValue, onChange, storageKey]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setInputValue(value);
    debouncedChangeHandler(value);
  };

  return (
    <Input
      key={storageKey}
      value={inputValue}
      className="w-full p-2 border border-gray-300 rounded-md"
      onChange={handleChange}
      placeholder="输入内容"
    />
  );
}
