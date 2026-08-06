import { pathToFileURL } from 'node:url';

import {
  runDesktopRecordingE2EAndExit,
  validateDesktopRecordingE2ECase,
} from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = validateDesktopRecordingE2ECase({
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "defillama",
  protocolId: "3107",
  site: "app.eigenlayer.xyz",
  startUrl: "https://app.eigenlayer.xyz/",
  recordingSha256: "c9913ee7947238e02f44c9b8eaba5269a58ff67e49eb1fd1096fa7a27ef6b5cb",
  actions: [
    {
      action: "press",
      description: "Wait for the EigenCloud connect control to finish initializing",
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
      description: "Open the EigenCloud wallet selection modal",
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
