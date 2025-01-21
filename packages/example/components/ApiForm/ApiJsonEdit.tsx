import React, { memo } from 'react';
import { Label } from '../ui/label';
import JsonEditor from '../ui/jsonEditor';
import { useField } from './hooks/useField';

interface JsonEditProps {
  id: string;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

const JsonEdit = memo(({ id, placeholder, label, required }: JsonEditProps) => {
  const { field, setValue } = useField<string>({
    id,
    name: label,
    required,
  });

  return (
    <>
      <JsonEditor
        value={field?.value ?? ''}
        onChange={(e) => setValue(e)}
        placeholder={placeholder}
      />
      {field?.error && <div className="text-sm text-red-500">{field.error}</div>}
    </>
  );
});

export interface ApiJsonEditProps extends JsonEditProps {
  id: string;
  label?: string;
  required?: boolean;
}

export const ApiJsonEdit = memo(({ id, label, placeholder, required }: ApiJsonEditProps) => {
  return (
    <div>
      {label && (
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <JsonEdit id={id} placeholder={placeholder} />
    </div>
  );
});

ApiJsonEdit.displayName = 'ApiJsonEdit';
