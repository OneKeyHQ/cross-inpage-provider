import React, { memo, useContext, useEffect } from 'react';
import { useAtom } from 'jotai';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ApiFormContext } from './ApiForm';


interface ApiInputProps {
  id: string;
  placeholder?: string;
  type?: 'text' | 'number' | 'password';
  hidden?: boolean;
  defaultValue?: string;
  label?: string;
  required?: boolean;
}

const ApiInput = memo(({
  id,
  placeholder,
  type = 'text',
  hidden = false,
  defaultValue,
  label,
  required
}: ApiInputProps) => {

  const context = useContext(ApiFormContext);
  if (!context) throw new Error('ApiField must be used within ApiForm');

  const { store } = context;
  const [field, setField] = useAtom(store.fieldsAtom(id));

  useEffect(() => {
    if (defaultValue) {
      setField({ ...field, value: defaultValue });
    }
    field.name = label;
    field.required = required;
  }, []);

  return <>
    <Input
      id={id}
      value={field.value}
      defaultValue={defaultValue}
      onChange={(e) => setField({ ...field, value: e.target.value })}
      placeholder={placeholder}
      disabled={field.disabled}
      type={type}
      hidden={hidden}
    />
    {field.error && !hidden && (
      <div className="text-sm text-red-500">{field.error}</div>
    )}
  </>
});

export interface ApiFieldProps extends ApiInputProps {
  id: string;
  required?: boolean;
}

export const ApiField = memo(({
  id,
  label,
  placeholder,
  required,
  hidden = false,
  defaultValue
}: ApiFieldProps) => {

  return (
    <div>
      {label && !hidden && (
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <ApiInput id={id} placeholder={placeholder} hidden={hidden} defaultValue={defaultValue} label={label} required={required} />
    </div>
  );
});

ApiField.displayName = 'ApiField';