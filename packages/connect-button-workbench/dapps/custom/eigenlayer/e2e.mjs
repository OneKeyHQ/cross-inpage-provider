import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "custom",
  protocolId: "eigenlayer",
  site: "app.eigenlayer.xyz",
  startUrl: "https://app.eigenlayer.xyz/",
  recordingSha256: "c2b0b41cd5daa66ccda4561086d07a4cd85e3fc69fc2afdb5d9f380e37c980ab",
  actions: [
    {
      action: "click",
      description: "Open the EigenLayer wallet selection modal",
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
          value: "#root button[class~=\"bg-eigen-500\"]"
        },
        {
          kind: "css",
          value: "#root button[class~=\"text-white\"]"
        },
        {
          kind: "css",
          value: "#root button[class~=\"border-eigen-500\"]"
        },
        {
          kind: "css",
          value: "header > div > div:nth-of-type(2) > div > button"
        }
      ],
      readiness: true
    }
  ]
});
