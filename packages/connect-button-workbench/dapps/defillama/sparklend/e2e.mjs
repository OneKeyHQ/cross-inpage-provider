import { pathToFileURL } from 'node:url';

import {
  runDesktopRecordingE2EAndExit,
  validateDesktopRecordingE2ECase,
} from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = validateDesktopRecordingE2ECase({
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "defillama",
  protocolId: "2929",
  site: "app.spark.finance",
  startUrl: "https://app.spark.finance/",
  recordingSha256: "682aa413bf2581555a9420db7f619e8155530f3f0250613f26e6e79835de70ef",
  actions: [
    {
      action: "press",
      description: "Wait for the SparkLend connect control to finish initializing",
      locators: [
        {
          kind: "css",
          value: "#root > div > div:nth-of-type(4) > nav > div:nth-of-type(3) > div > button"
        },
        {
          kind: "css",
          value: "nav > div:nth-of-type(3) > div > button"
        },
        {
          kind: "role",
          value: "button:Connect Wallet",
          role: "button",
          name: "Connect Wallet"
        },
        {
          kind: "text",
          value: "Connect Wallet"
        }
      ],
      timeoutMs: 10000,
      waitAfterMs: 3000,
      key: "Escape"
    },
    {
      action: "click",
      description: "Open the SparkLend wallet selection modal",
      locators: [
        {
          kind: "css",
          value: "#root > div > div:nth-of-type(4) > nav > div:nth-of-type(3) > div > button"
        },
        {
          kind: "css",
          value: "nav > div:nth-of-type(3) > div > button"
        },
        {
          kind: "role",
          value: "button:Connect Wallet",
          role: "button",
          name: "Connect Wallet"
        },
        {
          kind: "text",
          value: "Connect Wallet"
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
