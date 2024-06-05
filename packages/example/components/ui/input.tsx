/* eslint-disable @typescript-eslint/no-empty-interface */
import * as React from 'react';

import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, ...props }, ref) => {
    const renderInput = () => {
      return (
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
          ref={ref}
          {...props}
        />
      );
    };

    if (label) {
      return (
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">{label}</span>
          {renderInput()}
        </label>
      );
    } else {
      return renderInput();
    }
  },
);
Input.displayName = 'Input';

export { Input };
