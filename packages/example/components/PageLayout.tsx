import ChangeChain from './ChangeChain';
import { LogsContainer } from './LogsLayout';
import { WalletProvider } from './connect/WalletContext';
import { Button } from './ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './ui/resizable';

export type IDappBookMark = {
  name: string;
  url: string;
};

export type IPageLayoutProps = {
  children?: React.ReactNode;
  title: string;
};

function PageLayout({ children, title }: IPageLayoutProps) {
  return (
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
          <h3 className="text-xl font-bold ml-2">{title}</h3>
          <ChangeChain />
        </div>
      </div>

      <ResizablePanelGroup direction="vertical" className="flex-grow">
        <ResizablePanel className="overflow-auto flex">
          <WalletProvider>
            <div className="flex flex-col flex-grow p-3 gap-3">{children}</div>
          </WalletProvider>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={5} className="overflow-auto flex">
          <div className=" bg-black flex-grow">
            <LogsContainer />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

export default PageLayout;
