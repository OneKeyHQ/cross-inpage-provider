import { pathToFileURL } from 'node:url';

import {
  runDesktopRecordingE2EAndExit,
  validateDesktopRecordingE2ECase,
} from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = validateDesktopRecordingE2ECase({
  schemaVersion: 1,
  kind: 'onekey-connect-button-desktop-e2e',
  source: 'defillama',
  protocolId: '4025',
  site: 'app.morpho.org',
  startUrl: 'https://app.morpho.org/',
  recordingSha256: '4584dc6b37f3da3826810a8920c127b9d5fa445b046b0f78ade5520c884fb2d7',
  actions: [
    {
      action: 'press',
      description: 'Wait for the Morpho connect control to finish initializing',
      locators: [
        {
          kind: 'role',
          value: 'button:Connect',
          role: 'button',
          name: 'Connect',
        },
        {
          kind: 'css',
          value:
            'header > div:nth-of-type(1) > div > div > div:nth-of-type(2) > button',
        },
      ],
      key: 'Escape',
      timeoutMs: 10_000,
      waitAfterMs: 3_000,
    },
    {
      action: 'click',
      description: 'Open the Morpho wallet selection interface',
      locators: [
        {
          kind: 'role',
          value: 'button:Connect',
          role: 'button',
          name: 'Connect',
        },
        {
          kind: 'css',
          value:
            'header > div:nth-of-type(1) > div > div > div:nth-of-type(2) > button',
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
