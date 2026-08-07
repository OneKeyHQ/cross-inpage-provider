import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "custom",
  protocolId: "stargate-finance",
  site: "stargate.finance",
  startUrl: "https://stargate.finance/",
  recordingSha256: "c9b0dae8161e70c282240b74b6f2fb84d288752b91519c5534bb5d5ba676fde8",
  actions: [
    {
      action: "click",
      description: "Open the Stargate wallet selection modal",
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
          value: "header > div:nth-of-type(2) > div > button"
        }
      ],
      readiness: true
    }
  ]
});
