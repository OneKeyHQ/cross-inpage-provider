import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useWallet } from '../connect/WalletContext';
import { IApiExecutor, useApiExecutor } from './useApiExecutor';
import { IEthereumProvider } from '../chains/ethereum/types';
import { Card, CardContent, CardDescription, CardHeader } from '../ui/card';
import {
  IPresupposeParam,
  IPresupposeParamsSelectorProps,
  PresupposeParamsSelector,
} from './PresupposeParamsSelector';
import { IRequestEditorProps, RequestEditor, ResultTextArea } from './RequestEditor';
import { Button } from '../ui/button';
import {
  ApiPayloadProvider,
  useApiDispatch,
  useRequest,
  useResult,
  useValidateResult,
} from './ApiPayloadProvider';

export type IApiPayloadProps = {
  title: string;
  disableRequestContent?: boolean;
  description?: string;
  presupposeParams?: IPresupposeParam[];
} & IApiExecuteProps &
  IPresupposeParamsSelectorProps &
  Omit<IRequestEditorProps, 'resetRequest'>;

const InitPresupposeParams: FC<{ presupposeParams?: IPresupposeParam[] }> = ({
  presupposeParams,
}) => {
  const dispatch = useApiDispatch();

  useEffect(() => {
    dispatch({ type: 'SET_PRESUPPOSE_PARAMS', payload: presupposeParams });
  }, [presupposeParams, dispatch]);

  return null;
};

function ApiPayloadContent({
  title,
  description,
  presupposeParams,
  onExecute,
  onValidate,
  onPresupposeParamChange,
  generateRequestFrom,
  onGenerateRequest,
  allowCallWithoutProvider,
  disableRequestContent,
}: IApiPayloadProps) {
  return (
    <Card>
      <InitPresupposeParams presupposeParams={presupposeParams} />
      <CardHeader className="text-xl font-medium searchable">{title}</CardHeader>
      {description && <CardDescription>{description}</CardDescription>}

      <CardContent>
        <div className="flex flex-col gap-3">
          <PresupposeParamsSelector onPresupposeParamChange={onPresupposeParamChange} />

          <RequestEditor
            generateRequestFrom={generateRequestFrom}
            onGenerateRequest={onGenerateRequest}
            disableRequestContent={disableRequestContent}
          />

          <ApiExecute allowCallWithoutProvider={allowCallWithoutProvider} onExecute={onExecute} />

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
  timeout?: number;
} & IApiExecutor;

function ApiExecute({
  allowCallWithoutProvider,
  onExecute,
  onValidate,
  timeout = 60 * 1000,
}: IApiExecuteProps) {
  const { provider } = useWallet<IEthereumProvider>();
  const { execute } = useApiExecutor({ onExecute, onValidate });

  const request = useRequest();
  const dispatch = useApiDispatch();

  const [loading, setLoading] = useState(false);

  const handleSetResult = useCallback(
    (newResult: string) => {
      dispatch({ type: 'SET_RESULT', payload: newResult });
    },
    [dispatch],
  );

  const handleSetValidateResult = useCallback(
    (newResult: string) => {
      dispatch({ type: 'SET_VALIDATE_RESULT', payload: newResult });
    },
    [dispatch],
  );

  const handleExecute = useCallback(async () => {
    setLoading(true);
    handleSetResult('Calling...');
    handleSetValidateResult('');

    try {
      // @ts-expect-error
      const { result, error } = await Promise.race([
        execute(request),
        new Promise((_, rej) => setTimeout(() => rej(`call timeout ${timeout}ms`), timeout)),
      ]);
      if (error) {
        handleSetResult(`Error: ${error}`);
      } else {
        handleSetResult(result);
      }
    } catch (error) {
      console.log('execute error', error);

      handleSetResult(`Error: ${error}`);
    }
    setLoading(false);
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
  const request = useRequest();
  const result = useResult();
  const dispatch = useApiDispatch();

  const { validate } = useApiExecutor({ onExecute, onValidate });

  const handleSetValidateResult = useCallback(
    (newResult: string) => {
      dispatch({ type: 'SET_VALIDATE_RESULT', payload: newResult });
    },
    [dispatch],
  );

  const handleValidate = useCallback(async () => {
    handleSetValidateResult('Validating...');
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
  const result = useResult();

  return <ResultTextArea label="执行结果" content={result} />;
}

function ValidateResultDisplay() {
  const validateResult = useValidateResult();

  return <ResultTextArea label="验证结果" content={validateResult} />;
}
