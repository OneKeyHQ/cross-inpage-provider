import React from 'react';
import { FormStore } from '../store';
import { ApiFormRef } from '../ApiForm';

export interface ApiFormContextValue {
  store: FormStore;
  getFromApi: () => ApiFormRef | undefined;
}

export const ApiFormProviderContext = React.createContext<ApiFormContextValue | null>(null);

export const useFormContext = () => {
  const context = React.useContext(ApiFormProviderContext);
  if (!context) {
    throw new Error('useFormContext must be used within a ApiFormProvider');
  }
  return context;
};
