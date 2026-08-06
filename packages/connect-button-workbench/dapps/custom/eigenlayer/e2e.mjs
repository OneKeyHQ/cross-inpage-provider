import { pathToFileURL } from 'node:url';

import {
  runDesktopRecordingE2EAndExit,
  validateDesktopRecordingE2ECase,
} from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = validateDesktopRecordingE2ECase({
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "custom",
  protocolId: "eigenlayer",
  site: "app.eigenlayer.xyz",
  startUrl: "https://app.eigenlayer.xyz/",
  recordingSha256: "c2b0b41cd5daa66ccda4561086d07a4cd85e3fc69fc2afdb5d9f380e37c980ab",
  actions: [
    {
      action: "press",
      description: "Wait for the EigenLayer connect control to finish initializing",
      locators: [
        {
          kind: "role",
          value: "button:Connect Wallet",
          role: "button",
          name: "Connect Wallet"
        },
        {
          kind: "text",
          value: "Connect Wallet"
        },
        {
          kind: "css",
          value: "#root button[class~=\"bg-eigen-500\"]"
        },
        {
          kind: "css",
          value: "#root button[class~=\"text-white\"]"
        },
        {
          kind: "css",
          value: "#root button[class~=\"border-eigen-500\"]"
        },
        {
          kind: "css",
          value: "header > div > div:nth-of-type(2) > div > button"
        }
      ],
      timeoutMs: 10000,
      waitAfterMs: 3000,
      key: "Escape"
    },
    {
      action: "click",
      description: "Open the EigenLayer wallet selection modal",
      locators: [
        {
          kind: "role",
          value: "button:Connect Wallet",
          role: "button",
          name: "Connect Wallet"
        },
        {
          kind: "text",
          value: "Connect Wallet"
        },
        {
          kind: "css",
          value: "#root button[class~=\"bg-eigen-500\"]"
        },
        {
          kind: "css",
          value: "#root button[class~=\"text-white\"]"
        },
        {
          kind: "css",
          value: "#root button[class~=\"border-eigen-500\"]"
        },
        {
          kind: "css",
          value: "header > div > div:nth-of-type(2) > div > button"
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
