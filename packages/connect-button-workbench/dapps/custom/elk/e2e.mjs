import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "custom",
  protocolId: "elk",
  site: "app.elk.finance",
  startUrl: "https://app.elk.finance/",
  recordingSha256: "1c718a757db0dfcb33202222d19f1c4d3054185807ffc2bf678b25bdfeb9f513",
  actions: [
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
      readiness: true
    }
  ]
});
