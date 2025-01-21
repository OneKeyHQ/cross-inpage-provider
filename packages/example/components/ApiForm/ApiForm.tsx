/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { forwardRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { IFormField } from './types';
import { ApiFormProvider } from './ApiFormProvider';
import { useForm } from './hooks/useForm';

export interface ApiFormRef {
  reset: () => void;
  getField: <T = any>(id: string) => IFormField<T>;
  setField: (id: string, field: Partial<IFormField<any>>) => void;
  getValue: <T = any>(id: string) => T;
  setValue: (id: string, value: any) => void;
  setJsonValue: (id: string, value: any) => void;
  setError: (id: string, error: string) => void;
}

export interface ApiFormProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

const ApiResetButton = function ApiResetButton() {
  const { reset } = useForm();
  return (
    <Button variant="link" size="sm" onClick={() => reset()}>
      Rest 请求
    </Button>
  );
};

export const ApiForm = forwardRef<ApiFormRef, ApiFormProps>(function ApiForm(
  { title, description, children, className }: ApiFormProps,
  ref: React.Ref<ApiFormRef>,
) {
  return (
    <ApiFormProvider ref={ref}>
      <Card className={className}>
        <div className="flex justify-between">
          <div>
            <CardHeader className="text-xl font-medium searchable">{title}</CardHeader>
            {description && <CardDescription>{description}</CardDescription>}
          </div>

          <ApiResetButton />
        </div>
        <CardContent>
          <div className="space-y-4">{children}</div>
        </CardContent>
      </Card>
    </ApiFormProvider>
  );
});
