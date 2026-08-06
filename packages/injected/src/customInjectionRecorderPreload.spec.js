const fs = require('fs');
const path = require('path');

const ts = require('typescript');

function loadRecorderPreload() {
  const source = fs.readFileSync(path.join(__dirname, 'customInjectionRecorderPreload.ts'), 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2019,
    },
  }).outputText;
  const listeners = new Map();
  const sendToHost = jest.fn();
  const recorder = {
    markWalletPickerDetected: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(() => ({
      kind: 'onekey-connect-button-recording-capture',
      steps: [],
    })),
  };
  const stopWalletPickerObserver = jest.fn();
  const installCustomInjectionAutoReviewObserver = jest.fn(() => stopWalletPickerObserver);
  const ipcRenderer = {
    on: jest.fn((channel, listener) => {
      listeners.set(channel, listener);
    }),
    sendToHost,
  };
  const loadedModule = { exports: {} };
  const load = new Function('module', 'exports', 'require', output);
  load(loadedModule, loadedModule.exports, (moduleName) => {
    if (moduleName === 'electron') return { ipcRenderer };
    if (moduleName === './customInjectionRecorder') {
      return { installCustomInjectionRecorder: () => recorder };
    }
    if (moduleName === './customInjectionAutoReview') {
      return {
        createCustomInjectionRepositoryIcons: () => [],
        installCustomInjectionAutoReviewObserver,
      };
    }
    if (moduleName === '../../providers/inpage-providers-hub/dist/connectButtonHack/consts') {
      return { WALLET_CONNECT_INFO: {} };
    }
    throw new Error(`Unexpected module: ${moduleName}`);
  });
  return {
    installCustomInjectionAutoReviewObserver,
    ipcRenderer,
    listeners,
    recorder,
    sendToHost,
    stopWalletPickerObserver,
  };
}

describe('custom injection recorder preload', () => {
  const commandChannel = 'onekey@CUSTOM_INJECTION_RECORDING_COMMAND';
  const eventChannel = 'onekey@CUSTOM_INJECTION_RECORDING_EVENT';
  const token = 'recording-capability-token-1234';

  test('reports an error instead of silently ignoring stop in a new document', () => {
    const { listeners, recorder, sendToHost } = loadRecorderPreload();

    listeners.get(commandChannel)({}, { version: 1, token, action: 'stop' });

    expect(recorder.stop).not.toHaveBeenCalled();
    expect(sendToHost).toHaveBeenCalledWith(eventChannel, {
      version: 1,
      token,
      status: 'error',
      error: 'Custom injection recorder is not active in this document',
    });
  });

  test('starts and completes a matching recording', () => {
    const {
      installCustomInjectionAutoReviewObserver,
      listeners,
      recorder,
      sendToHost,
      stopWalletPickerObserver,
    } = loadRecorderPreload();
    const dispatch = listeners.get(commandChannel);

    dispatch({}, { version: 1, token, action: 'start' });
    installCustomInjectionAutoReviewObserver.mock.calls[0][0].onDetected();
    dispatch({}, { version: 1, token, action: 'stop' });

    expect(recorder.start).toHaveBeenCalledTimes(1);
    expect(recorder.markWalletPickerDetected).toHaveBeenCalledTimes(1);
    expect(recorder.stop).toHaveBeenCalledTimes(1);
    expect(stopWalletPickerObserver).toHaveBeenCalledTimes(1);
    expect(sendToHost).toHaveBeenLastCalledWith(
      eventChannel,
      expect.objectContaining({
        version: 1,
        token,
        status: 'completed',
      }),
    );
  });
});
