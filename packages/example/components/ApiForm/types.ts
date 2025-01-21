export interface IFormField<T, E = string | undefined> {
  value?: T;
  defaultValue?: T;
  name?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  extra?: E;
}

export interface IApiFormState<T> {
  fields: Record<string, IFormField<T>>;
  loading: boolean;
  result: string;
}

// 新增: 验证规则类型
export interface IValidationRule {
  fields: string[]; // 需要验证的字段
  validator?: (values: Record<string, string>) => string | undefined; // 自定义验证函数
}
