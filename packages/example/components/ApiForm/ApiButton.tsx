import React, { memo, useContext, useCallback, useMemo, useEffect } from 'react';
import { useAtom } from 'jotai';
import { Button } from '../ui/button';
import { ApiFormContext } from './ApiForm';
import { useValidation } from './hooks/useValidation';
import { get, isEmpty } from 'lodash';
import { toast } from '../ui/use-toast';

export interface ApiButtonProps {
    id: string;
    label: string;
    onClick: () => Promise<void>;
    validation?: {
        fields: string[];
        validator?: (values: Record<string, { id: string; value: string; required: boolean }>) => string | undefined;
    };
    availableDependencyFields?: string[];
}

export const ApiButton = memo(({
    id,
    label,
    onClick,
    validation,
    availableDependencyFields,
}: ApiButtonProps) => {
    const context = useContext(ApiFormContext);
    if (!context) throw new Error('ApiButton must be used within ApiForm');

    const { store } = context;
    const [field, setField] = useAtom(store.fieldsAtom(id));

    const loading = field.extra?.loading ?? false;
    const result = field.extra?.result;

    useEffect(() => {
        field.name = label;
    }, []);

    const dependencyStates = availableDependencyFields?.map(fieldId => {
        const [field] = useAtom(store.fieldsAtom(fieldId));
        return {
            id: fieldId,
            value: field.value,
            name: field.name
        };
    }) ?? [];

    const disabledTooltip = useMemo(() => {
        const filterFields = dependencyStates.filter(field =>
            (field.value == null || isEmpty(field.value))
        );

        if (filterFields.length > 0) {
            return `请填写 ${filterFields.map(field => field.name ?? field.id).join(', ')}`;
        }
        return null;
    }, [dependencyStates]);

    const setResult = (value: string) => {
        setField({ ...field, extra: { ...field.extra, result: value } });
    }

    const setLoading = (value: boolean) => {
        setField({ ...field, extra: { ...field.extra, loading: value } });
    }

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
                disabled={disabledTooltip != null}
                loading={loading}
            >
                {label}
            </Button>
            {disabledTooltip && <div className="text-red-500 text-sm">{disabledTooltip}</div>}
            {result && <div className="text-red-500 text-sm">{result}</div>}
        </div>
    );
});

ApiButton.displayName = 'ApiButton';