import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "defillama",
  protocolId: "2542",
  site: "app.ondo.finance",
  startUrl: "https://app.ondo.finance/",
  recordingSha256: "6dbbca3ab10f2322b6ef38b5727bdea7eafe8e0fef7cd2ac9eac1fba7b1fc7de",
  actions: [
    {
      action: "click",
      description: "Open the Ondo Yield Assets wallet selection modal",
      locators: [
        {
          kind: "testId",
          value: "connect-wallet-button"
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
          value: "div:nth-of-type(3) > button"
        }
      ],
      readiness: true
    }
  ]
});
