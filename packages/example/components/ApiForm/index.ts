import { ApiForm } from './ApiForm';
import { ApiField } from './ApiField';
import { ApiButton } from './ApiButton';
import { ApiJsonEdit } from './ApiJsonEdit';
import { ApiSelector } from './ApiSelector';
import { ApiCheckbox } from './ApiCheckbox';
import { ApiTextArea } from './ApiTextArea';
import { ApiSwitch } from './ApiSwitch';
import { ApiCombobox } from './ApiCombobox';
import { ApiSeparator } from './ApiSeparator';

const Form = ApiForm as typeof ApiForm & {
  Field: typeof ApiField;
  Button: typeof ApiButton;
  JsonEdit: typeof ApiJsonEdit;
  Selector: typeof ApiSelector;
  Checkbox: typeof ApiCheckbox;
  TextArea: typeof ApiTextArea;
  Switch: typeof ApiSwitch;
  Combobox: typeof ApiCombobox;
  Separator: typeof ApiSeparator;
};

Form.Field = ApiField;
Form.Button = ApiButton;
Form.JsonEdit = ApiJsonEdit;
Form.Selector = ApiSelector;
Form.Checkbox = ApiCheckbox;
Form.TextArea = ApiTextArea;
Form.Switch = ApiSwitch;
Form.Combobox = ApiCombobox;
Form.Separator = ApiSeparator;

export { Form as ApiForm };
export type { ApiFormProps, ApiFormRef } from './ApiForm';
export type { ApiFieldProps } from './ApiField';
export type { ApiButtonProps } from './ApiButton';
export type { ApiJsonEditProps } from './ApiJsonEdit';
export type { ApiSelectorProps, ApiSelectorRef } from './ApiSelector';
export type { ApiCheckboxProps } from './ApiCheckbox';
export type { ApiTextAreaProps } from './ApiTextArea';
export type { ApiSwitchProps } from './ApiSwitch';
export type { ApiComboboxProps, ApiComboboxRef } from './ApiCombobox';