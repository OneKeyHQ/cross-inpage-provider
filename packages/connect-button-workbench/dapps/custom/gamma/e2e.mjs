import { pathToFileURL } from 'node:url';

import {
  runDesktopRecordingE2EAndExit,
  validateDesktopRecordingE2ECase,
} from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = validateDesktopRecordingE2ECase({
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "custom",
  protocolId: "gamma",
  site: "gamma.io",
  startUrl: "https://gamma.io/ordinals/collections/soft-eulogies-domain-1-light/items",
  recordingSha256: "b4e8f9147a2184176607884787dd83e7b7a4f040385e5ceecfa82074e270663b",
  actions: [
    {
      action: "click",
      description: "Replay recorded click on button",
      locators: [
        {
          kind: "css",
          value: "#root > div:nth-of-type(4) > div:nth-of-type(2) > div:nth-of-type(1) > button:nth-of-type(2)"
        },
        {
          kind: "css",
          value: "div:nth-of-type(2) > div:nth-of-type(1) > button:nth-of-type(2)"
        }
      ],
      timeoutMs: 10000,
      waitAfterMs: 750
    },
    {
      action: "press",
      description: "Wait for the Gamma connect control to finish initializing",
      locators: [
        {
          kind: "role",
          value: "button:Connect wallet",
          role: "button",
          name: "Connect wallet"
        },
        {
          kind: "text",
          value: "Connect wallet"
        },
        {
          kind: "css",
          value: "#root > div:nth-of-type(5) > div:nth-of-type(1) > div:nth-of-type(3) > button"
        },
        {
          kind: "css",
          value: "div:nth-of-type(5) > div:nth-of-type(1) > div:nth-of-type(3) > button"
        }
      ],
      timeoutMs: 10000,
      waitAfterMs: 3000,
      key: "Escape"
    },
    {
      action: "click",
      description: "Open the Gamma wallet selection modal",
      locators: [
        {
          kind: "role",
          value: "button:Connect wallet",
          role: "button",
          name: "Connect wallet"
        },
        {
          kind: "text",
          value: "Connect wallet"
        },
        {
          kind: "css",
          value: "#root > div:nth-of-type(5) > div:nth-of-type(1) > div:nth-of-type(3) > button"
        },
        {
          kind: "css",
          value: "div:nth-of-type(5) > div:nth-of-type(1) > div:nth-of-type(3) > button"
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
