import React, { memo } from 'react';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useField } from './hooks/useField';

interface TextAreaProps {
  id: string;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

const TextArea = memo(({ id, placeholder, label, required }: TextAreaProps) => {
  const { field, setValue } = useField<string>({
    id,
    name: label,
    required,
  });

  return (
    <>
      <Textarea
        id={id}
        value={field?.value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        disabled={field?.disabled}
        style={{ overflow: 'hidden' }}
      />
      {field?.error && <div className="text-sm text-red-500">{field.error}</div>}
    </>
  );
});

export interface ApiTextAreaProps extends TextAreaProps {
  id: string;
  label?: string;
  required?: boolean;
}

export const ApiTextArea = memo(({ id, label, placeholder, required }: ApiTextAreaProps) => {
  return (
    <div>
      {label && (
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <TextArea id={id} placeholder={placeholder} />
    </div>
  );
});

ApiTextArea.displayName = 'ApiTextArea';
