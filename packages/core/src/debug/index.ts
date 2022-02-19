import setup from './common';
import browser from './browser';

async function createDebugAsync() {
  return setup(browser);
}

export default createDebugAsync;
