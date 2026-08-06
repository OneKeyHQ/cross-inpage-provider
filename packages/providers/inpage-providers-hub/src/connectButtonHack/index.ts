import runWorkbenchAdapters from './generated/workbench-adapters/index.generated';
import universal from './universal/index';

function hackAllConnectButtons() {
  runWorkbenchAdapters();
  universal();
}

export { hackAllConnectButtons };
