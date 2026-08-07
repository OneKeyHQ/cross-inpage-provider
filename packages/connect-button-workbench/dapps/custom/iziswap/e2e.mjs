import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "custom",
  protocolId: "iziswap",
  site: "izumi.finance",
  startUrl: "https://izumi.finance/",
  recordingSha256: "6877dc8ec45635fedf59bfcf57f5bfbc7cfaac10f5096952dacb597a216a6d68",
  actions: [
    {
      action: "click",
      description: "Open the iZiSwap wallet selection modal",
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
          value: "#root > div:nth-of-type(1) > div > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > button"
        },
        {
          kind: "css",
          value: "div > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > button"
        }
      ],
      readiness: true
    }
  ]
});
