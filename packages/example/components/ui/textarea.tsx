import * as React from 'react';

import { cn } from '../../lib/utils';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = 'Textarea';

export type AutoHeightTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const AutoHeightTextarea: React.FC<AutoHeightTextareaProps> = (props) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const adjustHeight = React.useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; // 重置高度允许缩小
      textarea.style.height = `${textarea.scrollHeight}px`; // 设置新高度基于内容高度
    }
  }, []);

  React.useEffect(() => {
    adjustHeight();
  }, [adjustHeight, props.value]); // 当value改变时调整高度

  return (
    <Textarea
      {...props}
      ref={textareaRef}
      onInput={adjustHeight}
      style={{ ...props.style, overflow: 'hidden' }}
    />
  );
};

export { Textarea, AutoHeightTextarea };
