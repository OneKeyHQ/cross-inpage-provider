import React, { useCallback, useState } from 'react';
import { useWallet } from '../connect/WalletContext';
import { useApiExecutor } from './useApiExecutor';
import { IEthereumProvider } from '../chains/ethereum/types';
import { Card, CardContent, CardDescription, CardHeader } from '../ui/card';
import {
  IPresupposeParamsSelectorProps,
  PresupposeParamsSelector,
} from './PresupposeParamsSelector';
import { IRequestEditorProps, RequestEditor, ResultDisplay } from './RequestEditor';
import { Button } from '../ui/button';
import { ApiPayloadProvider, useApiPayload } from './ApiPayloadProvider';

export type IApiPayloadProps = {
  title: string;
  disableRequestContent?: boolean;
  description?: string;
} & IApiExecuteProps &
  IPresupposeParamsSelectorProps &
  Omit<IRequestEditorProps, 'resetRequest'>;

function ApiPayloadContent({
  title,
  description,
  presupposeParams,
  onExecute,
  onValidate,
  generateRequestFrom,
  onGenerateRequest,
  allowCallWithoutProvider,
  disableRequestContent,
}: IApiPayloadProps) {
  const { dispatch } = useApiPayload();

  const handleSetRequest = useCallback(
    (newRequest: string) => {
      dispatch({ type: 'SET_REQUEST', payload: newRequest });
    },
    [dispatch],
  );

  return (
    <Card>
      <CardHeader className="text-xl font-medium">{title}</CardHeader>
      {description && <CardDescription>{description}</CardDescription>}

      <CardContent>
        <div className="flex flex-col gap-3">
          <PresupposeParamsSelector presupposeParams={presupposeParams} />

          <RequestEditor
            generateRequestFrom={generateRequestFrom}
            onGenerateRequest={onGenerateRequest}
            disableRequestContent={disableRequestContent}
            resetRequest={() => handleSetRequest(presupposeParams?.[0]?.value)}
          />

          <ApiExecute
            allowCallWithoutProvider={allowCallWithoutProvider}
            onExecute={onExecute}
            onValidate={onValidate}
          />

          <ExecuteResultDisplay />

          {onValidate && (
            <>
              <ApiExecuteValidate onExecute={onExecute} onValidate={onValidate} />
              <ValidateResultDisplay />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ApiPayload(props: IApiPayloadProps) {
  return (
    <ApiPayloadProvider>
      <ApiPayloadContent {...props} />
    </ApiPayloadProvider>
  );
}

export type IApiExecuteProps = {
  allowCallWithoutProvider?: boolean;
  onExecute: (request: string) => Promise<string>;
  onValidate?: (request: string, response: string) => Promise<string>;
};

function ApiExecute({ allowCallWithoutProvider, onExecute, onValidate }: IApiExecuteProps) {
  const { provider } = useWallet<IEthereumProvider>();
  const { execute } = useApiExecutor({ onExecute, onValidate });

  const { state, dispatch } = useApiPayload();
  const { request } = state;

  const [loading, setLoading] = useState(false);

  const handleSetResult = useCallback(
    (newResult: string) => {
      dispatch({ type: 'SET_RESULT', payload: newResult });
    },
    [dispatch],
  );

  const handleExecute = useCallback(async () => {
    setLoading(true);
    const { result, error } = await execute(request);
    setLoading(false);
    if (error) {
      handleSetResult(`Error: ${error}`);
    } else {
      handleSetResult(result);
    }
  }, [execute, request, handleSetResult]);

  return (
    <Button
      loading={loading}
      disabled={!provider && !allowCallWithoutProvider}
      onClick={handleExecute}
    >
      Call
    </Button>
  );
}

function ApiExecuteValidate({ onExecute, onValidate }: IApiExecuteProps) {
  const { state, dispatch } = useApiPayload();
  const { request, result } = state;

  const { validate } = useApiExecutor({ onExecute, onValidate });

  const handleSetValidateResult = useCallback(
    (newResult: string) => {
      dispatch({ type: 'SET_VALIDATE_RESULT', payload: newResult });
    },
    [dispatch],
  );

  const handleValidate = useCallback(async () => {
    const { validation, error } = await validate(request, result);
    if (error) {
      handleSetValidateResult(`Error: ${error}`);
    } else {
      handleSetValidateResult(validation);
    }
  }, [validate, request, result, handleSetValidateResult]);

  return (
    <Button disabled={!result} onClick={handleValidate}>
      Validate
    </Button>
  );
}

function ExecuteResultDisplay() {
  const { state } = useApiPayload();
  const { result } = state;

  return <ResultDisplay result={result} />;
}

function ValidateResultDisplay() {
  const { state } = useApiPayload();
  const { validateResult } = state;

  return <ResultDisplay result={validateResult} />;
}
