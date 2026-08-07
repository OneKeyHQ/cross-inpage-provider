import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "defillama",
  protocolId: "4481",
  site: "app.hyperliquid.xyz",
  startUrl: "https://app.hyperliquid.xyz/",
  recordingSha256: "b2055fe708da08217e1782ea761ac4359e20bc9d6eeb4d3f8d32c1b30492aa6f",
  actions: [
    {
      action: "click",
      description: "Open the Hyperliquid wallet selection modal",
      locators: [
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
      timeoutMs: 15000,
      readiness: true
    }
  ]
});
