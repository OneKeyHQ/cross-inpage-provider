import { pathToFileURL } from 'node:url';

import {
  runDesktopRecordingE2EAndExit,
  validateDesktopRecordingE2ECase,
} from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = validateDesktopRecordingE2ECase({
  schemaVersion: 1,
  kind: 'onekey-connect-button-desktop-e2e',
  source: 'defillama',
  protocolId: '4867',
  site: 'stargate.finance',
  startUrl: 'https://stargate.finance/',
  recordingSha256: 'cedf7dde178b70bc9378613c05be4360d0f59c1c5044719ec6753665c740a675',
  actions: [
    {
      action: 'press',
      description: 'Wait for the Stargate connect control to finish initializing',
      locators: [
        {
          kind: 'role',
          value: 'button:Connect Wallet',
          role: 'button',
          name: 'Connect Wallet',
        },
        {
          kind: 'text',
          value: 'Connect Wallet',
        },
        {
          kind: 'css',
          value: 'header > div:nth-of-type(2) > div > button',
        },
      ],
      key: 'Escape',
      timeoutMs: 10_000,
      waitAfterMs: 3_000,
    },
    {
      action: 'click',
      description: 'Open the Stargate wallet selection modal',
      locators: [
        {
          kind: 'role',
          value: 'button:Connect Wallet',
          role: 'button',
          name: 'Connect Wallet',
        },
        {
          kind: 'text',
          value: 'Connect Wallet',
        },
        {
          kind: 'css',
          value: 'header > div:nth-of-type(2) > div > button',
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
