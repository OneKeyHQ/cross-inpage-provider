import { useCallback } from 'react';
import { Button } from '../ui/button';
import { AutoHeightTextarea } from '../ui/textarea';
import { useApiPayload } from './ApiPayloadProvider';
import { toast } from '../ui/use-toast';

export type IRequestEditorProps = {
  disableRequestContent: boolean;
  resetRequest: () => void;
};
export function RequestEditor({ disableRequestContent, resetRequest }: IRequestEditorProps) {
  const { state, dispatch } = useApiPayload();
  const { request } = state;

  const handleSetRequest = useCallback(
    (newRequest: string) => {
      dispatch({ type: 'SET_REQUEST', payload: newRequest });
    },
    [dispatch],
  );

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-row justify-between items-end">
        <span className="text-base font-medium">
          请求{!disableRequestContent && <span>(可以手动编辑)</span>}
        </span>
        <Button variant="outline" size="sm" onClick={resetRequest}>
          Rest 请求
        </Button>
      </div>
      {disableRequestContent ? (
        <AutoHeightTextarea className="min-h-4" placeholder="Not Request" readOnly />
      ) : (
        <AutoHeightTextarea
          className="min-h-12"
          value={request ?? ''}
          placeholder="Request 信息"
          onChange={(e) => handleSetRequest(e.target.value)}
        />
      )}
    </div>
  );
}

export type IResultDisplayProps = {
  result: string | undefined;
  validateResult?: string;
};
export function ResultDisplay({ result, validateResult }: IResultDisplayProps) {
  return (
    <div className="flex flex-col gap-2">
      <ResultTextArea label="执行结果" content={result} />
      {validateResult !== undefined && <ResultTextArea label="验证结果" content={validateResult} />}
    </div>
  );
}

export type IResultTextAreaProps = {
  label: string;
  content: string | undefined;
};
export function ResultTextArea({ label, content }: IResultTextAreaProps) {
  return (
    <div className="flex flex-col">
      <div className="flex flex-row justify-between items-center">
        <span className="text-base font-medium">执行结果</span>
        <Button
          variant="link"
          size="sm"
          onClick={() => {
            navigator.clipboard
              .writeText(content ?? '')
              .then(() => {
                toast({
                  title: '复制成功',
                });
              })
              .catch((err) => {
                console.error('Failed to copy text: ', JSON.stringify(err));
              });
          }}
        >
          Copy
        </Button>
      </div>
      <AutoHeightTextarea
        value={content ?? ''}
        placeholder={`${label}展示在这里`}
        readOnly
        className="min-h-12"
      />
    </div>
  );
}
