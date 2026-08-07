import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "defillama",
  protocolId: "4025",
  site: "app.morpho.org",
  startUrl: "https://app.morpho.org/",
  recordingSha256: "4584dc6b37f3da3826810a8920c127b9d5fa445b046b0f78ade5520c884fb2d7",
  actions: [
    {
      action: "click",
      description: "Open the Morpho wallet selection interface",
      locators: [
        {
          kind: "role",
          value: "button:Connect",
          role: "button",
          name: "Connect"
        },
        {
          kind: "css",
          value: "header > div:nth-of-type(1) > div > div > div:nth-of-type(2) > button"
        }
      ],
      readiness: true
    }
  ]
});
