import { pathToFileURL } from 'node:url';

import {
  runDesktopRecordingE2EAndExit,
  validateDesktopRecordingE2ECase,
} from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = validateDesktopRecordingE2ECase({
  schemaVersion: 1,
  kind: 'onekey-connect-button-desktop-e2e',
  source: 'defillama',
  protocolId: '182',
  site: 'stake.lido.fi',
  startUrl: 'https://stake.lido.fi/',
  recordingSha256: '94cdc31a2ef7b073f8f9a2a8985cc616b413876e76d2dc8bb3fc01c03e17e376',
  actions: [
    {
      action: 'press',
      description: 'Wait for the Lido connect control to finish initializing',
      locators: [
        {
          kind: 'testId',
          value: 'connectBtn',
        },
        {
          kind: 'role',
          value: 'button:Connect wallet',
          role: 'button',
          name: 'Connect wallet',
        },
        {
          kind: 'css',
          value: 'form > button',
        },
      ],
      key: 'Escape',
      timeoutMs: 10_000,
      waitAfterMs: 3_000,
    },
    {
      action: 'click',
      description: 'Open the Lido wallet modal from the staking form',
      locators: [
        {
          kind: 'testId',
          value: 'connectBtn',
        },
        {
          kind: 'role',
          value: 'button:Connect wallet',
          role: 'button',
          name: 'Connect wallet',
        },
        {
          kind: 'css',
          value: 'form > button',
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
