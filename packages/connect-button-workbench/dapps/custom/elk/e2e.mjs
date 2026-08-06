import { pathToFileURL } from 'node:url';

import {
  runDesktopRecordingE2EAndExit,
  validateDesktopRecordingE2ECase,
} from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = validateDesktopRecordingE2ECase({
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "custom",
  protocolId: "elk",
  site: "app.elk.finance",
  startUrl: "https://app.elk.finance/",
  recordingSha256: "1c718a757db0dfcb33202222d19f1c4d3054185807ffc2bf678b25bdfeb9f513",
  actions: [
    {
      action: "press",
      description: "Wait for the Elk connect control to finish initializing",
      locators: [
        {
          kind: "css",
          value: "#root > div > div:nth-of-type(2) > div > div:nth-of-type(2) > div > div:nth-of-type(3) > button:nth-of-type(1)"
        },
        {
          kind: "css",
          value: "div:nth-of-type(2) > div > div:nth-of-type(3) > button:nth-of-type(1)"
        },
        {
          kind: "id",
          value: "connect-wallet"
        },
        {
          kind: "role",
          value: "button:Connect to a wallet",
          role: "button",
          name: "Connect to a wallet"
        },
        {
          kind: "text",
          value: "Connect to a wallet"
        }
      ],
      timeoutMs: 10000,
      waitAfterMs: 3000,
      key: "Escape"
    },
    {
      action: "click",
      description: "Open the Elk wallet selection modal",
      locators: [
        {
          kind: "css",
          value: "#root > div > div:nth-of-type(2) > div > div:nth-of-type(2) > div > div:nth-of-type(3) > button:nth-of-type(1)"
        },
        {
          kind: "css",
          value: "div:nth-of-type(2) > div > div:nth-of-type(3) > button:nth-of-type(1)"
        },
        {
          kind: "id",
          value: "connect-wallet"
        },
        {
          kind: "role",
          value: "button:Connect to a wallet",
          role: "button",
          name: "Connect to a wallet"
        },
        {
          kind: "text",
          value: "Connect to a wallet"
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
