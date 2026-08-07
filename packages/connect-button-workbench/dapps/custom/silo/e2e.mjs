import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "custom",
  protocolId: "silo",
  site: "app.silo.finance",
  startUrl: "https://app.silo.finance/explore",
  recordingSha256: "5802ddd63b77813de67b6432f9f45e9e44b3aace6e777a082d6dba450b9495ce",
  actions: [
    {
      action: "click",
      description: "Open the Silo wallet selection modal",
      locators: [
        {
          kind: "css",
          value: "nav:nth-of-type(2) > div > div:nth-of-type(2) > div > button:nth-of-type(2)"
        },
        {
          kind: "role",
          value: "button:Connect",
          role: "button",
          name: "Connect"
        },
        {
          kind: "text",
          value: "Connect"
        }
      ],
      readiness: true
    }
  ]
});
