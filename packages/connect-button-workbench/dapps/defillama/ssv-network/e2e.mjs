import { pathToFileURL } from 'node:url';

import {
  runDesktopRecordingE2EAndExit,
  validateDesktopRecordingE2ECase,
} from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = validateDesktopRecordingE2ECase({
  schemaVersion: 1,
  kind: 'onekey-connect-button-desktop-e2e',
  source: 'defillama',
  protocolId: '6359',
  site: 'app.ssv.network',
  startUrl: 'https://app.ssv.network/',
  recordingSha256: 'bf1d24bb859e163f169fb86640e671614c21698eaa29260fc92d31836287aa22',
  actions: [
    {
      action: 'press',
      description: 'Wait for the SSV Network connect control to finish initializing',
      locators: [
        {
          kind: 'dataCy',
          value: 'connect-btn',
        },
        {
          kind: 'role',
          value: 'button:Connect Wallet',
          role: 'button',
          name: 'Connect Wallet',
        },
        {
          kind: 'css',
          value: 'main > div > button',
        },
      ],
      key: 'Escape',
      timeoutMs: 10_000,
      waitAfterMs: 3_000,
    },
    {
      action: 'click',
      description: 'Open the SSV Network wallet selection modal',
      locators: [
        {
          kind: 'dataCy',
          value: 'connect-btn',
        },
        {
          kind: 'role',
          value: 'button:Connect Wallet',
          role: 'button',
          name: 'Connect Wallet',
        },
        {
          kind: 'css',
          value: 'main > div > button',
        },
      ],
      timeoutMs: 10_000,
      waitAfterMs: 1_000,
    },
  ],
});

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runDesktopRecordingE2EAndExit(testCase);
}
