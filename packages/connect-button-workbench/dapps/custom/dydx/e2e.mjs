import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "custom",
  protocolId: "dydx",
  site: "trade.dydx.exchange",
  startUrl: "https://trade.dydx.exchange/",
  recordingSha256: "a619f763d2e820a82c1df4c971a012a7b5f7585ea86c84b9aab60a11445c4b76",
  actions: [
    {
      action: "click",
      description: "Replay recorded click on Connect wallet",
      locators: [
        {
          kind: "css",
          value: "div:nth-of-type(1) > div > div > div > button"
        },
        {
          kind: "role",
          value: "button:Connect wallet",
          role: "button",
          name: "Connect wallet"
        },
        {
          kind: "text",
          value: "Connect wallet"
        }
      ]
    },
    {
      action: "click",
      description: "Open the dYdX wallet selection modal",
      locators: [
        {
          kind: "role",
          value: "button:Get started",
          role: "button",
          name: "Get started"
        },
        {
          kind: "text",
          value: "Get started"
        },
        {
          kind: "css",
          value: "#root > div > div:nth-of-type(1) > div > div > div > div:nth-of-type(2) > div:nth-of-type(2) > button"
        },
        {
          kind: "css",
          value: "div:nth-of-type(2) > button"
        }
      ],
      readiness: true
    }
  ]
});
