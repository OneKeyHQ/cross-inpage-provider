import { ipcRenderer } from 'electron';

import { WALLET_CONNECT_INFO } from '../../providers/inpage-providers-hub/dist/connectButtonHack/consts';

import {
  createCustomInjectionRepositoryIcons,
  installCustomInjectionAutoReviewObserver,
} from './customInjectionAutoReview';
import { installCustomInjectionRecorder } from './customInjectionRecorder';

export const CUSTOM_INJECTION_RECORDING_COMMAND_CHANNEL =
  'onekey@CUSTOM_INJECTION_RECORDING_COMMAND';
export const CUSTOM_INJECTION_RECORDING_EVENT_CHANNEL = 'onekey@CUSTOM_INJECTION_RECORDING_EVENT';

type IRecordingCommand = {
  version: 1;
  token: string;
  action: 'start' | 'stop';
};

function parseCommand(value: unknown): IRecordingCommand | null {
  const command = value as Partial<IRecordingCommand> | null;
  if (
    command?.version !== 1 ||
    typeof command.token !== 'string' ||
    command.token.length < 16 ||
    command.token.length > 128 ||
    (command.action !== 'start' && command.action !== 'stop')
  ) {
    return null;
  }
  return command as IRecordingCommand;
}

const recorder = installCustomInjectionRecorder();
const repositoryIcons = createCustomInjectionRepositoryIcons(WALLET_CONNECT_INFO);
let activeToken = '';
let stopWalletPickerObserver: () => void = () => undefined;

function report(token: string, payload: Record<string, unknown>) {
  ipcRenderer.sendToHost(CUSTOM_INJECTION_RECORDING_EVENT_CHANNEL, {
    version: 1,
    token,
    ...payload,
  });
}

ipcRenderer.on(CUSTOM_INJECTION_RECORDING_COMMAND_CHANNEL, (_event, value: unknown) => {
  const command = parseCommand(value);
  if (!command) return;
  try {
    if (command.action === 'start') {
      if (activeToken) {
        report(command.token, {
          status: 'error',
          error: 'Custom injection recorder is already active',
        });
        return;
      }
      activeToken = command.token;
      recorder.start();
      stopWalletPickerObserver();
      stopWalletPickerObserver = installCustomInjectionAutoReviewObserver({
        icons: repositoryIcons,
        onDetected: recorder.markWalletPickerDetected,
      });
      report(activeToken, { status: 'started' });
      return;
    }
    if (!activeToken || command.token !== activeToken) {
      report(command.token, {
        status: 'error',
        error: !activeToken
          ? 'Custom injection recorder is not active in this document'
          : 'Custom injection recorder token does not match the active recording',
      });
      return;
    }
    stopWalletPickerObserver();
    stopWalletPickerObserver = () => undefined;
    const recording = recorder.stop();
    const token = activeToken;
    activeToken = '';
    report(token, {
      status: 'completed',
      recording,
    });
  } catch (error) {
    stopWalletPickerObserver();
    stopWalletPickerObserver = () => undefined;
    const token = activeToken || command.token;
    activeToken = '';
    report(token, {
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});
