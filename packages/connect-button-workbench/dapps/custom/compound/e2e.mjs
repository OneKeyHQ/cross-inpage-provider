import { pathToFileURL } from 'node:url';

import {
  runDesktopRecordingE2EAndExit,
  validateDesktopRecordingE2ECase,
} from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = validateDesktopRecordingE2ECase({
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "custom",
  protocolId: "compound",
  site: "app.compound.finance",
  startUrl: "https://app.compound.finance/?market=usdc-mainnet",
  recordingSha256: "3f6fe432d4e4478982072cd3e9d28950f250d2f0498364937b5e7290b9e2e66b",
  actions: [
    {
      action: "press",
      description: "Wait for the Compound connect control to finish initializing",
      locators: [
        {
          kind: "css",
          value: "div:nth-of-type(3) > svg > g:nth-of-type(1) > rect"
        }
      ],
      timeoutMs: 10000,
      waitAfterMs: 3000,
      key: "Escape"
    },
    {
      action: "click",
      description: "Open the Compound wallet selection modal",
      locators: [
        {
          kind: "css",
          value: "div:nth-of-type(3) > svg > g:nth-of-type(1) > rect"
        }
      ],
      timeoutMs: 10000,
      waitAfterMs: 1000
    }
  ]
});

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runDesktopRecordingE2EAndExit(testCase);
}
