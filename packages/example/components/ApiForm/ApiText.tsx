import React, { memo, useContext } from 'react';
import { useAtom } from 'jotai';
import { ApiFormContext } from './ApiForm';
import { cn } from '../../lib/utils';

export interface ApiTextProps {
    id: string
    size?: 'sm' | 'md' | 'lg'
    type?: 'text' | 'error' | 'warning' | 'success' | 'info'
    hidden?: boolean
}

export const ApiText = memo(({
    id,
    size = 'md',
    type = 'text',
    hidden = false
}: ApiTextProps) => {
    const context = useContext(ApiFormContext);
    if (!context) throw new Error('ApiField must be used within ApiForm');

    const { store } = context;
    const [field] = useAtom(store.fieldsAtom(id));

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
        default:
            textColor = 'text-black';
            bgColor = 'bg-black';
    }

    if (field.value) {
        return <div className={cn(textSize, textColor, bgColor, 'p-2 rounded-md font-medium')}>{field.value}</div>
    }
    return null;
});

ApiText.displayName = 'ApiText';