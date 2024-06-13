import React, { useEffect, useState, useCallback } from 'react';
import { debounce } from 'lodash';
import { Input } from './ui/input';

export type IInputWithSaveProps = {
  storageKey: string;
  onChange: (value: string) => void;
  type?: 'text' | 'number';
  defaultValue?: string;
};

export function InputWithSave({
  storageKey,
  onChange,
  defaultValue,
  type = 'text',
}: IInputWithSaveProps) {
  const [inputValue, setInputValue] = useState('');

  // 初始化时从 localStorage 中获取值
  useEffect(() => {
    const storedValue = localStorage.getItem(storageKey) || defaultValue || '';
    setInputValue(storedValue);
    onChange(storedValue);
  }, [storageKey, defaultValue, onChange]);

  // 使用 useCallback 来定义 debouncedChangeHandler
  const debouncedChangeHandler = useCallback(
    debounce((value: string) => {
      localStorage.setItem(storageKey, value);
      onChange(value);
    }, 300),
    [storageKey, onChange],
  );

  // 清除 debounce
  useEffect(() => {
    return () => debouncedChangeHandler.cancel();
  }, [debouncedChangeHandler]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setInputValue(value);
    debouncedChangeHandler(value);
  };

  return (
    <Input
      key={storageKey}
      type={type}
      value={inputValue}
      className="w-full p-2 border border-gray-300 rounded-md"
      onChange={handleChange}
      placeholder="输入内容"
    />
  );
}
