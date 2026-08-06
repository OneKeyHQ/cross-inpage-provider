import { pathToFileURL } from 'node:url';

import {
  runDesktopRecordingE2EAndExit,
  validateDesktopRecordingE2ECase,
} from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = validateDesktopRecordingE2ECase({
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "defillama",
  protocolId: "4853",
  site: "stocks.securitize.io",
  startUrl: "https://stocks.securitize.io/trading",
  recordingSha256: "7c97d2bfd3b6b049170f0947b07b5338b7c240588a2aac14e8c71a6f9923997a",
  actions: [
    {
      action: "press",
      description: "Wait for the BlackRock BUIDL connect control to finish initializing",
      locators: [
        {
          kind: "testId",
          value: "calculator-cta"
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
        },
        {
          kind: "css",
          value: "div:nth-of-type(6) > button"
        }
      ],
      timeoutMs: 10000,
      waitAfterMs: 3000,
      key: "Escape"
    },
    {
      action: "click",
      description: "Open the BlackRock BUIDL wallet selection modal",
      locators: [
        {
          kind: "testId",
          value: "calculator-cta"
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
        },
        {
          kind: "css",
          value: "div:nth-of-type(6) > button"
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
