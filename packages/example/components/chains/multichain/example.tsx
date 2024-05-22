import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../../../components/ui/resizable';
export default function Example() {
  return (
    <div className="flex min-h-screen">
      <ResizablePanelGroup direction="horizontal" className="flex min-h-screen">
        <ResizablePanel className="overflow-auto flex min-h-screen">
          <iframe src="/" style={{ width: '100%', height: '100%', border: 'none' }} />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel className="overflow-auto flex min-h-screen">
          <iframe src="/" style={{ width: '100%', height: '100%', border: 'none' }} />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel className="overflow-auto flex min-h-screen">
          <iframe src="/" style={{ width: '100%', height: '100%', border: 'none' }} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
