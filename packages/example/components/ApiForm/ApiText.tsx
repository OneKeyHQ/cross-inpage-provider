import React, { memo } from 'react';
import { cn } from '../../lib/utils';
import { useField } from './hooks/useField';
export interface ApiTextProps {
  id?: string;
  size?: 'sm' | 'md' | 'lg';
  type?: 'text' | 'error' | 'warning' | 'success' | 'info';
  hidden?: boolean;
  value?: string;
}

export const ApiText = memo(({ id, size = 'md', type = 'text', hidden = false, value }: ApiTextProps) => {
  const { field } = useField<string>({
    id,
    value,
  });

  if (hidden) return null;

  let textSize = '';
  switch (size) {
    case 'sm':
      textSize = 'text-sm';
      break;
    case 'md':
      textSize = 'text-base';
      break;
    case 'lg':
      textSize = 'text-lg';
      break;
  }

  let bgColor = '';
  let textColor = '';
  switch (type) {
    case 'error':
      textColor = 'text-black';
      bgColor = 'bg-red-100';
      break;
    case 'warning':
      textColor = 'text-black';
      bgColor = 'bg-yellow-100';
      break;
    case 'success':
      textColor = 'text-black';
      bgColor = 'bg-green-100';
      break;
    case 'info':
      textColor = 'text-black';
      bgColor = 'bg-gray-100';
      break;
    case 'text':
      textColor = 'text-black';
      bgColor = 'bg-white';
      break;
    default:
      textColor = 'text-black';
      bgColor = 'bg-white';
  }

  if (field.value) {
    return (
      <div className={cn(textSize, textColor, bgColor, 'p-1 rounded-md font-medium')}>
        {field?.value}
      </div>
    );
  }
  return null;
});

ApiText.displayName = 'ApiText';
