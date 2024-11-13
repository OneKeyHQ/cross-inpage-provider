import { useCallback } from 'react';
import type { FormStore } from '../store';
import { isEmpty } from 'lodash';

interface ValidationProps {
  store: FormStore<any>;
  validation?: {
    fields: string[];
    validator?: (values: Record<string, { id: string; value: string; required: boolean }>) => string | undefined;
  };
}

export const useValidation = ({ store, validation }: ValidationProps) => {
  // 获取所有需要验证的字段值
  const getFieldValues = useCallback(() => {
    if (!validation) return {};

    return validation.fields.reduce((acc, fieldId) => {
      const field = store.scope.get(store.fieldsAtom(fieldId));
      return {
        ...acc,
        [fieldId]: {
          id: fieldId,
          value: field.value,
          required: field.required,
        },
      };
    }, {} as Record<string, { id: string; value: string; required: boolean }>);
  }, [validation, store]);

  // 验证所有字段
  const validate = useCallback(() => {
    if (!validation) return { isValid: true };

    const values = getFieldValues();

    // 检查必填字段
    const hasEmptyRequired = validation.fields.some(
      (fieldId) => isEmpty(values[fieldId].value) && values[fieldId].required,
    );

    if (hasEmptyRequired) {
      return {
        isValid: false,
        error: `请填写 ${validation.fields
          .filter((fieldId) => isEmpty(values[fieldId].value) && values[fieldId].required)
          .join(', ')} 字段`,
      };
    }

    // 运行自定义验证
    if (validation.validator) {
      const error = validation.validator(values);
      return {
        isValid: !error,
        error,
      };
    }

    return { isValid: true };
  }, [validation, getFieldValues]);

  return {
    validate,
    getFieldValues,
  };
};
