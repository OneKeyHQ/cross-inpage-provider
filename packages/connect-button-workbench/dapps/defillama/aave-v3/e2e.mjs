import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "defillama",
  protocolId: "1599",
  site: "app.aave.com",
  startUrl: "https://app.aave.com/",
  recordingSha256: "3d6a413df8fb8ea51c2cb82b19f5bf72204d8588a55d20b5a34fdfbac20a7a67",
  actions: [
    {
      action: "click",
      description: "Open the Aave wallet selection modal",
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
          value: "header:nth-of-type(2) > button"
        }
      ],
      readiness: true
    }
  ]
});
