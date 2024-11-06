import React, { memo, useContext, useEffect } from 'react';
import { useAtom } from 'jotai';
import { Label } from '../ui/label';
import { ApiFormContext } from './ApiForm';
import JsonEditor from '../ui/jsonEditor';


interface JsonEditProps {
  id: string;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

const JsonEdit = memo(({
  id,
  placeholder,
  label,
  required
}: JsonEditProps) => {

  const context = useContext(ApiFormContext);
  if (!context) throw new Error('ApiField must be used within ApiForm');

  const { store } = context;
  const [field, setField] = useAtom(store.fieldsAtom(id));

  useEffect(() => {
    field.name = label;
    field.required = required;
  }, []);

  return <>
    <JsonEditor
      value={field.value ?? ''}
      onChange={(e) => setField({ ...field, value: e })}
      placeholder={placeholder}
    />
    {field.error && (
      <div className="text-sm text-red-500">{field.error}</div>
    )}
  </>
});

export interface ApiJsonEditProps extends JsonEditProps {
  id: string;
  label?: string;
  required?: boolean;
}

export const ApiJsonEdit = memo(({
  id,
  label,
  placeholder,
  required
}: ApiJsonEditProps) => {
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