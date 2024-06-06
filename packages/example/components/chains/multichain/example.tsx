import { useEffect, useState } from 'react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '../../../components/ui/resizable';

function useResponsiveLayout() {
  const [direction, setDirection] = useState('horizontal');

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 768) {
        setDirection('vertical');
      } else {
        setDirection('horizontal');
      }
    }

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return direction;
}

export default function Example() {
  const direction = useResponsiveLayout();

  if (direction === 'horizontal') {
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

  return (
    <div className="flex min-h-screen">
      <ResizablePanelGroup direction="vertical" className="flex min--screen">
        <ResizablePanel className="overflow-auto flex min-h-[50vh]">
          <iframe src="/" style={{ width: '100%', height: '100%', border: 'none' }} />
        </ResizablePanel>
        <ResizablePanel className="overflow-auto flex min-h-[50vh]">
          <iframe src="/" style={{ width: '100%', height: '100%', border: 'none' }} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
