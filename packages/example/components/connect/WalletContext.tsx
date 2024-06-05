import React, { createContext, useContext, useState, Context } from 'react';
import type { IAccountInfo } from './types';

interface WalletContextType<T> {
  provider: T | null;
  account: Partial<IAccountInfo> | null;
  setProvider: (provider: T | null) => void;
  setAccount: (account: Partial<IAccountInfo> | null) => void;
}

const WalletContext = createContext<WalletContextType<any> | undefined>(undefined);

export function useWallet<T>() {
  const context = useContext(WalletContext as Context<WalletContextType<T> | undefined>);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

export function WalletProvider<T>({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<T | null>(null);
  const [account, setAccount] = useState<Partial<IAccountInfo> | null>(null);

  return (
    <WalletContext.Provider
      value={{
        provider,
        account,
        setProvider,
        setAccount,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
