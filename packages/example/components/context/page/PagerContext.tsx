import React, { createContext, useContext, useRef } from 'react';

interface ISearchContentContextType {
  contentRef: React.RefObject<HTMLDivElement>;
}

const SearchContentContext = createContext<ISearchContentContextType | undefined>(undefined);

export function useSearchContent() {
  const context = useContext(SearchContentContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

export function SearchContentProvider({ children }: { children: React.ReactNode }) {
  const contentRef = useRef<HTMLDivElement>();

  return (
    <SearchContentContext.Provider
      value={{
        contentRef,
      }}
    >
      {children}
    </SearchContentContext.Provider>
  );
}
