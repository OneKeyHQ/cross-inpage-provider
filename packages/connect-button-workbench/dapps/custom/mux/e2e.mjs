import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "custom",
  protocolId: "mux",
  site: "app.mux.network",
  startUrl: "https://app.mux.network/",
  recordingSha256: "725ff75299d64180f909a0f4e189d9efafb43c81ae8ce09c2170fb74d5095207",
  actions: [
    {
      action: "click",
      description: "Open the MUX wallet selection modal",
      locators: [
        {
          kind: "css",
          value: "section > div:nth-of-type(2) > div > button"
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
      readiness: true
    }
  ]
});
