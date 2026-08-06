import { pathToFileURL } from 'node:url';

import {
  runDesktopRecordingE2EAndExit,
  validateDesktopRecordingE2ECase,
} from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = validateDesktopRecordingE2ECase({
  schemaVersion: 1,
  kind: 'onekey-connect-button-desktop-e2e',
  source: 'defillama',
  protocolId: '4481',
  site: 'app.hyperliquid.xyz',
  startUrl: 'https://app.hyperliquid.xyz/',
  recordingSha256: 'b2055fe708da08217e1782ea761ac4359e20bc9d6eeb4d3f8d32c1b30492aa6f',
  actions: [
    {
      action: 'press',
      description: 'Wait for the Hyperliquid connect control to finish initializing',
      locators: [
        {
          kind: 'css',
          value:
            'div:nth-of-type(3) > div:nth-of-type(1) > div > div > div:nth-of-type(2) > button',
        },
        {
          kind: 'role',
          value: 'button:Connect',
          role: 'button',
          name: 'Connect',
        },
        {
          kind: 'text',
          value: 'Connect',
        },
      ],
      key: 'Escape',
      timeoutMs: 15_000,
      waitAfterMs: 3_000,
    },
    {
      action: 'click',
      description: 'Open the Hyperliquid wallet selection modal',
      locators: [
        {
          kind: 'css',
          value:
            'div:nth-of-type(3) > div:nth-of-type(1) > div > div > div:nth-of-type(2) > button',
        },
        {
          kind: 'role',
          value: 'button:Connect',
          role: 'button',
          name: 'Connect',
        },
        {
          kind: 'text',
          value: 'Connect',
        },
      ],
      timeoutMs: 15_000,
      waitAfterMs: 1_000,
    },
  ],
});

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runDesktopRecordingE2EAndExit(testCase);
}
