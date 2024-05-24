import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader } from './ui/card';
import { AutoHeightTextarea, Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { toast } from './ui/use-toast';
import { IEthereumProvider } from './chains/ethereum/types';
import { useWallet } from './connect/WalletContext';

export type IApiContainerProps = {
  title: string;
  children?: React.ReactNode;
};

export function ApiGroup({ title, children }: IApiContainerProps) {
  return (
    <div>
      <h2 className="text-2xl font-medium mt-4 mb-2">{title}</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 gap-3">
        {children}
      </div>
    </div>
  );
}

export type IPresupposeParam = {
  id: string;
  name: string;
  value: string;
  description?: string;
};

export type IApiPayloadProps = {
  title: string;
  disableRequestContent?: boolean;
  description?: string;
  presupposeParams?: IPresupposeParam[];
  onExecute: (request: string) => Promise<string>;
  onValidate?: (request: string, response: string) => Promise<string>;
  allowCallWithoutProvider?: boolean;
};

export function ApiPayload({
  title,
  description,
  presupposeParams,
  onExecute,
  allowCallWithoutProvider,
  disableRequestContent,
  onValidate,
}: IApiPayloadProps) {
  const [request, setRequest] = useState<string | undefined>(undefined);
  const [result, setResult] = useState<string | undefined>(undefined);
  const [validateResult, setValidateResult] = useState<string | undefined>(undefined);
  const [paramsDescription, setParamsDescription] = useState<string | undefined>(undefined);

  const { provider } = useWallet<IEthereumProvider>();

  const existsPresupposeParams = presupposeParams && presupposeParams.length > 0;
  const showPresupposeParams = presupposeParams && presupposeParams.length > 1;

  const setFormRequest = useCallback((request: string) => {
    try {
      setRequest(JSON.stringify(JSON.parse(request), null, 2));
    } catch (error) {
      setRequest(request);
    }
  }, []);

  const setFormResult = useCallback((request: string) => {
    try {
      setResult(JSON.stringify(JSON.parse(request), null, 2));
    } catch (error) {
      setResult(request);
    }
  }, []);

  const setFormValidateResult = useCallback((request: string) => {
    try {
      setValidateResult(JSON.stringify(JSON.parse(request), null, 2));
    } catch (error) {
      setValidateResult(request);
    }
  }, []);

  const setPresupposeParams = useCallback(
    (id: string) => {
      const param = presupposeParams?.find((param) => param.id === id);
      if (param) {
        setParamsDescription(param.description);
        setFormRequest(param.value);
      } else {
        setParamsDescription('');
        setFormRequest('');
      }
    },
    [presupposeParams, setFormRequest],
  );

  useEffect(() => {
    if (existsPresupposeParams) {
      const param = presupposeParams[0];
      setPresupposeParams(param.id);
    }
  }, [existsPresupposeParams, presupposeParams, setFormRequest, setPresupposeParams]);

  const resetRequest = useCallback(() => {
    setRequest('');
    setValidateResult('');

    const id = presupposeParams?.[0]?.id || '0';
    setPresupposeParams(id);
  }, [presupposeParams, setPresupposeParams]);

  return (
    <Card>
      <CardHeader className="text-xl font-medium">{title}</CardHeader>
      {description && <CardDescription>{description}</CardDescription>}

      <CardContent>
        <div className="flex flex-col gap-3">
          {showPresupposeParams && (
            <div className="flex flex-col gap-2">
              <span className="text-base font-medium">预设参数</span>
              <Select defaultValue={presupposeParams[0]?.id} onValueChange={setPresupposeParams}>
                <SelectTrigger className="w-full">
                  <SelectValue className="text-base font-medium" placeholder="选择参数" />
                </SelectTrigger>
                <SelectContent>
                  {presupposeParams?.map((param) => (
                    <SelectItem key={param.id} value={param.id} className="text-base font-medium">
                      {param.name || param.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {paramsDescription && <span className="text-base px-1">{paramsDescription}</span>}
            </div>
          )}

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
                onChange={(e) => {
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                  setRequest(e.target.value);
                }}
              />
            )}
          </div>

          <Button
            disabled={!provider && !allowCallWithoutProvider}
            onClick={() => {
              console.log('onExecute begin:', request);
              setFormResult(undefined);
              return onExecute?.(request)
                ?.then((res) => {
                  console.log('onExecute result:', res);
                  setFormResult(res ?? 'success');
                })
                ?.catch((err: any) => {
                  const message: string = err?.message ?? 'error';
                  setFormResult(`error: ${message}`);
                  console.log('onExecute error:', JSON.stringify(err));
                });
            }}
          >
            Call
          </Button>

          <div className="flex flex-col">
            <div className="flex flex-row justify-between items-center">
              <span className="text-base font-medium">执行结果</span>
              <Button
                variant="link"
                size="sm"
                onClick={() => {
                  navigator.clipboard
                    .writeText(result ?? '')
                    .then(() => {
                      toast({
                        title: 'Copied',
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
              value={result ?? ''}
              placeholder="执行结果展示在这里"
              readOnly
              className="min-h-12"
            />
          </div>

          {onValidate && (
            <>
              <Button
                disabled={!result}
                onClick={() => {
                  console.log('onValidate begin:', request);
                  setFormValidateResult(undefined);
                  return onValidate?.(request, result)
                    ?.then((res) => {
                      console.log('onValidate result:', res);
                      setFormValidateResult(res ?? 'success');
                    })
                    ?.catch((err: any) => {
                      const message: string = err?.message ?? 'error';
                      setFormValidateResult(`error: ${message}`);
                      console.log('onValidate error:', JSON.stringify(err));
                    });
                }}
              >
                Validate
              </Button>
              <div className="flex flex-col">
                <div className="flex flex-row justify-between items-center">
                  <span className="text-base font-medium">验证结果</span>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard
                        .writeText(validateResult ?? '')
                        .then(() => {
                          toast({
                            title: 'Copied',
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
                  value={validateResult ?? ''}
                  placeholder="验证结果展示在这里"
                  readOnly
                  className="min-h-12"
                />
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
