import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "defillama",
  protocolId: "5901",
  site: "usdt0.to",
  startUrl: "https://usdt0.to/transfer",
  recordingSha256: "119060ad64fe61d5a54f40222ddda12e6e82b6ca2396383d1dfedf6616780970",
  actions: [
    {
      action: "click",
      description: "Open the USDT0 wallet selection modal",
      locators: [
        {
          kind: "role",
          value: "button:Connect",
          role: "button",
          name: "Connect"
        },
        {
          kind: "text",
          value: "Connect"
        },
        {
          kind: "css",
          value: "div:nth-of-type(3) > div > button"
        }
      ],
      readiness: true
    }
  ]
});
