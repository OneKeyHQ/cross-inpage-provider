import { pathToFileURL } from 'node:url';

import {
  runDesktopRecordingE2EAndExit,
  validateDesktopRecordingE2ECase,
} from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = validateDesktopRecordingE2ECase({
  schemaVersion: 1,
  kind: 'onekey-connect-button-desktop-e2e',
  source: 'defillama',
  protocolId: '118',
  site: 'app.sky.money',
  startUrl: 'https://app.sky.money/',
  recordingSha256: '829d0c1b0876c26192c16545a61ce49e9872f661721292bf6375bc671c817fc0',
  actions: [
    {
      action: 'press',
      description: 'Wait for the Sky connect control to finish initializing',
      locators: [
        {
          kind: 'css',
          value:
            '[data-testid="widget-container"] button[class~="font-circle"][class~="w-full"]',
        },
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
      ],
      key: 'Escape',
      timeoutMs: 10_000,
      waitAfterMs: 3_000,
    },
    {
      action: 'click',
      description: 'Open the Sky wallet selection modal',
      locators: [
        {
          kind: 'css',
          value:
            '[data-testid="widget-container"] button[class~="font-circle"][class~="w-full"]',
        },
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
      ],
      timeoutMs: 10_000,
      waitAfterMs: 1_000,
    },
  ],
});

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runDesktopRecordingE2EAndExit(testCase);
}
