import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "custom",
  protocolId: "1inch",
  site: "1inch.com",
  startUrl: "https://1inch.com/",
  recordingSha256: "a77408a0595c66e3a4cf7d2e22e81f09c9e15551d71a19932dd19076d7c1ac10",
  actions: [
    {
      action: "click",
      description: "Open the 1inch wallet selection modal",
      locators: [
        {
          kind: "role",
          value: "button:Connect wallet",
          role: "button",
          name: "Connect wallet"
        },
        {
          kind: "text",
          value: "Connect wallet"
        },
        {
          kind: "css",
          value: "oi-account-box-button-slot > button"
        }
      ],
      readiness: true
    }
  ]
});
