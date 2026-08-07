import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "custom",
  protocolId: "indexcoop",
  site: "app.indexcoop.com",
  startUrl: "https://app.indexcoop.com/trade",
  recordingSha256: "df443f0c3a64e18fd679fa86f2077d3613eb2ade1fbaa59c9237a4e5970e3666",
  actions: [
    {
      action: "click",
      description: "Open the Index Coop wallet selection modal",
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
          value: "#close-position-scroll button[class~=\"text-ic-white\"]"
        },
        {
          kind: "css",
          value: "#close-position-scroll button[class~=\"px-6\"]"
        },
        {
          kind: "css",
          value: "#close-position-scroll button[class~=\"py-4\"]"
        },
        {
          kind: "css",
          value: "div > div > div:nth-of-type(1) > div:nth-of-type(2) > div > button"
        }
      ],
      readiness: true
    }
  ]
});
