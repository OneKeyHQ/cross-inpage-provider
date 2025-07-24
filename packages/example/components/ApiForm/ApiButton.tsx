import React, { memo, useCallback, useMemo } from 'react';
import { useAtom } from 'jotai';
import { Button } from '../ui/button';
import { get, isEmpty } from 'lodash';
import { toast } from '../ui/use-toast';
import { useFormContext } from './hooks/useFormContext';
import { useField } from './hooks/useField';
import { IFormField } from './types';
import { ApiFormRef } from './ApiForm';

export interface ApiButtonProps {
  id: string;
  label: string;
  disabled?: boolean;
  onClick: (
    form: ApiFormRef | null | undefined,
    values: Record<string, IFormField<any>>,
  ) => Promise<void>;
  validation?: {
    fields: string[];
    validator?: (values: Record<string, IFormField<any>>) => string | undefined;
  };
  availableDependencyFields?: {
    fieldIds?: string[];
    required?: () =>
      | {
          errorMessage?: string;
        }
      | undefined;
  }[];
}

export const ApiButton = memo(
  ({ id, label, onClick, validation, availableDependencyFields, disabled}: ApiButtonProps) => {
    const context = useFormContext();
    if (!context) throw new Error('ApiButton must be used within ApiForm');

    const { store, getFromApi } = context;
    const { field, setExtra } = useField<string, { loading: boolean; result: string }>({
      id,
      name: label,
    });

    const loading = field?.extra?.loading ?? false;
    const result = field?.extra?.result;

    // 使用 useMemo 缓存依赖字段ID数组
    const dependencyFieldIds = useMemo(() => {
      if (!availableDependencyFields?.length) return [];

      return Array.from(
        availableDependencyFields.reduce((acc, field) => {
          field.fieldIds.forEach((fieldId) => {
            acc.add(fieldId);
          });
          return acc;
        }, new Set<string>()),
      );
    }, [availableDependencyFields]);

    // 使用缓存的依赖字段ID数组
    const [dependencyStates] = useAtom(
      useMemo(() => store.fieldsAtom(dependencyFieldIds), [store, dependencyFieldIds]),
    );

    const disabledTooltip = useMemo(() => {
      const filterEmptyFields = dependencyStates.filter(
        (field) => field?.value == null || isEmpty(field?.value),
      );

      // 检查是否有任意一组依赖字段全部填写完整
      const hasValidDependencyGroup = availableDependencyFields?.some((field) => {
        // 检查这组字段是否都已填写（即没有出现在 filterEmptyFields 中）
        const everyFilled = field.fieldIds.every((fieldId) => {
          return !filterEmptyFields.some((f) => f.id === fieldId);
        });
        // 没有依赖的错误信息
        const requiredError = field.required?.()?.errorMessage == null;

        return everyFilled && requiredError;
      });

      // 如果有任意一组依赖字段全部填写完整，返回 null（允许点击）
      if (hasValidDependencyGroup) {
        return null;
      }

      // 生成分组提示信息
      if (availableDependencyFields?.length > 0) {
        const groupMessages = availableDependencyFields
          .map((group) => {
            const required = group.required?.();
            if (required?.errorMessage) {
              return required.errorMessage;
            }

            const emptyFieldsInGroup = group.fieldIds
              .map((fieldId) => dependencyStates.find((f) => f.id === fieldId))
              .filter((field) => field && (field.value == null || isEmpty(field.value)))
              .map((field) => field.name ?? field.id);

            if (emptyFieldsInGroup.length === 0) return null;
            return `(${emptyFieldsInGroup.join(' 和 ')})`;
          })
          .filter(Boolean);

        if (groupMessages.length > 0) {
          return `请填写: ${groupMessages.join(' 或 ')}`;
        }
      }

      return null;
    }, [availableDependencyFields, dependencyStates]);

    const setResult = useCallback(
      (value: string) => {
        setExtra({ ...field?.extra, result: value });
      },
      [field?.extra, setExtra],
    );

    const setLoading = useCallback(
      (value: boolean) => {
        setExtra({ ...field?.extra, loading: value });
      },
      [field?.extra, setExtra],
    );

    const handleClick = useCallback(async () => {
      setResult(undefined);

      let isValid = true;
      let validError = '';

      // 运行自定义验证
      if (validation?.validator) {
        const fields = store.fieldsAtom(validation?.fields);
        const fieldValues = store.scope.get(fields)?.reduce((acc, field) => {
          acc[field.id] = field;
          return acc;
        }, {} as Record<string, IFormField<any>>);

        const hasEmptyRequired = validation.fields.some(
          (fieldId) => isEmpty(fieldValues[fieldId]?.value) && !!fieldValues[fieldId]?.required,
        );

        if (hasEmptyRequired) {
          isValid = false;
          validError = `请填写 ${validation.fields
            .filter(
              (fieldId) => isEmpty(fieldValues[fieldId]?.value) && !!fieldValues[fieldId]?.required,
            )
            .join(', ')} 字段`;
        }

        if (!isValid) {
          setResult(validError || '验证失败');
          return;
        }

        const error = validation.validator(fieldValues);
        isValid = !error;
        validError = error;
      }

      if (!isValid) {
        setResult(validError || '验证失败');
        return;
      }

      try {
        setLoading(true);
        const allFields = store.allFieldsAtom();
        const fieldValues = store.scope.get(allFields)?.reduce((acc, field) => {
          acc[field.id] = field;
          return acc;
        }, {} as Record<string, IFormField<any>>);
        await onClick(getFromApi(), fieldValues);
      } catch (error) {
        const errorMessage = get(error, 'message', 'error') ?? JSON.stringify(error);
        toast({
          title: '执行失败',
          description: errorMessage,
          variant: 'destructive',
        });
        setResult(errorMessage);
      } finally {
        setLoading(false);
      }
    }, [setResult, validation, store, setLoading, onClick, getFromApi]);

    return (
      <div className="flex flex-col gap-1">
        <Button key={id} onClick={handleClick} disabled={disabledTooltip != null || disabled} loading={loading}>
          {label}
        </Button>
        {disabledTooltip && <div className="text-red-500 text-sm">{disabledTooltip}</div>}
        {result && <div className="text-red-500 text-sm">{result}</div>}
      </div>
    );
  },
);

ApiButton.displayName = 'ApiButton';
