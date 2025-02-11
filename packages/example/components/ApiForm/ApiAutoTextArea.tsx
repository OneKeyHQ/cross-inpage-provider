import React, { memo } from 'react';
import { Label } from '../ui/label';
import { AutoHeightTextarea } from '../ui/textarea';
import { useField } from './hooks/useField';

interface AutoTextAreaProps {
  id: string;
  placeholder?: string;
  label?: string;
  required?: boolean;
  maxHeight?: number;
}

const TextArea = memo(({ id, placeholder, label, required, maxHeight = 500 }: AutoTextAreaProps) => {
  const { field, setValue } = useField<string>({ id, name: label, required });

  return (
    <>
      <AutoHeightTextarea
        id={id}
        value={field.value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        disabled={field.disabled}
        className="min-h-10"
        maxHeight={maxHeight}
      />
      {field.error && <div className="text-sm text-red-500">{field.error}</div>}
    </>
  );
});

export interface ApiAutoTextAreaProps extends AutoTextAreaProps {
  id: string;
}

export const ApiAutoTextArea = memo(
  ({ id, label, placeholder, required }: ApiAutoTextAreaProps) => {
    return (
      <div>
        {label && (
          <Label htmlFor={id}>
            {label}
            {required && <span className="text-red-500">*</span>}
          </Label>
        )}
        <TextArea id={id} placeholder={placeholder} label={label} required={required} />
      </div>
    );
  },
);

ApiAutoTextArea.displayName = 'ApiAutoTextArea';
