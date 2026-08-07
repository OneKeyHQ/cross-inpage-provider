import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "custom",
  protocolId: "idclub",
  site: "idclub.io",
  startUrl: "https://idclub.io/marketplace",
  recordingSha256: "84fb65878f14c609a436c2b51f5d19a647dbb64f5c4cf0d32d23700b1cc1e851",
  actions: [
    {
      action: "click",
      description: "Open the ID Club wallet selection modal",
      locators: [
        {
          kind: "css",
          value: "div:nth-of-type(3) > div > div > h1"
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
