import React, { memo } from 'react';
import { Switch } from '../ui/switch';
import { useField } from './hooks/useField';

export interface ApiSwitchProps {
  id: string;
  label?: string;
  defaultChecked?: boolean;
}

export const ApiSwitch = memo(({ id, label, defaultChecked }: ApiSwitchProps) => {
  const { field, setValue } = useField<boolean>({
    id,
    name: label,
    defaultValue: defaultChecked,
  });

  return (
    <div className="flex items-center gap-2">
      <Switch
        id={id}
        defaultChecked={defaultChecked}
        required={field.required}
        checked={field.value}
        onCheckedChange={(e) => setValue(e)}
        disabled={field.disabled}
      />

      <label
        htmlFor={id}
        className="p-0 m-0 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
      </label>

      {field.error && <div className="text-sm text-red-500">{field.error}</div>}
    </div>
  );
});

ApiSwitch.displayName = 'ApiSwitch';
