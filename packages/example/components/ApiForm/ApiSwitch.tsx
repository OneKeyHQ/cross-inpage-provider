import React, { memo, useContext, useEffect } from 'react';
import { useAtom } from 'jotai';
import { ApiFormContext } from './ApiForm';
import { Switch } from '../ui/switch';

export interface ApiSwitchProps {
  id: string;
  label?: string;
  defaultChecked?: boolean;
}

export const ApiSwitch = memo(({
  id,
  label,
  defaultChecked
}: ApiSwitchProps) => {
  const context = useContext(ApiFormContext);
  if (!context) throw new Error('ApiField must be used within ApiForm');

  const { store } = context;
  const [field, setField] = useAtom(store.fieldsAtom(id));

  useEffect(() => {
    field.name = label;
  }, []);

  useEffect(() => {
    if (defaultChecked) {
      setField({ ...field, value: defaultChecked });
    }
  }, []);

  return <div className="flex items-center gap-2">
    <Switch
      id={id}
      defaultChecked={defaultChecked}
      required={field.required}
      checked={field.value}
      onCheckedChange={(e) => setField({ ...field, value: e })}
      disabled={field.disabled}
    />

    <label
      htmlFor={id}
      className="p-0 m-0 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
    >
      {label}
    </label>

    {field.error && (
      <div className="text-sm text-red-500">{field.error}</div>
    )}
  </div>
});

ApiSwitch.displayName = 'ApiSwitch';