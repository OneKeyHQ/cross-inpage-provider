import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "custom",
  protocolId: "hyperliquid",
  site: "app.hyperliquid.xyz",
  startUrl: "https://app.hyperliquid.xyz/",
  recordingSha256: "5cd79563d2eeb07a99e0bc4e982474374904de64f49fe7a488959d79e6dbf388",
  actions: [
    {
      action: "click",
      description: "Open the Hyperliquid wallet selection modal",
      locators: [
        {
          kind: "css",
          value: "#root button[class~=\"dfFRVV\"]"
        },
        {
          kind: "css",
          value: "#root > div:nth-of-type(3) > div:nth-of-type(1) > div > div > div:nth-of-type(2) > button"
        },
        {
          kind: "css",
          value: "div:nth-of-type(3) > div:nth-of-type(1) > div > div > div:nth-of-type(2) > button"
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
