import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "custom",
  protocolId: "ordinalswallet",
  site: "ordinalswallet.com",
  startUrl: "https://ordinalswallet.com/",
  recordingSha256: "eec89f37cb125876b8bab9e3fbaa4be899fef0cd79e9651ad30bf0b65ce95a31",
  actions: [
    {
      action: "click",
      description: "Open the Ordinals Wallet wallet selection modal",
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
          value: "div:nth-of-type(3) > button:nth-of-type(2)"
        }
      ],
      readiness: true
    }
  ]
});
