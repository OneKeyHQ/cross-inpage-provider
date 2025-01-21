import React, { memo } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useField } from './hooks/useField';

interface ApiInputProps {
  id: string;
  placeholder?: string;
  type?: 'text' | 'number' | 'password';
  hidden?: boolean;
  defaultValue?: string;
  label?: string;
  required?: boolean;
}

const ApiInput = memo(
  ({
    id,
    placeholder,
    type = 'text',
    hidden = false,
    defaultValue,
    label,
    required,
  }: ApiInputProps) => {
    const { field, setValue } = useField<string>({
      id,
      name: label,
      required,
      defaultValue,
    });

    return (
      <>
        <Input
          id={id}
          value={field?.value ?? ''}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          disabled={field?.disabled}
          type={type}
          hidden={hidden}
        />
        {field?.error && !hidden && <div className="text-sm text-red-500">{field.error}</div>}
      </>
    );
  },
);

export interface ApiFieldProps extends ApiInputProps {
  id: string;
  required?: boolean;
}

export const ApiField = memo(
  ({ id, label, placeholder, required, hidden = false, defaultValue, type }: ApiFieldProps) => {
    return (
      <div>
        {label && !hidden && (
          <Label htmlFor={id}>
            {label}
            {required && <span className="text-red-500">*</span>}
          </Label>
        )}
        <ApiInput
          id={id}
          placeholder={placeholder}
          type={type}
          hidden={hidden}
          defaultValue={defaultValue}
          label={label}
          required={required}
        />
      </div>
    );
  },
);

ApiField.displayName = 'ApiField';
