import { pathToFileURL } from 'node:url';

import {
  runDesktopRecordingE2EAndExit,
  validateDesktopRecordingE2ECase,
} from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = validateDesktopRecordingE2ECase({
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "defillama",
  protocolId: "5901",
  site: "usdt0.to",
  startUrl: "https://usdt0.to/transfer",
  recordingSha256: "119060ad64fe61d5a54f40222ddda12e6e82b6ca2396383d1dfedf6616780970",
  actions: [
    {
      action: "press",
      description: "Wait for the USDT0 connect control to finish initializing",
      locators: [
        {
          kind: "role",
          value: "button:Connect",
          role: "button",
          name: "Connect"
        },
        {
          kind: "text",
          value: "Connect"
        },
        {
          kind: "css",
          value: "div:nth-of-type(3) > div > button"
        }
      ],
      timeoutMs: 10000,
      waitAfterMs: 3000,
      key: "Escape"
    },
    {
      action: "click",
      description: "Open the USDT0 wallet selection modal",
      locators: [
        {
          kind: "role",
          value: "button:Connect",
          role: "button",
          name: "Connect"
        },
        {
          kind: "text",
          value: "Connect"
        },
        {
          kind: "css",
          value: "div:nth-of-type(3) > div > button"
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
