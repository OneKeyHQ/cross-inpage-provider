import React, { memo, useContext, useCallback } from 'react';
import { useAtom } from 'jotai';
import { Button } from '../ui/button';
import { ApiFormContext } from './ApiForm';
import { useValidation } from './hooks/useValidation';
import { get } from 'lodash';
import { toast } from '../ui/use-toast';

export interface ApiButtonProps {
    id: string;
    label: string;
    onClick: () => Promise<void>;
    validation?: {
        fields: string[];
        validator?: (values: Record<string, { id: string; value: string; required: boolean }>) => string | undefined;
    };
}

export const ApiButton = memo(({
    id,
    label,
    onClick,
    validation
}: ApiButtonProps) => {
    const context = useContext(ApiFormContext);
    if (!context) throw new Error('ApiButton must be used within ApiForm');

    const { store } = context;
    const [field, setField] = useAtom(store.fieldsAtom(id));

    const loading = field.extra?.loading ?? false;
    const result = field.extra?.result;

    const setResult = (value: string) => {
        setField({ ...field, extra: { ...field.extra, result: value } });
    };

    const setLoading = (value: boolean) => {
        setField({ ...field, extra: { ...field.extra, loading: value } });
    };

    const { validate } = useValidation({
        store,
        validation
    });

    const handleClick = useCallback(async () => {
        setResult(undefined);

        const { isValid, error } = validate();
        if (!isValid) {
            setResult(error || '验证失败');
            return;
        }

        try {
            setLoading(true);
            await onClick();
        } catch (error) {
            const errorMessage = get(error, 'message', 'error') ?? JSON.stringify(error);
            toast({
                title: '执行失败',
                description: errorMessage,
                variant: 'destructive',
            });
            setResult(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [onClick, validate, setLoading, setResult]);

    return (
        <div className="flex flex-col gap-1">
            <Button
                key={id}
                onClick={handleClick}
                disabled={loading}
                loading={loading}
            >
                {label}
            </Button>
            {result && <div className="text-red-500 text-sm">{result}</div>}
        </div>
    );
});

ApiButton.displayName = 'ApiButton';