import React, { memo, useContext } from 'react';
import { useAtom } from 'jotai';
import { Label } from '../ui/label';
import { ApiFormContext } from './ApiForm';
import { AutoHeightTextarea } from '../ui/textarea';


interface TextAreaProps {
  id: string;
  placeholder?: string;
}

const TextArea = memo(({
  id,
  placeholder
}: TextAreaProps) => {
  const context = useContext(ApiFormContext);
  if (!context) throw new Error('ApiField must be used within ApiForm');

  const { store } = context;
  const [field, setField] = useAtom(store.fieldsAtom(id));

  return <>
    <AutoHeightTextarea
      id={id}
      value={field.value}
      onChange={(e) => setField({ ...field, value: e.target.value })}
      placeholder={placeholder}
      disabled={field.disabled}
    />
    {field.error && (
      <div className="text-sm text-red-500">{field.error}</div>
    )}
  </>
});

export interface ApiTextAreaProps extends TextAreaProps {
  id: string;
  label?: string;
  required?: boolean;
}

export const ApiTextArea = memo(({
  id,
  label,
  placeholder,
  required
}: ApiTextAreaProps) => {
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