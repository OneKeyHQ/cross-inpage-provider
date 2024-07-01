import ChangeChain from './ChangeChain';
import { LogsContainer } from './LogsLayout';
import { WalletProvider } from './connect/WalletContext';
import { SearchContentProvider, useSearchContent } from './context/page/PagerContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './ui/resizable';
import SettingsMenu from './SettingsMenu';
import useSearch from '../hooks/useSearch';

export type IDappBookMark = {
  name: string;
  url: string;
};

export type IPageLayoutProps = {
  children?: React.ReactNode;
  title: string;
};

function SearchBar({ title }: { title: string }) {
  const { contentRef } = useSearchContent();
  const { searchTerm, setSearchTerm, matches, currentIndex, nextMatch } = useSearch(contentRef);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      nextMatch();
    }
  };

  const getMatchInfo = () => {
    if (!searchTerm) return '';
    if (matches.length > 0) return `${currentIndex + 1}/${matches.length}`;
    return 'Not found';
  };

  return (
    <div className="w-[40%] max-w-md relative">
      <Input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder={`${title} (Search Case Name)`}
        className="w-full pr-20 text-sm md:text-lg font-semibold"
      />
      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
        {getMatchInfo()}
      </span>
    </div>
  );
}

function PageContent({ children }: { children: React.ReactNode }) {
  const { contentRef } = useSearchContent();

  return (
    <WalletProvider>
      <div ref={contentRef} className="flex flex-col flex-grow p-3 gap-3">
        {children}
        <SettingsMenu />
      </div>
    </WalletProvider>
  );
}

function PageLayout({ children, title }: IPageLayoutProps) {
  return (
    <SearchContentProvider>
      <div className="flex min-h-screen flex-col">
        <div className="p-2 shadow-lg">
          <div className="mx-auto flex items-center justify-between">
            <Button
              variant="link"
              onClick={() => window.history.back()}
              className="text-lg font-semibold hover:underline"
            >
              {`< Back`}
            </Button>
            <SearchBar title={title} />
            <ChangeChain />
          </div>
        </div>

        <ResizablePanelGroup direction="vertical" className="flex-grow">
          <ResizablePanel className="overflow-auto flex">
            <PageContent>{children}</PageContent>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={5} className="overflow-auto flex">
            <div className=" bg-black flex-grow">
              <LogsContainer />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </SearchContentProvider>
  );
}

export default PageLayout;
